<div align="center">

# 💳 Pegang Duit

**Aplikasi Pembukuan Keuangan Pribadi, Audit Rekonsiliasi Kas Fisik, dan Perencanaan Kebebasan Finansial (FIRE) — 100% Offline, Cepat, dan Bebas Iklan.**

[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-orange?style=for-the-badge)](https://github.com/MasHannn04/pegang-duit)

</div>

---

## 📖 Tentang Pegang Duit

Sebagian besar aplikasi pencatat keuangan di Play Store memiliki masalah yang sama:
- **Wajib login / akun cloud**, sehingga rawan kebocoran data privasi dan lemot saat internet buruk.
- **Penuh iklan** yang mengganggu pengalaman mencatat harian.
- **Tidak ada audit uang aktual**: Catatan di aplikasi bilang saldo masih Rp 2 Juta, tapi saat cek saldo ATM atau isi dompet fisik ternyata sudah ludes karena ada uang kas tercampur atau pengeluaran tak sadar.
- **Rumus anggaran terlalu kaku**: Memaksakan aturan *50/30/20* yang membuat fresh graduate atau karyawan berpenghasilan harian tersiksa dan kelaparan di akhir bulan (*forced saving trap*).

**Pegang Duit** hadir untuk memecahkan seluruh masalah tersebut. Dibangun dengan pendekatan **Local-First**, seluruh transaksi, audit fisik, dan rencana anggaran disimpan langsung di penyimpanan lokal HP kamu tanpa perantara server pihak ketiga.

---

## ✨ Fitur-Fitur Unggulan

### 1. 📊 Multi-Buku Keuangan Dinamis
- Pisahkan antara **Keuangan Pribadi**, **Kas Pegangan / Kantor**, uang kepanitiaan, atau tabungan proyek.
- Bebas menambah buku baru, mengubah nama, ikon, warna tema, serta mengarsipkan buku lama tanpa merusak riwayat transaksi masa lalu.

### 2. 🛡️ Audit & Rekonsiliasi Uang Fisik (Fitur Andalan)
- Catat saldo nyata di berbagai kantong aktual: **Rekening Bank**, **Dompet Tunai**, **ShopeePay**, **GoPay**, **Dana**, dll.
- Sistem secara otomatis menghitung:
  $$\text{Selisih} = \text{Total Uang Aktual Fisik} - \text{Total Saldo Seluruh Buku Laporan}$$
- Memberikan peringatan instan jika uang fisik tercecer/selisih, lengkap dengan tombol otomatis untuk mencatat selisih ke buku kas.

### 3. 🎯 Alokasi Gaji & Target FIRE (*Financial Freedom*)
- **Kalkulasi Dua Arah (*Two-Way Dynamic Binding*):**
  - Ketik nominal biaya hidup riil (misal: *Rp 1.700.000*) ➔ persentase anggaran otomatis terhitung (*60.7%*).
  - Atau ketik persentase (misal: *20%*) ➔ nominal tabungan dingin langsung terhitung (*Rp 560.000*).
- **Preset Anggaran Ramah Freshgrad & Karjimut:**
  - `70 / 20 / 10` *(Rekomendasi Anak Kos & Freshgrad Mandiri)*
  - `80 / 20` *(Pay Yourself First)*
  - `60 / 20 / 20` *(Transisi Naik Gaji)*
  - `50 / 30 / 20` *(Klasik)*
- **Tangga Kebebasan Finansial (FIRE Tracker):**
  - 🛡️ *Level 1:* Dana Darurat Mini (1 Bulan)
  - 🏰 *Level 2:* Dana Darurat Stabil (6 Bulan — Standar Utama)
  - 🌿 *Level 3:* Bantalan Bebas Cemas (12 Bulan / 1 Tahun)
  - 🔥 *Level 4:* Lean FIRE (Pensiun Pokok 300x)
  - 🏆 *Level 5:* Traditional FIRE (Pensiun Bebas Penuh 300x / The 4% Rule)

### 4. 📑 Laporan Mutasi & Portofolio Modern
- Desain portofolio bergaya fintech modern (*Bibit/Stripe style*).
- Riwayat transaksi harian dengan **Saldo Berjalan (*Running Balance*)** yang presisi.
- Filter transaksi cepat per kategori (Konsumsi, Kos, Kendaraan, Belanja, Gaji, dll.).

### 5. 📤 Ekspor Laporan Excel (.xlsx) Siap Pakai
- Hasilkan berkas spreadsheet `.xlsx` profesional dengan tabel berkode warna, format Rupiah rapi, dan kalkulasi total saldo otomatis.
- Siap dibagikan langsung ke WhatsApp, Google Drive, atau email.

### 6. 🔒 Cadangkan & Pulihkan Data Mandiri (.json)
- Ekspor seluruh database ke berkas tunggal `.json` kapan saja.
- Pindah HP atau ganti perangkat baru semudah memilih berkas cadangan tanpa perlu koneksi cloud.

### 7. 📱 Navigasi Nyaman & Ergonomis
- Penanganan tombol fisik **Back Android** bertingkat (tutup modal ➔ kembali dari detail ➔ batalkan edit ➔ riwayat tab ➔ konfirmasi keluar).
- Tata letak responsif dengan *Safe Area Insets*, bebas tumpang tindih dengan navigasi gesture maupun 3-tombol Android.

---

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Framework Mobile** | [React Native 0.86](https://reactnative.dev/) dengan [Expo SDK 57](https://expo.dev/) |
| **Bahasa Pemrograman** | [TypeScript 6.0](https://www.typescriptlang.org/) |
| **Penyimpanan Lokal** | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) *(WAL Mode Enabled)* |
| **Desain & Styling** | Vanilla React Native StyleSheet *(Fintech Modern Aesthetic)* |
| **Ikonografi** | [@expo/vector-icons (Ionicons)](https://icons.expo.fyi/) |
| **Generator Excel** | [xlsx](https://www.npmjs.com/package/xlsx) & [xlsx-js-style](https://www.npmjs.com/package/xlsx-js-style) |
| **Build & Release** | [EAS (Expo Application Services)](https://expo.dev/eas) |

---

## 📁 Struktur Direktori Project

```text
Pegang Duit/
├── assets/                    # Asset ikon aplikasi & splash screen
├── src/
│   ├── components/            # Komponen antarmuka yang dapat digunakan ulang
│   │   ├── CustomAlertModal.tsx     # Dialog alert kustom seragam
│   │   ├── HeaderPeriode.tsx        # Navigasi bulan & filter batas waktu
│   │   ├── KartuAuditStatus.tsx     # Kartu status selisih kas fisik
│   │   ├── KartuRingkasan.tsx       # Kartu saldo, tanggungan, debit & kredit
│   │   ├── ModalAlokasiGaji.tsx     # Planner alokasi gaji & FIRE milestones
│   │   ├── ModalAuditDompet.tsx     # Modal rekonsiliasi dompet fisik
│   │   ├── ModalKalkulatorGaji.tsx  # Verifikasi tarif harian sarjana
│   │   ├── ModalKelolaKategori.tsx  # Manajemen kategori transaksi
│   │   ├── NavbarBawah.tsx          # Navigasi bar bawah 5 tab responsif
│   │   └── TabelTransaksi.tsx       # Daftar mutasi dengan running balance
│   ├── database/              # Lapisan persistensi data SQLite
│   │   ├── db.ts                    # Inisialisasi DB, skema DDL, & migrasi
│   │   ├── alokasiGaji.ts           # Query alokasi anggaran & template
│   │   ├── dompet.ts                # CRUD dompet fisik aktual
│   │   ├── jenisKeuangan.ts         # CRUD master buku keuangan
│   │   ├── kategori.ts              # CRUD kategori transaksi
│   │   ├── rekonsiliasi.ts          # Perhitungan audit & histori log
│   │   └── transaksi.ts             # CRUD mutasi transaksi & saldo berjalan
│   ├── theme/
│   │   └── colors.ts                # Token warna desain sistem
│   ├── types/
│   │   └── index.ts                 # Definisi tipe data TypeScript lengkap
│   ├── utils/
│   │   ├── backup.ts                # Logika ekspor & pulihkan data JSON
│   │   ├── customAlert.ts           # Event emitter untuk custom modal alert
│   │   ├── exportExcel.ts           # Generator file spreadsheet .xlsx
│   │   ├── format.ts                # Pemformatan mata uang Rupiah & tanggal
│   │   └── simulasi.ts              # Data simulasi pengujian aplikasi
│   └── views/                 # Tampilan layar utama
│       ├── DashboardView.tsx        # Ringkasan saldo seluruh buku & audit
│       ├── DompetView.tsx           # Layar kelola saldo uang fisik
│       ├── CatatView.tsx            # Form cepat input mutasi pengeluaran/pemasukan
│       ├── LaporanView.tsx          # Tampilan portofolio buku & rincian mutasi
│       └── AkunView.tsx             # Profil lokal, cadangan data, & alat finansial
├── App.tsx                    # Root aplikasi & pengelola status navigasi
├── app.json                   # Konfigurasi proyek Expo & Android package
└── package.json               # Dependensi proyek
```

---

## 🚀 Panduan Memulai (Getting Started)

### Prasyarat
Pastikan komputer kamu sudah terpasang:
- [Node.js](https://nodejs.org/) (Versi LTS disarankan, Node 18+)
- [Git](https://git-scm.com/)
- Perangkat Android (dengan aplikasi **Expo Go**) atau Android Emulator

### Langkah Instalasi

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/MasHannn04/pegang-duit.git
   cd pegang-duit
   ```

2. **Pasang seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npx expo start
   ```

4. **Buka di HP:**
   - Buka aplikasi **Expo Go** di ponsel Android kamu.
   - Pindai (*scan*) kode QR yang muncul di terminal komputer.

---

## 📦 Build Menjadi File APK (Android)

Project ini telah terintegrasi dengan **EAS Build** untuk membuat file `.apk` mandiri tanpa memerlukan instalasi Android Studio lokal:

```bash
# 1. Login ke akun Expo / EAS kamu
npx eas-cli login

# 2. Jalankan build APK preview
npx eas-cli build -p android --profile preview
```

Setelah proses build cloud selesai, kamu akan mendapatkan tautan unduhan langsung untuk memasang file `.apk` di ponsel.

---

## 🤝 Kontribusi & Acknowledgments

Kontribusi, kritik, dan saran selalu terbuka lebar!
1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/FiturKeren`)
3. Commit perubahanmu (`git commit -m 'feat: menambahkan fitur keren'`)
4. Push ke branch (`git push origin feature/FiturKeren`)
5. Buka sebuah **Pull Request**

> 💡 **Pair Programming:** Arsitektur dan implementasi kode aplikasi ini dikembangkan melalui kolaborasi pair programming bersama **Gemini** (Google DeepMind) via **Antigravity IDE**.

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi **MIT**. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.

---

<div align="center">
  Dibuat dengan ❤️ untuk membantu mengelola uang harian dengan jujur, tenang, dan teratur.<br/>
  <sub>Dikembangkan bersama Google Gemini via Antigravity IDE.</sub>
</div>
