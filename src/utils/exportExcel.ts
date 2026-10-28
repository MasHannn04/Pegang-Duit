import * as XLSX from 'xlsx-js-style';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { ambilJenisKeuanganBulan } from '../database/jenisKeuangan';
import { ambilTransaksiBulan } from '../database/transaksi';
import { ambilSemuaDompet } from '../database/dompet';
import { hitungStatusAudit } from '../database/rekonsiliasi';
import { ambilPengaturan, simpanPengaturan } from '../database/pengaturan';
import { formatPeriodeBulan } from './format';
import { tampilkanAlert } from './customAlert';

const { StorageAccessFramework } = FileSystem;

// Definisi Style Garis (Border) Hitam Tajam & Jelas Standar Excel
const borderThin = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const borderTotal = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'double', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const styleTableTitle = {
  font: { bold: true, color: { rgb: '0F172A' }, sz: 10 },
  fill: { fgColor: { rgb: 'E2E8F0' } }, // Header abu-abu sejuk lembut profesional
  border: borderThin,
  alignment: { vertical: 'center', horizontal: 'center' },
};

const styleHeaderCol = {
  font: { bold: true, color: { rgb: '0F172A' }, sz: 10 },
  fill: { fgColor: { rgb: 'F1F5F9' } },
  border: borderThin,
  alignment: { vertical: 'center', horizontal: 'center' },
};

const styleDataCenter = {
  font: { color: { rgb: '000000' }, sz: 10 },
  border: borderThin,
  alignment: { vertical: 'center', horizontal: 'center' },
};

const styleDataLeft = {
  font: { color: { rgb: '000000' }, sz: 10 },
  border: borderThin,
  alignment: { vertical: 'center', horizontal: 'left' },
};

const styleDataNum = {
  font: { color: { rgb: '000000' }, sz: 10 },
  border: borderThin,
  alignment: { vertical: 'center', horizontal: 'right' },
};

const styleTotalNum = {
  font: { bold: true, color: { rgb: '000000' }, sz: 10 },
  fill: { fgColor: { rgb: 'F8FAFC' } },
  border: borderTotal,
  alignment: { vertical: 'center', horizontal: 'right' },
};

const styleTotalLabel = {
  font: { bold: true, color: { rgb: '000000' }, sz: 10 },
  fill: { fgColor: { rgb: 'F8FAFC' } },
  border: borderTotal,
  alignment: { vertical: 'center', horizontal: 'center' },
};

/**
 * Menghasilkan file Excel (.xlsx) dengan:
 * 1. Setiap tabel digarisi rapi (border tipis hitam & border ganda untuk total).
 * 2. Jarak 2 kolom kosong ke samping (antara tabel kiri dan tabel kanan).
 * 3. Jarak 3 baris kosong ke bawah (antara tabel yang berbeda).
 * 4. Angka berformat ribuan titik (#,##0) tanpa angka 0 berantakan.
 */
export const eksporLaporanBulanKeExcel = async (
  periodeBulan: string
): Promise<{ sukses: boolean; pesan: string }> => {
  const labelBulan = formatPeriodeBulan(periodeBulan);

  // 1. Ambil data database
  const semuaJenis = await ambilJenisKeuanganBulan(periodeBulan);
  const jenisAktif = semuaJenis.filter((j) => j.is_aktif_bulan_ini);
  const dompetList = await ambilSemuaDompet();
  const audit = await hitungStatusAudit(periodeBulan);

  // 2. Siapkan Worksheet Excel
  const worksheet: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  let maxR = 0;
  let maxC = 0;

  const setCell = (
    r: number,
    c: number,
    val: any,
    style?: any,
    format?: string
  ) => {
    const address = XLSX.utils.encode_cell({ r, c });
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;

    if (val === null || val === undefined || val === '') {
      if (style) {
        worksheet[address] = { t: 's', v: '', s: style };
      }
      return;
    }

    if (typeof val === 'number') {
      worksheet[address] = {
        t: 'n',
        v: val,
        z: format || '#,##0',
        s: style || styleDataNum,
      };
    } else {
      worksheet[address] = {
        t: 's',
        v: String(val),
        s: style || styleDataLeft,
      };
    }
  };

  // Helper untuk membuat Header Judul Tabel yang di-merge dan bergaris penuh
  const setTableTitle = (
    r: number,
    cStart: number,
    cEnd: number,
    titleText: string
  ) => {
    for (let c = cStart; c <= cEnd; c++) {
      setCell(r, c, c === cStart ? titleText : '', styleTableTitle);
    }
    if (cEnd > cStart) {
      merges.push({ s: { r, c: cStart }, e: { r, c: cEnd } });
    }
  };

  // Header Judul Utama Laporan
  setCell(1, 1, 'LAPORAN KEUANGAN PEGANG DUIT', {
    font: { bold: true, color: { rgb: '0F172A' }, sz: 14 },
  });
  setCell(2, 1, `Periode: ${labelBulan.toUpperCase()}`, {
    font: { bold: true, color: { rgb: '475569' }, sz: 11 },
  });

  // --------------------------------------------------------------------------
  // TABEL KANAN: PENEMPATAN UANG NYATA, REKONSILIASI, & RINCIAN BUKU KAS
  // Jarak ke kanan: TEPAT 2 KOLOM KOSONG (Col H dan Col I kosong -> mulai di Col J / c=9)
  // --------------------------------------------------------------------------
  const colRightStart = 9; // Col J (Index 9: A=0, B=1..G=6 [Tabel Kiri], H=7 [kosong], I=8 [kosong], J=9)

  // 1. Tabel Penempatan Uang Nyata
  let rowRight = 4;
  const colRightEndPenempatan = colRightStart + dompetList.length;

  setTableTitle(
    rowRight,
    colRightStart,
    colRightEndPenempatan,
    'TABEL PENEMPATAN (UANG AKTUAL)'
  );
  rowRight++;

  let cDompet = colRightStart;
  dompetList.forEach((d) => {
    setCell(rowRight, cDompet, d.nama, styleHeaderCol);
    setCell(rowRight + 1, cDompet, d.saldo_sekarang, styleDataNum, '#,##0');
    cDompet++;
  });
  setCell(rowRight, cDompet, 'TOTAL UANG AKTUAL', styleHeaderCol);
  setCell(rowRight + 1, cDompet, audit.total_fisik, styleTotalNum, '#,##0');

  // Baris data penempatan selesai di (rowRight + 1).
  // Jarak ke bawah: TEPAT 3 BARIS KOSONG sebelum tabel rekonsiliasi!
  // (rowRight + 2 kosong, rowRight + 3 kosong, rowRight + 4 kosong)
  rowRight = rowRight + 1 + 4;

  // 2. Tabel Rekonsiliasi Keuangan (Audit)
  const colRightEndRekon = colRightStart + 3;

  setTableTitle(
    rowRight,
    colRightStart,
    colRightEndRekon,
    'REKONSILIASI KEUANGAN (AUDIT SALDO)'
  );
  rowRight++;

  setCell(rowRight, colRightStart, 'Total Uang Aktual', styleHeaderCol);
  setCell(rowRight, colRightStart + 1, 'Total Laporan', styleHeaderCol);
  setCell(rowRight, colRightStart + 2, 'Selisih', styleHeaderCol);
  setCell(rowRight, colRightStart + 3, 'Status Audit', styleHeaderCol);
  rowRight++;

  setCell(rowRight, colRightStart, audit.total_fisik, styleDataNum, '#,##0');
  setCell(rowRight, colRightStart + 1, audit.total_buku_seluruhnya, styleDataNum, '#,##0');
  setCell(rowRight, colRightStart + 2, audit.selisih, styleDataNum, '#,##0');
  setCell(
    rowRight,
    colRightStart + 3,
    audit.selisih === 0 ? 'SEIMBANG' : 'SELISIH',
    {
      ...styleDataCenter,
      font: {
        bold: true,
        color: { rgb: audit.selisih === 0 ? '15803D' : 'DC2626' },
      },
    }
  );

  // Baris data rekonsiliasi selesai di rowRight.
  // Jarak ke bawah: TEPAT 3 BARIS KOSONG sebelum tabel rincian buku kas!
  // (rowRight + 1 kosong, rowRight + 2 kosong, rowRight + 3 kosong)
  rowRight = rowRight + 4;

  // 3. Tabel Rincian Saldo Buku Laporan
  const colRightEndRincian = colRightStart + 1;

  setTableTitle(
    rowRight,
    colRightStart,
    colRightEndRincian,
    'RINCIAN SALDO LAPORAN'
  );
  rowRight++;

  setCell(rowRight, colRightStart, 'Nama Buku Laporan', styleHeaderCol);
  setCell(rowRight, colRightStart + 1, 'Saldo Akhir', styleHeaderCol);
  rowRight++;

  audit.rincian_buku.forEach((b) => {
    setCell(rowRight, colRightStart, b.nama, styleDataLeft);
    setCell(rowRight, colRightStart + 1, b.saldo, styleDataNum, '#,##0');
    rowRight++;
  });

  // Total Semua Buku Laporan
  setCell(rowRight, colRightStart, 'TOTAL LAPORAN', styleTotalLabel);
  setCell(rowRight, colRightStart + 1, audit.total_buku_seluruhnya, styleTotalNum, '#,##0');

  // --------------------------------------------------------------------------
  // TABEL KIRI: DAFTAR BUKU KAS & MUTASI TRANSAKSI
  // Mulai di Col B (c=1) sampai Col G (c=6). Antar tabel buku kas diberi jarak 3 BARIS KOSONG ke bawah.
  // --------------------------------------------------------------------------
  let rowLeft = 4;

  for (let index = 0; index < jenisAktif.length; index++) {
    const jk = jenisAktif[index];
    const dataTrx = await ambilTransaksiBulan(jk.id, periodeBulan);

    // Judul Tabel Buku Laporan (Di-merge B sampai G dengan garis penuh)
    setTableTitle(
      rowLeft,
      1,
      6,
      `${index + 1}. LAPORAN: ${jk.nama.toUpperCase()}`
    );
    rowLeft++;

    // Header Kolom Tabel Mutasi (Digarisi rapi)
    setCell(rowLeft, 1, 'Tanggal', styleHeaderCol);
    setCell(rowLeft, 2, 'Kategori', styleHeaderCol);
    setCell(rowLeft, 3, 'Uraian Transaksi', styleHeaderCol);
    setCell(rowLeft, 4, 'Debit (Masuk)', styleHeaderCol);
    setCell(rowLeft, 5, 'Kredit (Keluar)', styleHeaderCol);
    setCell(rowLeft, 6, 'Saldo', styleHeaderCol);
    rowLeft++;

    // Baris Saldo Awal jika ada
    if (dataTrx.ringkasan.saldo_awal !== 0) {
      setCell(rowLeft, 1, 1, styleDataCenter);
      setCell(rowLeft, 2, '-', styleDataCenter);
      const labelAwal = dataTrx.ringkasan.saldo_awal > 0 ? 'Sisa Bulan Lalu' : 'Tanggungan Bulan Lalu';
      setCell(rowLeft, 3, labelAwal, styleDataLeft);
      if (dataTrx.ringkasan.saldo_awal > 0) {
        setCell(rowLeft, 4, dataTrx.ringkasan.saldo_awal, styleDataNum, '#,##0');
        setCell(rowLeft, 5, '', styleDataNum);
      } else {
        setCell(rowLeft, 4, '', styleDataNum);
        setCell(rowLeft, 5, Math.abs(dataTrx.ringkasan.saldo_awal), styleDataNum, '#,##0');
      }
      setCell(rowLeft, 6, dataTrx.ringkasan.saldo_awal, styleDataNum, '#,##0');
      rowLeft++;
    }

    // Baris-baris Transaksi (Semua digarisi rapi)
    dataTrx.transaksi.forEach((t) => {
      const tgl = parseInt(t.tanggal.split('-')[2] || t.tanggal, 10);
      setCell(rowLeft, 1, isNaN(tgl) ? t.tanggal : tgl, styleDataCenter);
      setCell(rowLeft, 2, t.nama_kategori || '-', styleDataCenter);
      setCell(rowLeft, 3, t.keterangan, styleDataLeft);
      if (t.tipe === 'debit') {
        setCell(rowLeft, 4, t.nominal, styleDataNum, '#,##0');
        setCell(rowLeft, 5, '', styleDataNum);
      } else {
        setCell(rowLeft, 4, '', styleDataNum);
        setCell(rowLeft, 5, t.nominal, styleDataNum, '#,##0');
      }
      setCell(rowLeft, 6, t.saldo_berjalan ?? 0, styleDataNum, '#,##0');
      rowLeft++;
    });

    // Baris TOTAL Buku Kas (Border Ganda Akuntansi)
    setCell(rowLeft, 1, 'TOTAL', styleTotalLabel);
    setCell(rowLeft, 2, '', styleTotalLabel);
    setCell(rowLeft, 3, '', styleTotalLabel);
    merges.push({ s: { r: rowLeft, c: 1 }, e: { r: rowLeft, c: 3 } });

    setCell(rowLeft, 4, dataTrx.ringkasan.total_debit, styleTotalNum, '#,##0');
    setCell(rowLeft, 5, dataTrx.ringkasan.total_kredit, styleTotalNum, '#,##0');
    setCell(rowLeft, 6, dataTrx.ringkasan.saldo_akhir, styleTotalNum, '#,##0');

    // Jarak ke bawah: TEPAT 3 BARIS KOSONG sebelum tabel buku berikutnya!
    // (rowLeft + 1 kosong, rowLeft + 2 kosong, rowLeft + 3 kosong)
    rowLeft = rowLeft + 4;
  }

  // Tentukan batas akhir worksheet & daftar merge
  worksheet['!merges'] = merges;
  worksheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(maxR + 2, rowRight + 2, rowLeft + 2), c: Math.max(maxC + 1, 16) },
  });

  // Lebar Kolom yang Rapi & Jelas:
  // Col B-G: Tabel Kiri (Tanggal, Kategori, Uraian, Debit, Kredit, Saldo)
  // Col H & I: 2 Kolom Kosong sebagai Pembatas ke Kanan
  // Col J dst: Tabel Kanan (Penempatan, Rekonsiliasi, Rincian Saldo)
  worksheet['!cols'] = [
    { wch: 3 },  // Col A: Margin kiri
    { wch: 10 }, // Col B: Tanggal
    { wch: 18 }, // Col C: Kategori
    { wch: 34 }, // Col D: Uraian Transaksi
    { wch: 16 }, // Col E: Debit (Masuk)
    { wch: 16 }, // Col F: Kredit (Keluar)
    { wch: 18 }, // Col G: Saldo
    { wch: 5 },  // Col H: KOSONG (Jarak kolom 1 ke kanan)
    { wch: 5 },  // Col I: KOSONG (Jarak kolom 2 ke kanan)
    { wch: 18 }, // Col J: Tabel Kanan mulai di sini
    { wch: 18 }, // Col K
    { wch: 18 }, // Col L
    { wch: 18 }, // Col M
    { wch: 18 }, // Col N
    { wch: 18 }, // Col O
    { wch: 18 }, // Col P
  ];

  // 3. Konversi ke Workbook Excel
  const workbook = XLSX.utils.book_new();
  const namaSheet = labelBulan.replace(/\s+/g, '_').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, namaSheet);

  // 4. Generate base64
  const base64Content = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const namaFile = `Laporan_Keuangan_${periodeBulan}.xlsx`;
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // 5. Simpan otomatis ke folder Download/Pegang Duit/
  return await simpanKeFolderDownload(namaFile, base64Content, mimeType);
};

/**
 * Menyimpan file secara otomatis ke folder Download/Pegang Duit/ di Android
 * menggunakan Storage Access Framework (SAF).
 */
const simpanKeFolderDownload = async (
  namaFile: string,
  base64Content: string,
  mimeType: string
): Promise<{ sukses: boolean; pesan: string }> => {
  if (Platform.OS !== 'android') {
    const pathFile = `${FileSystem.cacheDirectory}${namaFile}`;
    await FileSystem.writeAsStringAsync(pathFile, base64Content, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pathFile, { mimeType, dialogTitle: `Simpan ${namaFile}` });
    }
    return { sukses: true, pesan: 'File siap disimpan atau dibagikan.' };
  }

  try {
    let savedTargetFolderUri = await ambilPengaturan('folder_ekspor_uri');

    // Jika sudah ada izin folder sebelumnya, langsung simpan otomatis
    if (savedTargetFolderUri) {
      try {
        const fileUri = await StorageAccessFramework.createFileAsync(
          savedTargetFolderUri,
          namaFile,
          mimeType
        );
        await StorageAccessFramework.writeAsStringAsync(fileUri, base64Content, {
          encoding: FileSystem.EncodingType.Base64,
        });

        tampilkanAlert(
          'Berhasil Diunduh!',
          `File telah tersimpan di folder:\n📁 Download/Pegang Duit/${namaFile}`
        );

        return {
          sukses: true,
          pesan: `File berhasil diunduh ke folder Download/Pegang Duit/${namaFile}`,
        };
      } catch (err) {
        savedTargetFolderUri = null;
      }
    }

    // Jika belum ada izin atau izin kedaluwarsa
    tampilkanAlert(
      'Pilih Folder Download',
      'Pilih folder "Download", lalu ketuk "BUAT FOLDER BARU" dengan nama "Pegang Duit", lalu ketuk "GUNAKAN FOLDER INI".\n\n(Langkah ini hanya perlu 1x saja)',
      [
        {
          text: 'Pilih Folder',
          onPress: async () => {
            try {
              const initialDownloadUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
              const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(
                initialDownloadUri
              );

              if (!permissions.granted) {
                await fallbackShare(namaFile, base64Content, mimeType);
                return;
              }

              const rootGrantedUri = permissions.directoryUri;
              let targetFolderUri = rootGrantedUri;

              try {
                const items = await StorageAccessFramework.readDirectoryAsync(rootGrantedUri);
                const folderAda = items.find((item) => {
                  const decoded = decodeURIComponent(item);
                  return decoded.endsWith('/Pegang Duit') || decoded.endsWith('Pegang Duit');
                });

                if (folderAda) {
                  targetFolderUri = folderAda;
                } else {
                  targetFolderUri = await StorageAccessFramework.makeDirectoryAsync(
                    rootGrantedUri,
                    'Pegang Duit'
                  );
                }
              } catch {
                targetFolderUri = rootGrantedUri;
              }

              await simpanPengaturan('folder_ekspor_uri', targetFolderUri);

              const fileUri = await StorageAccessFramework.createFileAsync(
                targetFolderUri,
                namaFile,
                mimeType
              );
              await StorageAccessFramework.writeAsStringAsync(fileUri, base64Content, {
                encoding: FileSystem.EncodingType.Base64,
              });

              tampilkanAlert(
                'Berhasil Diunduh!',
                `File tersimpan di:\n📁 Download/Pegang Duit/${namaFile}`
              );
            } catch (err: any) {
              await fallbackShare(namaFile, base64Content, mimeType);
            }
          },
        },
      ]
    );

    return { sukses: true, pesan: 'Memproses unduhan file...' };
  } catch (error: any) {
    await fallbackShare(namaFile, base64Content, mimeType);
    return { sukses: true, pesan: 'File dibuka di menu simpan/bagikan.' };
  }
};

const fallbackShare = async (namaFile: string, base64Content: string, mimeType: string) => {
  const pathFile = `${FileSystem.cacheDirectory}${namaFile}`;
  await FileSystem.writeAsStringAsync(pathFile, base64Content, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pathFile, {
      mimeType,
      dialogTitle: `Simpan ${namaFile}`,
      UTI: 'com.microsoft.excel.xlsx',
    });
  }
};
