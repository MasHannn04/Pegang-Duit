// Utilitas Pemformatan Angka, Rupiah, dan Tanggal (Bahasa Indonesia)

export const formatRupiah = (nominal: number): string => {
  const isNegative = nominal < 0;
  const absValue = Math.abs(nominal);
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
};

export const parseAngka = (input: string): number => {
  if (!input) return 0;
  // Hapus semua karakter non-digit kecuali tanda minus di awal
  const clean = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatPeriodeBulan = (periodeYyyyMm: string): string => {
  if (!periodeYyyyMm || !periodeYyyyMm.includes('-')) return periodeYyyyMm;
  const [tahun, bulanStr] = periodeYyyyMm.split('-');
  const bulanIndex = parseInt(bulanStr, 10) - 1;
  return `${NAMA_BULAN[bulanIndex] || bulanStr} ${tahun}`;
};

export const getTanggalHariIni = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getPeriodeBulanSekarang = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

export const formatTanggalTampilan = (tanggalYyyyMmDd: string): string => {
  if (!tanggalYyyyMmDd) return '';
  const parts = tanggalYyyyMmDd.split('-');
  if (parts.length !== 3) return tanggalYyyyMmDd;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${day} ${NAMA_BULAN[monthIdx]?.substring(0, 3)} ${year}`;
};

export const getPeriodeBulanOffset = (periodeYyyyMm: string, offsetBulan: number): string => {
  if (!periodeYyyyMm || !periodeYyyyMm.includes('-')) return getPeriodeBulanSekarang();
  const [tahunStr, bulanStr] = periodeYyyyMm.split('-');
  let y = parseInt(tahunStr, 10);
  let m = parseInt(bulanStr, 10) + offsetBulan;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
};
