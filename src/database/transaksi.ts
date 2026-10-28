import { getDatabase } from './db';
import { Transaksi, RingkasanBulan, RingkasanDashboard } from '../types';
import { ambilJenisKeuanganBulan } from './jenisKeuangan';

/**
 * Menambahkan transaksi baru ke dalam database.
 */
export const tambahTransaksi = async (data: Transaksi): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO transaksi (jenis_keuangan_id, kategori_id, tanggal, keterangan, tipe, nominal)
     VALUES (?, ?, ?, ?, ?, ?)`,
    data.jenis_keuangan_id,
    data.kategori_id ?? null,
    data.tanggal,
    data.keterangan.trim(),
    data.tipe,
    data.nominal
  );
  return result.lastInsertRowId;
};

/**
 * Menghapus transaksi berdasarkan ID.
 */
export const hapusTransaksi = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transaksi WHERE id = ?', id);
};

/**
 * Memperbarui data transaksi.
 */
export const perbaruiTransaksi = async (data: Transaksi): Promise<void> => {
  if (!data.id) return;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transaksi 
     SET jenis_keuangan_id = ?, kategori_id = ?, tanggal = ?, keterangan = ?, tipe = ?, nominal = ?
     WHERE id = ?`,
    data.jenis_keuangan_id,
    data.kategori_id ?? null,
    data.tanggal,
    data.keterangan.trim(),
    data.tipe,
    data.nominal,
    data.id
  );
};

/**
 * Menghitung saldo kumulatif sebelum awal bulan tertentu (Saldo Awal / Rollover).
 */
export const hitungSaldoAwalBulan = async (
  jenisKeuanganId: number,
  periodeBulan: string // Format: YYYY-MM
): Promise<number> => {
  const db = await getDatabase();
  const awalBulan = `${periodeBulan}-01`;

  const row = await db.getFirstAsync<{ saldo_awal: number | null }>(
    `SELECT SUM(CASE WHEN tipe = 'debit' THEN nominal ELSE -nominal END) as saldo_awal
     FROM transaksi
     WHERE jenis_keuangan_id = ? AND tanggal < ?`,
    jenisKeuanganId,
    awalBulan
  );

  return row?.saldo_awal ?? 0;
};

/**
 * Mengambil seluruh transaksi dalam satu bulan untuk jenis keuangan tertentu,
 * lengkap dengan running balance (saldo berjalan) dan info kategori.
 */
export const ambilTransaksiBulan = async (
  jenisKeuanganId: number,
  periodeBulan: string // Format: YYYY-MM
): Promise<{ transaksi: Transaksi[]; ringkasan: RingkasanBulan }> => {
  const db = await getDatabase();
  const patternBulan = `${periodeBulan}%`;

  // 1. Ambil saldo awal sebelum bulan ini
  const saldoAwal = await hitungSaldoAwalBulan(jenisKeuanganId, periodeBulan);

  // 2. Ambil semua baris transaksi di bulan ini
  const rows = await db.getAllAsync<Transaksi>(
    `SELECT t.id, t.jenis_keuangan_id, t.kategori_id, t.tanggal, t.keterangan, t.tipe, t.nominal, t.dibuat_pada,
            jk.nama as nama_jenis, jk.warna as warna_jenis,
            k.nama as nama_kategori, k.ikon as ikon_kategori, k.warna as warna_kategori
     FROM transaksi t
     LEFT JOIN jenis_keuangan jk ON t.jenis_keuangan_id = jk.id
     LEFT JOIN kategori k ON t.kategori_id = k.id
     WHERE t.jenis_keuangan_id = ? AND t.tanggal LIKE ?
     ORDER BY t.tanggal ASC, t.id ASC`,
    jenisKeuanganId,
    patternBulan
  );

  let saldoAkumulasi = saldoAwal;
  let totalDebit = 0;
  let totalKredit = 0;

  const transaksiDenganSaldo: Transaksi[] = rows.map((trx) => {
    if (trx.tipe === 'debit') {
      saldoAkumulasi += trx.nominal;
      totalDebit += trx.nominal;
    } else {
      saldoAkumulasi -= trx.nominal;
      totalKredit += trx.nominal;
    }

    return {
      ...trx,
      saldo_berjalan: saldoAkumulasi,
    };
  });

  return {
    transaksi: transaksiDenganSaldo,
    ringkasan: {
      saldo_awal: saldoAwal,
      total_debit: totalDebit,
      total_kredit: totalKredit,
      saldo_akhir: saldoAkumulasi,
    },
  };
};

/**
 * Mengambil ringkasan dashboard lengkap untuk semua jenis keuangan aktif di bulan tertentu.
 */
export const ambilRingkasanDashboard = async (
  periodeBulan: string
): Promise<RingkasanDashboard> => {
  const daftarJenis = await ambilJenisKeuanganBulan(periodeBulan);
  const jenisAktif = daftarJenis.filter((j) => j.is_aktif_bulan_ini);

  let totalSaldoSemua = 0;
  let totalDebitSemua = 0;
  let totalKreditSemua = 0;

  const daftarRingkasan: { jenis: any; ringkasan: RingkasanBulan }[] = [];

  for (const j of jenisAktif) {
    const dataTrx = await ambilTransaksiBulan(j.id, periodeBulan);
    daftarRingkasan.push({
      jenis: {
        ...j,
        saldo_bulan_ini: dataTrx.ringkasan.saldo_akhir,
      },
      ringkasan: dataTrx.ringkasan,
    });

    totalSaldoSemua += dataTrx.ringkasan.saldo_akhir;
    totalDebitSemua += dataTrx.ringkasan.total_debit;
    totalKreditSemua += dataTrx.ringkasan.total_kredit;
  }

  return {
    total_saldo_semua: totalSaldoSemua,
    total_debit_semua: totalDebitSemua,
    total_kredit_semua: totalKreditSemua,
    daftar_ringkasan: daftarRingkasan,
  };
};

/**
 * Mengambil periode bulan terawal yang memiliki catatan transaksi di database.
 * Default ke '2026-01' sesuai awal mula pencatatan keuangan pengguna.
 */
export const ambilPeriodeTerawal = async (): Promise<string> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ min_periode: string | null }>(
    "SELECT MIN(SUBSTR(tanggal, 1, 7)) as min_periode FROM transaksi WHERE tanggal IS NOT NULL AND tanggal != '';"
  );
  if (row && row.min_periode) {
    return row.min_periode;
  }
  return '2026-01';
};
