// Tipe Data untuk Aplikasi Pegang Duit (100% Bahasa Indonesia)

export type TabMenu = 'dashboard' | 'dompet' | 'catat' | 'laporan' | 'akun';

export interface ProfilPengguna {
  nama: string;
  motto: string;
  avatar_ikon: string;
  avatar_warna: string;
}

export type JenisBuku = 'pribadi' | 'kas' | string;

export type TipeTransaksi = 'debit' | 'kredit';

export interface JenisKeuangan {
  id: number;
  kode: string; // misal: 'pribadi', 'kas', 'tabungan', dll.
  nama: string; // misal: "Keuangan Pribadi", "Kas Pegangan"
  ikon: string; // misal: "person", "briefcase", "wallet", "cash"
  warna: string; // hex color
  is_default: number; // 1 = bawaan/pribadi (tidak bisa dihapus), 0 = custom
  is_arsip: number; // 0 = aktif, 1 = diarsipkan
  urutan: number;
  dibuat_pada?: string;
  is_aktif_bulan_ini?: boolean; // status tampil di bulan yang sedang dipilih
  saldo_bulan_ini?: number;
}

export interface Kategori {
  id: number;
  nama: string; // misal: "Konsumsi", "Sepeda Motor", "Gaji & Upah"
  tipe: TipeTransaksi; // 'debit' (pemasukan) atau 'kredit' (pengeluaran)
  ikon: string; // nama ikon ionicons
  warna: string; // hex color
  urutan?: number;
  dibuat_pada?: string;
}

export interface Transaksi {
  id?: number;
  jenis_keuangan_id: number;
  kategori_id?: number | null;
  nama_kategori?: string;
  ikon_kategori?: string;
  warna_kategori?: string;
  tanggal: string; // Format: YYYY-MM-DD
  keterangan: string;
  tipe: TipeTransaksi;
  nominal: number;
  saldo_berjalan?: number;
  dibuat_pada?: string;
  // Relasi tampilan
  nama_jenis?: string;
  warna_jenis?: string;
}

export interface DompetFisik {
  id?: number;
  nama: string; // misal: "Rekening", "Dompet", "ShopeePay", "Dana"
  saldo_sekarang: number;
  is_default?: number; // 1 = default utama (tidak bisa dihapus tapi bisa diganti nama), 0 = custom
  diperbarui_pada?: string;
}

export interface LogRekonsiliasi {
  id?: number;
  periode_bulan: string; // Format: YYYY-MM
  total_fisik: number;
  saldo_pribadi: number;
  saldo_kas: number;
  selisih: number;
  diaudit_pada: string;
}

export interface RingkasanBulan {
  saldo_awal: number;
  total_debit: number;
  total_kredit: number;
  saldo_akhir: number;
}

export interface RingkasanDashboard {
  total_saldo_semua: number;
  total_debit_semua: number;
  total_kredit_semua: number;
  daftar_ringkasan: {
    jenis: JenisKeuangan;
    ringkasan: RingkasanBulan;
  }[];
}

export interface StatusAudit {
  total_fisik: number;
  total_buku_seluruhnya: number;
  selisih: number;
  apakah_cocok: boolean;
  rincian_buku: { nama: string; saldo: number; warna: string }[];
}

// Fitur Alokasi Gaji & Perencanaan FIRE
export type TipePosAlokasi = 'kebutuhan' | 'investasi' | 'keinginan';

export interface AlokasiSubpos {
  id?: number;
  pos_id?: number;
  nama_subpos: string;
  nominal: number;
  urutan?: number;
}

export interface AlokasiPos {
  id?: number;
  alokasi_id?: number;
  tipe_pos: TipePosAlokasi;
  target_nominal: number;
  target_persen: number;
  subpos: AlokasiSubpos[];
}

export interface AlokasiPendapatan {
  id?: number;
  alokasi_id?: number;
  nama_sumber: string;
  nominal: number;
  urutan?: number;
}

export interface AlokasiAnggaran {
  id?: number;
  periode_bulan: string; // Format: YYYY-MM
  total_pendapatan: number;
  catatan?: string;
  pendapatan: AlokasiPendapatan[];
  pos: AlokasiPos[];
  dibuat_pada?: string;
  diperbarui_pada?: string;
}

export interface MilestoneFIRE {
  level: number;
  nama: string;
  pengali: number;
  target_nominal: number;
  deskripsi: string;
  ikon: string;
  warna: string;
}
