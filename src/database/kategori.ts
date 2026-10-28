import { getDatabase } from './db';
import { Kategori, TipeTransaksi } from '../types';

/**
 * Mengambil daftar seluruh kategori transaksi dari database.
 * Bisa difilter berdasarkan tipe ('kredit' untuk pengeluaran, 'debit' untuk pemasukan).
 */
export const ambilSemuaKategori = async (tipe?: TipeTransaksi): Promise<Kategori[]> => {
  const db = await getDatabase();
  if (tipe) {
    return await db.getAllAsync<Kategori>(
      'SELECT * FROM kategori WHERE tipe = ? ORDER BY urutan ASC, id ASC',
      tipe
    );
  }
  return await db.getAllAsync<Kategori>(
    'SELECT * FROM kategori ORDER BY tipe DESC, urutan ASC, id ASC'
  );
};

/**
 * Menambahkan kategori baru.
 */
export const tambahKategori = async (
  nama: string,
  tipe: TipeTransaksi,
  ikon: string = 'pricetag',
  warna: string = '#3B82F6'
): Promise<number> => {
  const db = await getDatabase();
  const maxUrutanRow = await db.getFirstAsync<{ max_u: number | null }>(
    'SELECT MAX(urutan) as max_u FROM kategori WHERE tipe = ?',
    tipe
  );
  const urutan = (maxUrutanRow?.max_u ?? 0) + 1;

  const result = await db.runAsync(
    `INSERT INTO kategori (nama, tipe, ikon, warna, urutan)
     VALUES (?, ?, ?, ?, ?)`,
    nama.trim(),
    tipe,
    ikon,
    warna,
    urutan
  );

  return result.lastInsertRowId;
};

/**
 * Memperbarui nama, ikon, atau warna kategori yang sudah ada.
 */
export const perbaruiKategori = async (
  id: number,
  nama: string,
  ikon: string,
  warna: string
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE kategori 
     SET nama = ?, ikon = ?, warna = ?
     WHERE id = ?`,
    nama.trim(),
    ikon,
    warna,
    id
  );
};

/**
 * Menghapus kategori.
 * Jika ada transaksi yang memakai kategori ini, kategori_id pada transaksi akan diubah menjadi NULL
 * sehingga data transaksi tetap aman dan saldo tidak terganggu.
 */
export const hapusKategori = async (
  id: number
): Promise<{ sukses: boolean; pesan: string }> => {
  const db = await getDatabase();

  // Hitung berapa transaksi yang memakai kategori ini
  const trxCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transaksi WHERE kategori_id = ?',
    id
  );
  const trxCount = trxCountRow?.count ?? 0;

  // Lepaskan relasi kategori dari transaksi yang ada
  if (trxCount > 0) {
    await db.runAsync('UPDATE transaksi SET kategori_id = NULL WHERE kategori_id = ?', id);
  }

  await db.runAsync('DELETE FROM kategori WHERE id = ?', id);

  return {
    sukses: true,
    pesan: trxCount > 0
      ? `Kategori dihapus. ${trxCount} transaksi terkait kini berstatus Tanpa Kategori.`
      : 'Kategori berhasil dihapus.',
  };
};
