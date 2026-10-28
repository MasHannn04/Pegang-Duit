import { getDatabase } from './db';
import { hitungTotalUangFisik } from './dompet';
import { ambilRingkasanDashboard } from './transaksi';
import { StatusAudit, LogRekonsiliasi } from '../types';

/**
 * Menghitung audit uang riil vs catatan pembukuan untuk semua jenis keuangan aktif.
 * Rumus: Selisih = Total Uang Fisik - Total Seluruh Saldo Buku Aktif
 */
export const hitungStatusAudit = async (periodeBulan: string): Promise<StatusAudit> => {
  const totalFisik = await hitungTotalUangFisik();
  const ringkasanDashboard = await ambilRingkasanDashboard(periodeBulan);

  const totalBuku = ringkasanDashboard.total_saldo_semua;
  const selisih = totalFisik - totalBuku;

  const rincianBuku = ringkasanDashboard.daftar_ringkasan.map((dr) => ({
    nama: dr.jenis.nama,
    saldo: dr.ringkasan.saldo_akhir,
    warna: dr.jenis.warna,
  }));

  return {
    total_fisik: totalFisik,
    total_buku_seluruhnya: totalBuku,
    selisih: selisih,
    apakah_cocok: selisih === 0,
    rincian_buku: rincianBuku,
  };
};

/**
 * Menyimpan snapshot audit ke tabel log_rekonsiliasi.
 */
export const catatLogRekonsiliasi = async (
  periodeBulan: string,
  status: StatusAudit
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO log_rekonsiliasi (periode_bulan, total_fisik, saldo_pribadi, saldo_kas, selisih)
     VALUES (?, ?, ?, ?, ?)`,
    periodeBulan,
    status.total_fisik,
    status.total_buku_seluruhnya,
    0,
    status.selisih
  );
};

/**
 * Mengambil histori audit rekonsiliasi.
 */
export const ambilRiwayatRekonsiliasi = async (): Promise<LogRekonsiliasi[]> => {
  const db = await getDatabase();
  return await db.getAllAsync<LogRekonsiliasi>(
    'SELECT * FROM log_rekonsiliasi ORDER BY id DESC LIMIT 15'
  );
};
