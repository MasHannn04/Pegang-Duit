import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/db';
import { getTanggalHariIni } from './format';

interface DataCadangan {
  versi: number;
  aplikasi: string;
  waktu_ekspor: string;
  data: {
    jenis_keuangan?: any[];
    jenis_keuangan_periode?: any[];
    kategori?: any[];
    transaksi: any[];
    dompet_fisik: any[];
    log_rekonsiliasi: any[];
    pengaturan?: any[];
    alokasi_anggaran?: any[];
    alokasi_pendapatan?: any[];
    alokasi_pos?: any[];
    alokasi_subpos?: any[];
  };
}

/**
 * Mengekspor seluruh database aplikasi ke dalam satu file cadangan .json
 * yang dapat disimpan di Google Drive, WA, atau memori internal HP.
 */
export const eksporCadanganData = async (): Promise<string> => {
  const db = await getDatabase();

  const jenis_keuangan = await db.getAllAsync('SELECT * FROM jenis_keuangan');
  const jenis_keuangan_periode = await db.getAllAsync('SELECT * FROM jenis_keuangan_periode');
  const kategori = await db.getAllAsync('SELECT * FROM kategori');
  const transaksi = await db.getAllAsync('SELECT * FROM transaksi');
  const dompet_fisik = await db.getAllAsync('SELECT * FROM dompet_fisik');
  const log_rekonsiliasi = await db.getAllAsync('SELECT * FROM log_rekonsiliasi');
  const pengaturan = await db.getAllAsync('SELECT * FROM pengaturan');
  const alokasi_anggaran = await db.getAllAsync('SELECT * FROM alokasi_anggaran');
  const alokasi_pendapatan = await db.getAllAsync('SELECT * FROM alokasi_pendapatan');
  const alokasi_pos = await db.getAllAsync('SELECT * FROM alokasi_pos');
  const alokasi_subpos = await db.getAllAsync('SELECT * FROM alokasi_subpos');

  const payload: DataCadangan = {
    versi: 4,
    aplikasi: 'Pegang Duit',
    waktu_ekspor: new Date().toISOString(),
    data: {
      jenis_keuangan,
      jenis_keuangan_periode,
      kategori,
      transaksi,
      dompet_fisik,
      log_rekonsiliasi,
      pengaturan,
      alokasi_anggaran,
      alokasi_pendapatan,
      alokasi_pos,
      alokasi_subpos,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const tanggal = getTanggalHariIni();
  const namaFile = `PegangDuit_Backup_${tanggal}.json`;
  const pathFile = `${FileSystem.documentDirectory}${namaFile}`;

  await FileSystem.writeAsStringAsync(pathFile, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(pathFile, {
      mimeType: 'application/json',
      dialogTitle: 'Simpan File Cadangan Pegang Duit',
    });
  }

  return pathFile;
};

/**
 * Memulihkan data dari file cadangan .json saat pengguna ganti HP baru.
 */
export const pulihkanCadanganData = async (): Promise<{
  sukses: boolean;
  pesan: string;
  jumlahTransaksi?: number;
}> => {
  try {
    const hasilPicker = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (hasilPicker.canceled || !hasilPicker.assets || hasilPicker.assets.length === 0) {
      return { sukses: false, pesan: 'Pemilihan file dibatalkan' };
    }

    const fileUri = hasilPicker.assets[0].uri;
    const kontenJson = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed: DataCadangan = JSON.parse(kontenJson);

    if (!parsed.aplikasi || parsed.aplikasi !== 'Pegang Duit' || !parsed.data) {
      return {
        sukses: false,
        pesan: 'Format file tidak valid. Pastikan memilih file cadangan Pegang Duit.',
      };
    }

    const db = await getDatabase();

    // Hapus data lama dan gantikan dengan data cadangan dalam transaksi atomik
    await db.execAsync('BEGIN TRANSACTION;');

    try {
      // 1. Pulihkan Jenis Keuangan jika ada di file cadangan
      if (parsed.data.jenis_keuangan && parsed.data.jenis_keuangan.length > 0) {
        await db.execAsync('DELETE FROM jenis_keuangan;');
        for (const j of parsed.data.jenis_keuangan) {
          await db.runAsync(
            `INSERT INTO jenis_keuangan (id, kode, nama, ikon, warna, is_default, is_arsip, urutan, dibuat_pada)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            j.id,
            j.kode,
            j.nama,
            j.ikon || 'wallet',
            j.warna || '#2563EB',
            j.is_default ?? 0,
            j.is_arsip ?? 0,
            j.urutan ?? 0,
            j.dibuat_pada || new Date().toISOString()
          );
        }
      }

      // 2. Pulihkan Setting Jenis Keuangan Periode jika ada
      if (parsed.data.jenis_keuangan_periode && parsed.data.jenis_keuangan_periode.length > 0) {
        await db.execAsync('DELETE FROM jenis_keuangan_periode;');
        for (const jp of parsed.data.jenis_keuangan_periode) {
          await db.runAsync(
            `INSERT INTO jenis_keuangan_periode (periode_bulan, jenis_id, is_aktif)
             VALUES (?, ?, ?)`,
            jp.periode_bulan,
            jp.jenis_id,
            jp.is_aktif ?? 1
          );
        }
      }

      // 3. Pulihkan Kategori jika ada
      if (parsed.data.kategori && parsed.data.kategori.length > 0) {
        await db.execAsync('DELETE FROM kategori;');
        for (const k of parsed.data.kategori) {
          await db.runAsync(
            `INSERT INTO kategori (id, nama, tipe, ikon, warna, urutan, dibuat_pada)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            k.id,
            k.nama,
            k.tipe,
            k.ikon,
            k.warna,
            k.urutan ?? 0,
            k.dibuat_pada || new Date().toISOString()
          );
        }
      }

      // 4. Pulihkan Transaksi (mendukung kategori_id, jenis_keuangan_id, dan jenis_buku versi lama)
      await db.execAsync('DELETE FROM transaksi;');
      for (const t of parsed.data.transaksi || []) {
        let jenisId = t.jenis_keuangan_id;
        if (!jenisId && t.jenis_buku) {
          jenisId = t.jenis_buku === 'kas' ? 2 : 1;
        }

        await db.runAsync(
          `INSERT INTO transaksi (id, jenis_keuangan_id, kategori_id, tanggal, keterangan, tipe, nominal, dibuat_pada)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          t.id,
          jenisId || 1,
          t.kategori_id ?? null,
          t.tanggal,
          t.keterangan,
          t.tipe,
          t.nominal,
          t.dibuat_pada || new Date().toISOString()
        );
      }

      // 4. Pulihkan Dompet Fisik
      await db.execAsync('DELETE FROM dompet_fisik;');
      for (const d of parsed.data.dompet_fisik || []) {
        await db.runAsync(
          `INSERT INTO dompet_fisik (id, nama, saldo_sekarang, is_default, diperbarui_pada)
           VALUES (?, ?, ?, ?, ?)`,
          d.id,
          d.nama,
          d.saldo_sekarang,
          d.is_default ?? (d.id === 1 ? 1 : 0),
          d.diperbarui_pada || new Date().toISOString()
        );
      }

      // 5. Pulihkan Log Rekonsiliasi jika ada
      await db.execAsync('DELETE FROM log_rekonsiliasi;');
      for (const r of parsed.data.log_rekonsiliasi || []) {
        await db.runAsync(
          `INSERT INTO log_rekonsiliasi (id, periode_bulan, total_fisik, saldo_pribadi, saldo_kas, selisih, diaudit_pada)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          r.id,
          r.periode_bulan,
          r.total_fisik,
          r.saldo_pribadi || 0,
          r.saldo_kas || 0,
          r.selisih || 0,
          r.diaudit_pada || new Date().toISOString()
        );
      }

      // 6. Pulihkan Pengaturan jika ada
      if (parsed.data.pengaturan && parsed.data.pengaturan.length > 0) {
        for (const p of parsed.data.pengaturan) {
          await db.runAsync(
            `INSERT OR REPLACE INTO pengaturan (kunci, nilai) VALUES (?, ?)`,
            p.kunci,
            p.nilai
          );
        }
      }

      // 7. Pulihkan Alokasi Anggaran & FIRE jika ada
      if (parsed.data.alokasi_anggaran && parsed.data.alokasi_anggaran.length > 0) {
        await db.execAsync('DELETE FROM alokasi_subpos;');
        await db.execAsync('DELETE FROM alokasi_pos;');
        await db.execAsync('DELETE FROM alokasi_pendapatan;');
        await db.execAsync('DELETE FROM alokasi_anggaran;');

        for (const a of parsed.data.alokasi_anggaran) {
          await db.runAsync(
            `INSERT INTO alokasi_anggaran (id, periode_bulan, total_pendapatan, catatan, dibuat_pada, diperbarui_pada)
             VALUES (?, ?, ?, ?, ?, ?)`,
            a.id,
            a.periode_bulan,
            a.total_pendapatan,
            a.catatan || '',
            a.dibuat_pada || new Date().toISOString(),
            a.diperbarui_pada || new Date().toISOString()
          );
        }

        for (const ap of parsed.data.alokasi_pendapatan || []) {
          await db.runAsync(
            `INSERT INTO alokasi_pendapatan (id, alokasi_id, nama_sumber, nominal, urutan)
             VALUES (?, ?, ?, ?, ?)`,
            ap.id,
            ap.alokasi_id,
            ap.nama_sumber,
            ap.nominal,
            ap.urutan || 0
          );
        }

        for (const pos of parsed.data.alokasi_pos || []) {
          await db.runAsync(
            `INSERT INTO alokasi_pos (id, alokasi_id, tipe_pos, target_nominal, target_persen)
             VALUES (?, ?, ?, ?, ?)`,
            pos.id,
            pos.alokasi_id,
            pos.tipe_pos,
            pos.target_nominal,
            pos.target_persen
          );
        }

        for (const sp of parsed.data.alokasi_subpos || []) {
          await db.runAsync(
            `INSERT INTO alokasi_subpos (id, pos_id, nama_subpos, nominal, urutan)
             VALUES (?, ?, ?, ?, ?)`,
            sp.id,
            sp.pos_id,
            sp.nama_subpos,
            sp.nominal,
            sp.urutan || 0
          );
        }
      }

      await db.execAsync('COMMIT;');

      return {
        sukses: true,
        pesan: 'Data berhasil dipulihkan sepenuhnya!',
        jumlahTransaksi: parsed.data.transaksi?.length || 0,
      };
    } catch (err: any) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }
  } catch (error: any) {
    return {
      sukses: false,
      pesan: `Gagal memulihkan cadangan: ${error.message || error}`,
    };
  }
};
