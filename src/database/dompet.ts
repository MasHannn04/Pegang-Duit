import { getDatabase } from './db';
import { DompetFisik } from '../types';

/**
 * Mengambil daftar semua kantong fisik (Rekening, Dompet, ShopeePay, Dana, dll.)
 */
export const ambilSemuaDompet = async (): Promise<DompetFisik[]> => {
  const db = await getDatabase();
  return await db.getAllAsync<DompetFisik>(
    'SELECT id, nama, saldo_sekarang, is_default, diperbarui_pada FROM dompet_fisik ORDER BY is_default DESC, id ASC'
  );
};

/**
 * Memperbarui saldo pada salah satu kantong dompet fisik.
 */
export const perbaruiSaldoDompet = async (id: number, saldoBaru: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE dompet_fisik 
     SET saldo_sekarang = ?, diperbarui_pada = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    saldoBaru,
    id
  );
};

/**
 * Mengubah nama kantong fisik (bisa untuk semua akun termasuk akun default).
 */
export const ubahNamaDompet = async (id: number, namaBaru: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE dompet_fisik 
     SET nama = ?, diperbarui_pada = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    namaBaru.trim(),
    id
  );
};

/**
 * Menambah kantong baru (misal: "GoPay", "BSI", "Tabungan Emas").
 */
export const tambahDompetBaru = async (nama: string, saldoAwal: number = 0): Promise<number> => {
  const db = await getDatabase();
  const res = await db.runAsync(
    'INSERT INTO dompet_fisik (nama, saldo_sekarang, is_default) VALUES (?, ?, 0)',
    nama.trim(),
    saldoAwal
  );
  return res.lastInsertRowId;
};

/**
 * Menghapus kantong dompet fisik (kecuali akun bawaan / default).
 */
export const hapusDompet = async (
  id: number
): Promise<{ sukses: boolean; pesan: string }> => {
  const db = await getDatabase();
  const item = await db.getFirstAsync<DompetFisik>('SELECT * FROM dompet_fisik WHERE id = ?', id);

  if (item?.is_default === 1) {
    return {
      sukses: false,
      pesan: 'Akun utama tidak dapat dihapus, tapi namanya bebas kamu ganti.',
    };
  }

  await db.runAsync('DELETE FROM dompet_fisik WHERE id = ? AND is_default = 0', id);
  return { sukses: true, pesan: 'Akun berhasil dihapus.' };
};

/**
 * Menghitung akumulasi uang fisik riil di seluruh kantong saat ini.
 */
export const hitungTotalUangFisik = async (): Promise<number> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(saldo_sekarang) as total FROM dompet_fisik'
  );
  return row?.total ?? 0;
};
