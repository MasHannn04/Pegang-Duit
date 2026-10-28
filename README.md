<div align="center">

# 💳 Pegang Duit

**Aplikasi Pembukuan Keuangan Pribadi, Audit Rekonsiliasi Kas Fisik, dan Perencanaan Kebebasan Finansial (FIRE) — 100% Luring (Offline), Cepat, dan Bebas Iklan.**

[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Basis_Data_Lokal-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Lisensi](https://img.shields.io/badge/Lisensi-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-orange?style=for-the-badge)](https://github.com/MasHannn04/Pegang-Duit)

</div>

---

## 📖 Tentang Pegang Duit

Sebagian besar aplikasi pencatat keuangan di Play Store memiliki masalah umum yang serupa:
- **Wajib login akun atau sync cloud**, sehingga lambat dibuka saat sinyal buruk dan rawan kebocoran data privasi.
- **Dipenuhi iklan** yang mengganggu kenyamanan mencatat transaksi harian.
- **Tidak ada fitur audit uang nyata**: Catatan di aplikasi terlihat masih ada saldo Rp 2 Juta, namun saat memeriksa rekening ATM atau isi dompet fisik ternyata uangnya sudah habis karena kas kantor tercampur atau ada pengeluaran yang lupa tercatat.
- **Rumus anggaran terlalu kaku**: Memaksakan aturan baku *50/30/20* dari luar negeri yang membuat pekerja mandiri, *fresh graduate*, atau penerima upah harian kelaparan di akhir bulan (*forced saving trap*).

**Pegang Duit** hadir untuk menyelesaikan seluruh persoalan tersebut. Dibangun dengan prinsip **Local-First (Utamakan Penyimpanan Lokal)**, seluruh transaksi, saldo dompet fisik, dan alokasi anggaran disimpan seutuhnya di HP kamu tanpa ketergantungan server pihak ketiga.

---

## ✨ Fitur-Fitur Unggulan

### 1. 📊 Multi-Buku Keuangan Fleksibel
- Pisahkan catatan antara **Keuangan Pribadi**, **Kas Pegangan / Kantor**, uang kepanitiaan, hingga tabungan proyek.
- Bebas menambah buku baru, mengubah nama, ikon, warna tema, serta mengarsipkan buku lama tanpa merusak riwayat transaksi masa lalu.

### 2. 🛡️ Audit & Rekonsiliasi Uang Fisik (Fitur Andalan)
- Catat saldo nyata di berbagai kantong penyimpanan: **Rekening Bank**, **Dompet Tunai**, **ShopeePay**, **GoPay**, **Dana**, dan lainnya.
- Sistem secara otomatis menghitung selisih uang:
  $$\text{Selisih} = \text{Total Uang Aktual Fisik} - \text{Total Saldo Seluruh Buku Laporan}$$
- Memberikan peringatan instan jika uang fisik berselisih, lengkap dengan tombol satu-klik untuk mencatat selisih ke buku kas.

### 3. 🎯 Alokasi Gaji & Target FIRE (*Financial Freedom*)
- **Kalkulasi Dua Arah (*Two-Way Dynamic Binding*):**
  - Masukkan nominal biaya hidup riil (misal: *Rp 1.700.000*) ➔ persentase anggaran otomatis terhitung (*60.7%*).
  - Atau masukkan persentase (misal: *20%*) ➔ nominal tabungan dingin langsung terhitung (*Rp 560.000*).
- **Pilihan Preset Ramah Anak Kos & Freshgrad:**
  - `70 / 20 / 10` *(Rekomendasi Anak Kos & Freshgrad Mandiri)*
  - `80 / 20` *(Pay Yourself First)*
  - `60 / 20 / 20` *(Transisi Peningkatan Pendapatan)*
  - `50 / 30 / 20` *(Standar Klasik)*
- **Tangga Kebebasan Finansial (FIRE Tracker):**
  - 🛡️ *Level 1:* Dana Darurat Mini (1 Bulan)
  - 🏰 *Level 2:* Dana Darurat Stabil (6 Bulan — Standar Utama)
  - 🌿 *Level 3:* Bantalan Bebas Cemas (12 Bulan / 1 Tahun)
  - 🔥 *Level 4:* Lean FIRE (Pensiun Pokok 300x)
  - 🏆 *Level 5:* Traditional FIRE (Pensiun Bebas Penuh 300x / Aturan 4%)

### 4. 📑 Laporan Mutasi & Portofolio Modern
- Tampilan portofolio bersih terinspirasi aplikasi finansial modern.
- Riwayat transaksi harian dilengkapi **Saldo Berjalan (*Running Balance*)** yang presisi di setiap baris transaksi.
- Filter transaksi cepat per kategori (Konsumsi, Tempat Tinggal, Transportasi, Belanja, Gaji, dll.).

### 5. 📤 Ekspor Laporan Excel (.xlsx) Siap Pakai
- Hasilkan berkas spreadsheet `.xlsx` profesional dengan tabel berkode warna, format mata uang Rupiah rapi, dan rumus saldo otomatis.
- Siap dibagikan langsung ke WhatsApp, Google Drive, atau email.

### 6. 🔒 Cadangkan & Pulihkan Data Mandiri (.json)
- Ekspor seluruh isi database ke satu berkas `.json` kapan saja.
- Pindah ke HP baru semudah memilih berkas cadangan tanpa perlu koneksi internet.

### 7. 📱 Navigasi Nyaman & Ergonomis
- Penanganan tombol fisik **Kembali (Back)** bawaan Android bertingkat (tutup modal ➔ kembali dari detail laporan ➔ batalkan mode edit ➔ riwayat tab ➔ konfirmasi keluar).
- Tata letak responsif (*Safe Area Insets*), bebas dari masalah tumpang tindih dengan navigasi gestur maupun tombol navigasi Android.

---

## 🛠️ Teknologi yang Digunakan

| Bagian | Teknologi |
| :--- | :--- |
| **Kerangka Kerja Mobile** | [React Native 0.86](https://reactnative.dev/) dengan [Expo SDK 57](https://expo.dev/) |
| **Bahasa Pemrograman** | [TypeScript 6.0](https://www.typescriptlang.org/) |
| **Basis Data Lokal** | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) *(Mode WAL Aktif)* |
| **Tata Letak & Gaya** | Vanilla React Native StyleSheet *(Estetika Finansial Modern)* |
| **Ikon** | [@expo/vector-icons (Ionicons)](https://icons.expo.fyi/) |
| **Pengolah Excel** | [xlsx](https://www.npmjs.com/package/xlsx) & [xlsx-js-style](https://www.npmjs.com/package/xlsx-js-style) |
| **Kompilasi & Rilis** | [EAS (Expo Application Services)](https://expo.dev/eas) |

---

## 📁 Struktur Direktori Proyek

```text
Pegang Duit/
├── assets/                    # Aset ikon aplikasi & layar pembuka (splash screen)
├── src/
│   ├── components/            # Komponen antarmuka yang dapat digunakan ulang
│   │   ├── CustomAlertModal.tsx     # Kotak dialog peringatan kustom seragam
│   │   ├── HeaderPeriode.tsx        # Navigasi bulan & pembatas periode waktu
│   │   ├── KartuAuditStatus.tsx     # Kartu status audit selisih kas fisik
│   │   ├── KartuRingkasan.tsx       # Kartu saldo, tanggungan, pemasukan & pengeluaran
│   │   ├── ModalAlokasiGaji.tsx     # Perencana alokasi anggaran & tangga pensiun FIRE
│   │   ├── ModalAuditDompet.tsx     # Modal rekonsiliasi saldo dompet fisik
│   │   ├── ModalKalkulatorGaji.tsx  # Kalkulator verifikasi tarif harian
│   │   ├── ModalKelolaKategori.tsx  # Pengelola kategori transaksi
│   │   ├── NavbarBawah.tsx          # Bilah navigasi bawah 5 tab responsif
│   │   └── TabelTransaksi.tsx       # Tabel mutasi dengan saldo berjalan
│   ├── database/              # Lapisan akses data SQLite
│   │   ├── db.ts                    # Inisialisasi basis data, skema DDL, & migrasi
│   │   ├── alokasiGaji.ts           # Logika penyimpanan alokasi anggaran
│   │   ├── dompet.ts                # Operasi data dompet fisik aktual
│   │   ├── jenisKeuangan.ts         # Operasi master buku keuangan
│   │   ├── kategori.ts              # Operasi kategori transaksi
│   │   ├── rekonsiliasi.ts          # Perhitungan audit & log riwayat
│   │   └── transaksi.ts             # Operasi mutasi transaksi & saldo awal
│   ├── theme/
│   │   └── colors.ts                # Palet token warna tema aplikasi
│   ├── types/
│   │   └── index.ts                 # Definisi tipe data TypeScript lengkap
│   ├── utils/
│   │   ├── backup.ts                # Utilitas ekspor & pemulihan data cadangan JSON
│   │   ├── customAlert.ts           # Pemicu notifikasi modal kustom
│   │   ├── exportExcel.ts           # Generator berkas spreadsheet .xlsx
│   │   ├── format.ts                # Pemformatan mata uang Rupiah & tanggal lokal
│   │   └── simulasi.ts              # Data contoh untuk pengujian aplikasi
│   └── views/                 # Layar utama aplikasi
│       ├── DashboardView.tsx        # Ringkasan saldo semua buku & status audit
│       ├── DompetView.tsx           # Layar pengelolaan saldo uang fisik
│       ├── CatatView.tsx            # Formulir pencatatan transaksi masuk/keluar
│       ├── LaporanView.tsx          # Portofolio buku & rincian mutasi ledger
│       └── AkunView.tsx             # Pengaturan profil, cadangan, & alat tambahan
├── App.tsx                    # Komponen induk aplikasi & pengendali navigasi
├── app.json                   # Konfigurasi aplikasi Expo & paket Android
└── package.json               # Daftar pustaka & dependensi
```

---

## 🚀 Panduan Memulai

### Prasyarat
Pastikan komputer kamu telah terpasang:
- [Node.js](https://nodejs.org/) (Versi LTS disarankan, Node 18+)
- [Git](https://git-scm.com/)
- Perangkat Android (dengan aplikasi **Expo Go**) atau Emulator Android

### Langkah Pemasangan

1. **Unduh repositori ini:**
   ```bash
   git clone https://github.com/MasHannn04/Pegang-Duit.git
   cd Pegang-Duit
   ```

2. **Pasang seluruh dependensi pustaka:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan lokal:**
   ```bash
   npx expo start
   ```

4. **Buka di Ponsel:**
   - Buka aplikasi **Expo Go** pada ponsel Android kamu.
   - Pindai (*scan*) kode QR yang ditampilkan di terminal komputer.

---

## 📦 Kompilasi Menjadi Berkas APK (Android)

Proyek ini telah terkonfigurasi dengan **EAS Build** untuk membangun berkas `.apk` mandiri tanpa perlu memasang Android Studio di komputer lokal:

```bash
# 1. Masuk ke akun Expo / EAS kamu
npx eas-cli login

# 2. Jalankan kompilasi APK mandiri
npx eas-cli build -p android --profile preview
```

Setelah proses kompilasi cloud selesai, kamu akan memperoleh tautan unduhan langsung untuk memasang file `.apk` di ponsel.

---

## 🤝 Kontribusi & Kolaborasi

Kontribusi, kritik, dan saran selalu terbuka lebar bagi siapa saja!
1. Lakukan *fork* pada repositori ini
2. Buat *branch* fitur baru kamu (`git checkout -b fitur/FiturKeren`)
3. Simpan perubahan kode kamu (`git commit -m 'feat: menambahkan fitur keren'`)
4. Unggah ke *branch* kamu (`git push origin fitur/FiturKeren`)
5. Ajukan sebuah **Pull Request**

> 🎧 **Vibe Coding dengan AI:** Arsitektur, antarmuka, dan seluruh logika aplikasi ini dikembangkan secara interaktif melalui metode *vibe coding* bersama **Google Gemini** menggunakan **Antigravity IDE**.

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah Lisensi **MIT**. Kunjungi berkas [LICENSE](LICENSE) untuk informasi lisensi selengkapnya.

---

<div align="center">
  Dibuat dengan ❤️ untuk membantu mengelola uang harian dengan jujur, tenang, dan teratur.<br/>
  <sub>Dikembangkan santai melalui vibe coding bersama Google Gemini via Antigravity IDE.</sub>
</div>
