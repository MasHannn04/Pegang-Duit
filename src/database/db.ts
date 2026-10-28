import * as SQLite from 'expo-sqlite';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (databaseInstance) {
    return databaseInstance;
  }

  const db = await SQLite.openDatabaseAsync('pegang_duit.db');
  databaseInstance = db;

  await db.execAsync('PRAGMA journal_mode = WAL;');

  // 1. Buat Master Jenis Keuangan jika belum ada
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS jenis_keuangan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      ikon TEXT NOT NULL DEFAULT 'wallet',
      warna TEXT NOT NULL DEFAULT '#2563EB',
      is_default INTEGER NOT NULL DEFAULT 0,
      is_arsip INTEGER NOT NULL DEFAULT 0,
      urutan INTEGER NOT NULL DEFAULT 0,
      dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jenis_keuangan_periode (
      periode_bulan TEXT NOT NULL,
      jenis_id INTEGER NOT NULL,
      is_aktif INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (periode_bulan, jenis_id)
    );

    CREATE TABLE IF NOT EXISTS kategori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      tipe TEXT NOT NULL, -- 'kredit' (pengeluaran) atau 'debit' (pemasukan)
      ikon TEXT NOT NULL DEFAULT 'pricetag',
      warna TEXT NOT NULL DEFAULT '#3B82F6',
      urutan INTEGER NOT NULL DEFAULT 0,
      dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Cek apakah tabel transaksi sudah ada dan lakukan migrasi otomatis jika masih skema lama
  const tableInfo = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(transaksi);'
  );

  if (tableInfo.length === 0) {
    // Tabel belum ada, buat baru
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jenis_keuangan_id INTEGER NOT NULL,
        kategori_id INTEGER,
        tanggal TEXT NOT NULL,
        keterangan TEXT NOT NULL,
        tipe TEXT NOT NULL,
        nominal INTEGER NOT NULL,
        dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    // Tabel sudah ada, cek apakah kolom jenis_keuangan_id sudah tersedia
    const punyaJenisKeuanganId = tableInfo.some((col) => col.name === 'jenis_keuangan_id');
    const punyaJenisBuku = tableInfo.some((col) => col.name === 'jenis_buku');
    const punyaKategoriId = tableInfo.some((col) => col.name === 'kategori_id');

    if (!punyaJenisKeuanganId) {
      // Tambah kolom jenis_keuangan_id ke tabel yang sudah ada
      await db.runAsync(
        'ALTER TABLE transaksi ADD COLUMN jenis_keuangan_id INTEGER NOT NULL DEFAULT 1;'
      );

      // Migrasi data lama dari jenis_buku ('pribadi' -> 1, 'kas' -> 2)
      if (punyaJenisBuku) {
        await db.runAsync("UPDATE transaksi SET jenis_keuangan_id = 2 WHERE jenis_buku = 'kas';");
        await db.runAsync("UPDATE transaksi SET jenis_keuangan_id = 1 WHERE jenis_buku = 'pribadi';");
      }
    }

    if (!punyaKategoriId) {
      await db.runAsync('ALTER TABLE transaksi ADD COLUMN kategori_id INTEGER;');
    }
  }

  // Drop index lama jika pernah dibuat dengan jenis_buku, lalu buat index baru
  await db.execAsync(`
    DROP INDEX IF EXISTS idx_transaksi_filter;
    CREATE INDEX IF NOT EXISTS idx_transaksi_filter ON transaksi (jenis_keuangan_id, tanggal);
    CREATE INDEX IF NOT EXISTS idx_transaksi_kategori ON transaksi (kategori_id);

    CREATE TABLE IF NOT EXISTS dompet_fisik (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      saldo_sekarang INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS log_rekonsiliasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      periode_bulan TEXT NOT NULL,
      total_fisik INTEGER NOT NULL,
      saldo_pribadi INTEGER NOT NULL,
      saldo_kas INTEGER NOT NULL,
      selisih INTEGER NOT NULL,
      diaudit_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pengaturan (
      kunci TEXT PRIMARY KEY,
      nilai TEXT NOT NULL
    );

    -- Tabel Fitur Alokasi Gaji & FIRE
    CREATE TABLE IF NOT EXISTS alokasi_anggaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      periode_bulan TEXT NOT NULL UNIQUE,
      total_pendapatan INTEGER NOT NULL DEFAULT 0,
      catatan TEXT,
      dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
      diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alokasi_pendapatan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alokasi_id INTEGER NOT NULL,
      nama_sumber TEXT NOT NULL,
      nominal INTEGER NOT NULL DEFAULT 0,
      urutan INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (alokasi_id) REFERENCES alokasi_anggaran(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alokasi_pos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alokasi_id INTEGER NOT NULL,
      tipe_pos TEXT NOT NULL,
      target_nominal INTEGER NOT NULL DEFAULT 0,
      target_persen REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (alokasi_id) REFERENCES alokasi_anggaran(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alokasi_subpos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pos_id INTEGER NOT NULL,
      nama_subpos TEXT NOT NULL,
      nominal INTEGER NOT NULL DEFAULT 0,
      urutan INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (pos_id) REFERENCES alokasi_pos(id) ON DELETE CASCADE
    );
  `);

  // Migrasi is_default pada dompet_fisik jika belum ada
  const dompetCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(dompet_fisik);');
  if (dompetCols.length > 0 && !dompetCols.some((c) => c.name === 'is_default')) {
    await db.runAsync('ALTER TABLE dompet_fisik ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;');
    const firstDompet = await db.getFirstAsync<{ id: number }>('SELECT id FROM dompet_fisik ORDER BY id ASC LIMIT 1;');
    if (firstDompet) {
      await db.runAsync('UPDATE dompet_fisik SET is_default = 1 WHERE id = ?;', firstDompet.id);
    }
  }

  // Pastikan Master Jenis Keuangan Bawaan Tersedia
  const existingJenis = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM jenis_keuangan'
  );

  if (existingJenis[0]?.count === 0) {
    await db.execAsync(`
      INSERT INTO jenis_keuangan (id, kode, nama, ikon, warna, is_default, is_arsip, urutan) VALUES 
        (1, 'pribadi', 'Keuangan Pribadi', 'person', '#2563EB', 1, 0, 1),
        (2, 'kas', 'Kas Pegangan', 'briefcase', '#10B981', 0, 0, 2);
    `);
  }

  // Pastikan Kategori Transaksi Bawaan Tersedia
  const existingKategori = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM kategori'
  );

  if (existingKategori[0]?.count === 0) {
    await db.execAsync(`
      INSERT INTO kategori (id, nama, tipe, ikon, warna, urutan) VALUES 
        (1, 'Konsumsi', 'kredit', 'fast-food', '#F59E0B', 1),
        (2, 'Sepeda Motor', 'kredit', 'bicycle', '#3B82F6', 2),
        (3, 'Tempat Tinggal', 'kredit', 'home', '#8B5CF6', 3),
        (4, 'Kebutuhan & Belanja', 'kredit', 'basket', '#EC4899', 4),
        (5, 'Hiburan & Layanan', 'kredit', 'film', '#06B6D4', 5),
        (6, 'Lain-lain', 'kredit', 'ellipsis-horizontal-circle', '#64748B', 6),
        (7, 'Gaji & Upah', 'debit', 'cash', '#10B981', 1),
        (8, 'Bonus & Freelance', 'debit', 'gift', '#059669', 2),
        (9, 'Penjualan & Refund', 'debit', 'pricetag', '#0D9488', 3),
        (10, 'Pemasukan Lain', 'debit', 'wallet', '#14B8A6', 4);
    `);
  }

  // Auto-kategorisasi data transaksi yang belum memiliki kategori_id
  await db.execAsync(`
    UPDATE transaksi SET kategori_id = 1 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%makan%' OR LOWER(keterangan) LIKE '%jajan%' OR LOWER(keterangan) LIKE '%snack%');
    UPDATE transaksi SET kategori_id = 2 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%bensin%' OR LOWER(keterangan) LIKE '%ban%' OR LOWER(keterangan) LIKE '%oli%' OR LOWER(keterangan) LIKE '%motor%');
    UPDATE transaksi SET kategori_id = 3 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%kos%' OR LOWER(keterangan) LIKE '%listrik%' OR LOWER(keterangan) LIKE '%kontrakan%');
    UPDATE transaksi SET kategori_id = 4 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%belanja%' OR LOWER(keterangan) LIKE '%laundry%' OR LOWER(keterangan) LIKE '%atk%' OR LOWER(keterangan) LIKE '%print%' OR LOWER(keterangan) LIKE '%fotokopi%');
    UPDATE transaksi SET kategori_id = 5 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%investasi%' OR LOWER(keterangan) LIKE '%musik%' OR LOWER(keterangan) LIKE '%layanan%' OR LOWER(keterangan) LIKE '%pulsa%' OR LOWER(keterangan) LIKE '%paket%');
    UPDATE transaksi SET kategori_id = 6 WHERE kategori_id IS NULL AND tipe = 'kredit';
    UPDATE transaksi SET kategori_id = 7 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%gaji%' OR LOWER(keterangan) LIKE '%upah%' OR LOWER(keterangan) LIKE '%lembur%');
    UPDATE transaksi SET kategori_id = 9 WHERE kategori_id IS NULL AND (LOWER(keterangan) LIKE '%jual%' OR LOWER(keterangan) LIKE '%kembalian%');
    UPDATE transaksi SET kategori_id = 10 WHERE kategori_id IS NULL AND tipe = 'debit';
  `);

  // Pastikan Dompet Fisik Tersedia
  const existingDompet = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM dompet_fisik'
  );

  if (existingDompet[0]?.count === 0) {
    await db.execAsync(`
      INSERT INTO dompet_fisik (nama, saldo_sekarang, is_default) VALUES 
        ('Rekening', 0, 1),
        ('Dompet', 0, 0),
        ('ShopeePay', 0, 0),
        ('Dana', 0, 0);
    `);
  }

  // Pengaturan Standar
  await db.runAsync(`
    INSERT OR IGNORE INTO pengaturan (kunci, nilai) VALUES 
      ('gaji_per_hari', '125000'),
      ('nama_pengguna', 'Pengguna');
  `);

  return db;
};

/**
 * Mengosongkan seluruh data transaksi dan mengembalikan sistem ke kondisi awal (Pengguna Baru).
 * Digunakan untuk membersihkan aplikasi atau sebelum memulihkan data cadangan.
 */
export const resetDataKePenggunaBaru = async (): Promise<void> => {
  const db = await getDatabase();
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    // 1. Hapus semua data mutasi dan audit
    await db.execAsync('DELETE FROM transaksi;');
    await db.execAsync('DELETE FROM log_rekonsiliasi;');
    await db.execAsync('DELETE FROM jenis_keuangan_periode;');
    await db.execAsync('DELETE FROM alokasi_subpos;');
    await db.execAsync('DELETE FROM alokasi_pos;');
    await db.execAsync('DELETE FROM alokasi_pendapatan;');
    await db.execAsync('DELETE FROM alokasi_anggaran;');

    // 2. Nol-kan seluruh saldo dompet fisik
    await db.execAsync('UPDATE dompet_fisik SET saldo_sekarang = 0;');

    // 3. Kembalikan jenis keuangan ke standar (Pribadi & Kas)
    await db.execAsync('DELETE FROM jenis_keuangan;');
    await db.execAsync(`
      INSERT INTO jenis_keuangan (id, kode, nama, ikon, warna, is_default, is_arsip, urutan) VALUES 
        (1, 'pribadi', 'Keuangan Pribadi', 'person', '#2563EB', 1, 0, 1),
        (2, 'kas', 'Kas Pegangan', 'briefcase', '#10B981', 0, 0, 2);
    `);

    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};
