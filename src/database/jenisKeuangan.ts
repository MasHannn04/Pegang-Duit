import { getDatabase } from './db';
import { JenisKeuangan } from '../types';

/**
 * Mengambil semua master jenis keuangan.
 */
export const ambilSemuaJenisKeuangan = async (
  termasukArsip: boolean = false
): Promise<JenisKeuangan[]> => {
  const db = await getDatabase();
  const sql = termasukArsip
    ? 'SELECT * FROM jenis_keuangan ORDER BY urutan ASC, id ASC'
    : 'SELECT * FROM jenis_keuangan WHERE is_arsip = 0 ORDER BY urutan ASC, id ASC';
  return await db.getAllAsync<JenisKeuangan>(sql);
};

/**
 * Mengambil jenis keuangan yang aktif pada bulan tertentu,
 * dengan logika pewarisan otomatis dari bulan sebelumnya jika bulan ini belum disetel.
 */
export const ambilJenisKeuanganBulan = async (
  periodeBulan: string // Format: YYYY-MM
): Promise<JenisKeuangan[]> => {
  const db = await getDatabase();

  // 1. Cek apakah bulan ini sudah pernah disetel
  const setelanBulanIni = await db.getAllAsync<{ jenis_id: number; is_aktif: number }>(
    'SELECT jenis_id, is_aktif FROM jenis_keuangan_periode WHERE periode_bulan = ?',
    periodeBulan
  );

  let mapAktif: Record<number, boolean> = {};

  if (setelanBulanIni.length > 0) {
    setelanBulanIni.forEach((s) => {
      mapAktif[s.jenis_id] = s.is_aktif === 1;
    });
  } else {
    // 2. Pewarisan: cari bulan terakhir sebelumnya yang sudah ada setelan
    const setelanSebelumnya = await db.getAllAsync<{ jenis_id: number; is_aktif: number }>(
      `SELECT jenis_id, is_aktif 
       FROM jenis_keuangan_periode 
       WHERE periode_bulan < ? 
       ORDER BY periode_bulan DESC`,
      periodeBulan
    );

    if (setelanSebelumnya.length > 0) {
      setelanSebelumnya.forEach((s) => {
        if (mapAktif[s.jenis_id] === undefined) {
          mapAktif[s.jenis_id] = s.is_aktif === 1;
        }
      });
    }
  }

  // 3. Ambil master jenis keuangan
  const semuaMaster = await db.getAllAsync<JenisKeuangan>(
    'SELECT * FROM jenis_keuangan ORDER BY urutan ASC, id ASC'
  );

  return semuaMaster.map((jk) => {
    // Jika ada setelan spesifik gunakan itu, jika tidak ada, aktifkan jika belum diarsipkan
    const isAktif = mapAktif[jk.id] !== undefined ? mapAktif[jk.id] : jk.is_arsip === 0;
    return {
      ...jk,
      is_aktif_bulan_ini: isAktif,
    };
  });
};

/**
 * Mengatur apakah suatu jenis keuangan tampil / aktif di bulan tertentu.
 */
export const aturAktifJenisBulan = async (
  periodeBulan: string,
  jenisId: number,
  isAktif: boolean
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO jenis_keuangan_periode (periode_bulan, jenis_id, is_aktif)
     VALUES (?, ?, ?)
     ON CONFLICT(periode_bulan, jenis_id) DO UPDATE SET is_aktif = excluded.is_aktif`,
    periodeBulan,
    jenisId,
    isAktif ? 1 : 0
  );
};

/**
 * Menambahkan jenis keuangan baru dari menu Laporan.
 */
export const tambahJenisKeuangan = async (
  nama: string,
  ikon: string = 'wallet',
  warna: string = '#3B82F6'
): Promise<number> => {
  const db = await getDatabase();
  const kode = nama.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

  const res = await db.runAsync(
    `INSERT INTO jenis_keuangan (kode, nama, ikon, warna, is_default, is_arsip, urutan)
     VALUES (?, ?, ?, ?, 0, 0, 99)`,
    kode,
    nama.trim(),
    ikon,
    warna
  );

  return res.lastInsertRowId;
};

/**
 * Mengubah nama, ikon, atau warna jenis keuangan.
 */
export const ubahJenisKeuangan = async (
  id: number,
  nama: string,
  ikon: string,
  warna: string
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE jenis_keuangan 
     SET nama = ?, ikon = ?, warna = ? 
     WHERE id = ?`,
    nama.trim(),
    ikon,
    warna,
    id
  );
};

/**
 * Mengarsipkan jenis keuangan (agar tidak muncul di bulan depan tapi histori lama tetap aman).
 */
export const toggleArsipJenisKeuangan = async (
  id: number,
  arsipkan: boolean
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE jenis_keuangan SET is_arsip = ? WHERE id = ? AND is_default = 0',
    arsipkan ? 1 : 0,
    id
  );
};

/**
 * Hapus permanen (hanya jika bukan default dan tidak ada transaksi).
 */
export const hapusPermanenJenisKeuangan = async (id: number): Promise<{ sukses: boolean; pesan: string }> => {
  const db = await getDatabase();

  const trxCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transaksi WHERE jenis_keuangan_id = ?',
    id
  );

  if ((trxCount?.count ?? 0) > 0) {
    return {
      sukses: false,
      pesan: `Tidak bisa dihapus permanen karena ada ${trxCount?.count} transaksi di dalamnya. Silakan gunakan opsi 'Arsipkan' agar data lama tetap aman.`,
    };
  }

  await db.runAsync('DELETE FROM jenis_keuangan WHERE id = ? AND is_default = 0', id);
  await db.runAsync('DELETE FROM jenis_keuangan_periode WHERE jenis_id = ?', id);

  return { sukses: true, pesan: 'Jenis keuangan berhasil dihapus permanen.' };
};
