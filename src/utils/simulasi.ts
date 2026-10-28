import { getDatabase } from '../database/db';
import { getPeriodeBulanSekarang } from './format';

/**
 * Mengisi database dengan seluruh data transaksi simulasi
 * otomatis menyesuaikan dengan periode bulan saat ini dari device (atau targetPeriode).
 */
export const muatDataSimulasiOktober = async (targetPeriode?: string): Promise<void> => {
  const db = await getDatabase();
  const periode = targetPeriode || getPeriodeBulanSekarang();

  await db.execAsync('BEGIN TRANSACTION;');

  try {
    // Pastikan jenis_keuangan 1 (pribadi) dan 2 (laporan) aktif di periode ini
    await db.runAsync(
      `INSERT OR REPLACE INTO jenis_keuangan_periode (periode_bulan, jenis_id, is_aktif)
       VALUES (?, 1, 1), (?, 2, 1)`,
      periode,
      periode
    );

    // Hapus data lama di bulan ini agar tidak duplikat
    await db.runAsync(`DELETE FROM transaksi WHERE tanggal LIKE '${periode}%'`);

    // 1. Data Keuangan Pribadi (ID = 1)
    // Kategori: 1=Konsumsi, 2=Sepeda Motor, 3=Tempat Tinggal, 4=Kebutuhan & Belanja, 5=Hiburan & Layanan, 6=Lain-lain, 7=Gaji & Upah, 8=Bonus, 9=Penjualan & Refund, 10=Pemasukan Lain
    const transaksiPribadi = [
      { tanggal: `${periode}-01`, keterangan: 'Sisa Bulan Lalu', tipe: 'debit', nominal: -103000, kategori_id: 10 },
      { tanggal: `${periode}-01`, keterangan: 'Gaji Bulanan', tipe: 'debit', nominal: 3125000, kategori_id: 7 },
      { tanggal: `${periode}-01`, keterangan: 'Investasi Bibit', tipe: 'kredit', nominal: 1000000, kategori_id: 5 },
      { tanggal: `${periode}-01`, keterangan: 'Kembalian Bayar Wisuda', tipe: 'debit', nominal: 80000, kategori_id: 9 },
      { tanggal: `${periode}-01`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-01`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-01`, keterangan: 'Belanja', tipe: 'kredit', nominal: 80000, kategori_id: 4 },

      { tanggal: `${periode}-02`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-02`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-02`, keterangan: 'Gaji Tambahan', tipe: 'debit', nominal: 300000, kategori_id: 7 },

      { tanggal: `${periode}-03`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-03`, keterangan: 'Jajan', tipe: 'kredit', nominal: 45000, kategori_id: 1 },
      { tanggal: `${periode}-03`, keterangan: 'Bayar Kos', tipe: 'kredit', nominal: 1150000, kategori_id: 3 },
      { tanggal: `${periode}-03`, keterangan: 'Biaya Admin', tipe: 'kredit', nominal: 15000, kategori_id: 6 },

      { tanggal: `${periode}-04`, keterangan: 'Sedekah / Donasi', tipe: 'kredit', nominal: 10000, kategori_id: 6 },
      { tanggal: `${periode}-04`, keterangan: 'Bensin', tipe: 'kredit', nominal: 15000, kategori_id: 2 },
      { tanggal: `${periode}-04`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-04`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-04`, keterangan: 'Laundry', tipe: 'kredit', nominal: 10000, kategori_id: 4 },

      { tanggal: `${periode}-05`, keterangan: 'Tagihan Layanan', tipe: 'kredit', nominal: 65000, kategori_id: 5 },
      { tanggal: `${periode}-05`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-05`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },

      { tanggal: `${periode}-06`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-06`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },

      { tanggal: `${periode}-07`, keterangan: 'Kompa Ban', tipe: 'kredit', nominal: 5000, kategori_id: 2 },
      { tanggal: `${periode}-07`, keterangan: 'Ganti Oli', tipe: 'kredit', nominal: 75000, kategori_id: 2 },
      { tanggal: `${periode}-07`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-07`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },

      { tanggal: `${periode}-08`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-08`, keterangan: 'Jajan', tipe: 'kredit', nominal: 35000, kategori_id: 1 },

      { tanggal: `${periode}-09`, keterangan: 'Jual SSD', tipe: 'debit', nominal: 250000, kategori_id: 9 },
      { tanggal: `${periode}-09`, keterangan: 'Kirim SSD', tipe: 'kredit', nominal: 10000, kategori_id: 4 },
      { tanggal: `${periode}-09`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-09`, keterangan: 'Makan', tipe: 'kredit', nominal: 35000, kategori_id: 1 },

      { tanggal: `${periode}-10`, keterangan: 'Makan', tipe: 'kredit', nominal: 35000, kategori_id: 1 },
      { tanggal: `${periode}-10`, keterangan: 'Makan Bersama', tipe: 'kredit', nominal: 35000, kategori_id: 1 },
      { tanggal: `${periode}-10`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-10`, keterangan: 'Bensin', tipe: 'kredit', nominal: 25000, kategori_id: 2 },
      { tanggal: `${periode}-10`, keterangan: 'Cuci Motor', tipe: 'kredit', nominal: 15000, kategori_id: 2 },

      { tanggal: `${periode}-11`, keterangan: 'Makan', tipe: 'kredit', nominal: 25000, kategori_id: 1 },
      { tanggal: `${periode}-11`, keterangan: 'Makan Bersama', tipe: 'kredit', nominal: 25000, kategori_id: 1 },
      { tanggal: `${periode}-11`, keterangan: 'Laundry', tipe: 'kredit', nominal: 20000, kategori_id: 4 },
      { tanggal: `${periode}-11`, keterangan: 'Langganan Musik', tipe: 'kredit', nominal: 30000, kategori_id: 5 },
      { tanggal: `${periode}-11`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },

      { tanggal: `${periode}-12`, keterangan: 'Makan', tipe: 'kredit', nominal: 25000, kategori_id: 1 },
      { tanggal: `${periode}-12`, keterangan: 'Jajan', tipe: 'kredit', nominal: 25000, kategori_id: 1 },

      { tanggal: `${periode}-13`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-13`, keterangan: 'Uang Makan Tambahan', tipe: 'debit', nominal: 50000, kategori_id: 7 },
      { tanggal: `${periode}-13`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },

      { tanggal: `${periode}-14`, keterangan: 'Makan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
      { tanggal: `${periode}-14`, keterangan: 'Jajan', tipe: 'kredit', nominal: 15000, kategori_id: 1 },
    ];

    for (const item of transaksiPribadi) {
      await db.runAsync(
        `INSERT INTO transaksi (jenis_keuangan_id, kategori_id, tanggal, keterangan, tipe, nominal)
         VALUES (1, ?, ?, ?, ?, ?)`,
        item.kategori_id,
        item.tanggal,
        item.keterangan,
        item.tipe,
        item.nominal
      );
    }

    // 2. Data Laporan Pegangan Operasional (ID = 2)
    const transaksiKas = [
      { tanggal: `${periode}-01`, keterangan: 'Sisa Bulan Lalu', tipe: 'debit', nominal: 9000, kategori_id: 10 },
      { tanggal: `${periode}-12`, keterangan: 'Pegangan Laporan Operasional', tipe: 'debit', nominal: 215000, kategori_id: 10 },
    ];

    for (const item of transaksiKas) {
      await db.runAsync(
        `INSERT INTO transaksi (jenis_keuangan_id, kategori_id, tanggal, keterangan, tipe, nominal)
         VALUES (2, ?, ?, ?, ?, ?)`,
        item.kategori_id,
        item.tanggal,
        item.keterangan,
        item.tipe,
        item.nominal
      );
    }

    // 3. Data Penempatan Uang Aktual
    await db.runAsync("UPDATE dompet_fisik SET saldo_sekarang = 390000 WHERE nama = 'Rekening'");
    await db.runAsync("UPDATE dompet_fisik SET saldo_sekarang = 250000 WHERE nama = 'Dompet'");
    await db.runAsync("UPDATE dompet_fisik SET saldo_sekarang = 130000 WHERE nama = 'ShopeePay'");
    await db.runAsync("UPDATE dompet_fisik SET saldo_sekarang = 0 WHERE nama = 'Dana'");

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
};
