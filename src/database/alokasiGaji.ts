import { getDatabase } from './db';
import { AlokasiAnggaran, AlokasiPendapatan, AlokasiPos, AlokasiSubpos, TipePosAlokasi } from '../types';

/**
 * Mengambil alokasi anggaran pada periode tertentu (format: YYYY-MM)
 */
export const ambilAlokasiBulan = async (periodeBulan: string): Promise<AlokasiAnggaran | null> => {
  const db = await getDatabase();

  const anggaran = await db.getFirstAsync<{
    id: number;
    periode_bulan: string;
    total_pendapatan: number;
    catatan?: string;
    dibuat_pada: string;
    diperbarui_pada: string;
  }>('SELECT * FROM alokasi_anggaran WHERE periode_bulan = ? LIMIT 1;', periodeBulan);

  if (!anggaran) {
    return null;
  }

  // Ambil daftar pendapatan
  const listPendapatan = await db.getAllAsync<{
    id: number;
    alokasi_id: number;
    nama_sumber: string;
    nominal: number;
    urutan: number;
  }>('SELECT * FROM alokasi_pendapatan WHERE alokasi_id = ? ORDER BY urutan ASC, id ASC;', anggaran.id);

  // Ambil daftar pos
  const listPos = await db.getAllAsync<{
    id: number;
    alokasi_id: number;
    tipe_pos: TipePosAlokasi;
    target_nominal: number;
    target_persen: number;
  }>('SELECT * FROM alokasi_pos WHERE alokasi_id = ? ORDER BY id ASC;', anggaran.id);

  // Ambil subpos untuk setiap pos
  const posLengkap: AlokasiPos[] = [];
  for (const pos of listPos) {
    const listSubpos = await db.getAllAsync<{
      id: number;
      pos_id: number;
      nama_subpos: string;
      nominal: number;
      urutan: number;
    }>('SELECT * FROM alokasi_subpos WHERE pos_id = ? ORDER BY urutan ASC, id ASC;', pos.id);

    posLengkap.push({
      id: pos.id,
      alokasi_id: pos.alokasi_id,
      tipe_pos: pos.tipe_pos,
      target_nominal: pos.target_nominal,
      target_persen: pos.target_persen,
      subpos: listSubpos.map((sp) => ({
        id: sp.id,
        pos_id: sp.pos_id,
        nama_subpos: sp.nama_subpos,
        nominal: sp.nominal,
        urutan: sp.urutan,
      })),
    });
  }

  return {
    id: anggaran.id,
    periode_bulan: anggaran.periode_bulan,
    total_pendapatan: anggaran.total_pendapatan,
    catatan: anggaran.catatan || '',
    pendapatan: listPendapatan.map((p) => ({
      id: p.id,
      alokasi_id: p.alokasi_id,
      nama_sumber: p.nama_sumber,
      nominal: p.nominal,
      urutan: p.urutan,
    })),
    pos: posLengkap,
    dibuat_pada: anggaran.dibuat_pada,
    diperbarui_pada: anggaran.diperbarui_pada,
  };
};

/**
 * Menyimpan atau memperbarui seluruh konfigurasi alokasi anggaran bulanan
 */
export const simpanAlokasiBulan = async (data: AlokasiAnggaran): Promise<number> => {
  const db = await getDatabase();
  await db.execAsync('BEGIN TRANSACTION;');

  try {
    let alokasiId = data.id;

    // Hitung total pendapatan dari rincian sumber pendapatan
    const totalPendapatan = data.pendapatan.reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

    if (alokasiId) {
      await db.runAsync(
        `UPDATE alokasi_anggaran 
         SET total_pendapatan = ?, catatan = ?, diperbarui_pada = CURRENT_TIMESTAMP 
         WHERE id = ?;`,
        totalPendapatan,
        data.catatan || '',
        alokasiId
      );

      // Hapus pendapatan lama & pos lama untuk re-insert bersih
      await db.runAsync('DELETE FROM alokasi_pendapatan WHERE alokasi_id = ?;', alokasiId);
      
      const posLama = await db.getAllAsync<{ id: number }>('SELECT id FROM alokasi_pos WHERE alokasi_id = ?;', alokasiId);
      for (const p of posLama) {
        await db.runAsync('DELETE FROM alokasi_subpos WHERE pos_id = ?;', p.id);
      }
      await db.runAsync('DELETE FROM alokasi_pos WHERE alokasi_id = ?;', alokasiId);
    } else {
      const res = await db.runAsync(
        `INSERT INTO alokasi_anggaran (periode_bulan, total_pendapatan, catatan) 
         VALUES (?, ?, ?);`,
        data.periode_bulan,
        totalPendapatan,
        data.catatan || ''
      );
      alokasiId = res.lastInsertRowId;
    }

    // 1. Simpan Sumber Pendapatan
    for (let i = 0; i < data.pendapatan.length; i++) {
      const item = data.pendapatan[i];
      await db.runAsync(
        `INSERT INTO alokasi_pendapatan (alokasi_id, nama_sumber, nominal, urutan) 
         VALUES (?, ?, ?, ?);`,
        alokasiId,
        item.nama_sumber.trim() || 'Pemasukan',
        Number(item.nominal) || 0,
        i + 1
      );
    }

    // 2. Simpan 3 Pos (Kebutuhan, Investasi, Keinginan) & Subpos
    for (const pos of data.pos) {
      const resPos = await db.runAsync(
        `INSERT INTO alokasi_pos (alokasi_id, tipe_pos, target_nominal, target_persen) 
         VALUES (?, ?, ?, ?);`,
        alokasiId,
        pos.tipe_pos,
        Number(pos.target_nominal) || 0,
        Number(pos.target_persen) || 0
      );
      const posId = resPos.lastInsertRowId;

      if (pos.subpos && pos.subpos.length > 0) {
        for (let j = 0; j < pos.subpos.length; j++) {
          const sp = pos.subpos[j];
          await db.runAsync(
            `INSERT INTO alokasi_subpos (pos_id, nama_subpos, nominal, urutan) 
             VALUES (?, ?, ?, ?);`,
            posId,
            sp.nama_subpos.trim() || 'Pos Pengeluaran',
            Number(sp.nominal) || 0,
            j + 1
          );
        }
      }
    }

    await db.execAsync('COMMIT;');
    return alokasiId;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};

/**
 * Mencari data bulan terdekat sebelum bulan target untuk disalin
 */
export const ambilAlokasiBulanSebelumnya = async (periodeTarget: string): Promise<AlokasiAnggaran | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ periode_bulan: string }>(
    `SELECT periode_bulan FROM alokasi_anggaran 
     WHERE periode_bulan < ? 
     ORDER BY periode_bulan DESC LIMIT 1;`,
    periodeTarget
  );

  if (!row) return null;
  return ambilAlokasiBulan(row.periode_bulan);
};

/**
 * Membuat data template default (70/20/10) untuk bulan baru jika belum ada data
 */
export const buatTemplateAlokasiAwal = (periodeBulan: string): AlokasiAnggaran => {
  const defaultIncome: AlokasiPendapatan[] = [
    { nama_sumber: 'Gaji Harian (Standar Sarjana)', nominal: 2500000, urutan: 1 },
    { nama_sumber: 'Sampingan (Jaga Rumah)', nominal: 300000, urutan: 2 },
  ];
  const total = defaultIncome.reduce((s, i) => s + i.nominal, 0); // 2.800.000

  // Preset 70/20/10:
  // Kebutuhan 70% = 1.960.000 (Kos 600k, Makan 1.100.000, Bensin 150k, Sabun/Laundry 110k)
  // Investasi 20% = 560.000 (RDPU Tabungan 300k, RDPU Dana Darurat 260k)
  // Keinginan 10% = 280.000 (Jajan & Ngopi 280k)

  const posKebutuhan: AlokasiPos = {
    tipe_pos: 'kebutuhan',
    target_persen: 70,
    target_nominal: Math.round(total * 0.7),
    subpos: [
      { nama_subpos: 'Bayar Kos', nominal: 600000, urutan: 1 },
      { nama_subpos: 'Makan Harian (30 hari)', nominal: 1100000, urutan: 2 },
      { nama_subpos: 'Bensin & Transportasi', nominal: 150000, urutan: 3 },
      { nama_subpos: 'Sabun, Laundry & Kuota', nominal: 110000, urutan: 4 },
    ],
  };

  const posInvestasi: AlokasiPos = {
    tipe_pos: 'investasi',
    target_persen: 20,
    target_nominal: Math.round(total * 0.2),
    subpos: [
      { nama_subpos: 'RDPU Tabungan Dingin', nominal: 300000, urutan: 1 },
      { nama_subpos: 'RDPU Dana Darurat', nominal: 260000, urutan: 2 },
    ],
  };

  const posKeinginan: AlokasiPos = {
    tipe_pos: 'keinginan',
    target_persen: 10,
    target_nominal: Math.round(total * 0.1),
    subpos: [
      { nama_subpos: 'Jajan & Ngopi Santai', nominal: 280000, urutan: 1 },
    ],
  };

  return {
    periode_bulan: periodeBulan,
    total_pendapatan: total,
    catatan: '',
    pendapatan: defaultIncome,
    pos: [posKebutuhan, posInvestasi, posKeinginan],
  };
};
