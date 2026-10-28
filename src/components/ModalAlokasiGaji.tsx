import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AlokasiAnggaran,
  AlokasiPendapatan,
  AlokasiPos,
  AlokasiSubpos,
  TipePosAlokasi,
} from '../types';
import {
  ambilAlokasiBulan,
  simpanAlokasiBulan,
  ambilAlokasiBulanSebelumnya,
  buatTemplateAlokasiAwal,
} from '../database/alokasiGaji';
import {
  formatRupiah,
  parseAngka,
  formatPeriodeBulan,
  getPeriodeBulanOffset,
  getPeriodeBulanSekarang,
} from '../utils/format';
import { tampilkanAlert } from '../utils/customAlert';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onTutup: () => void;
  periodeAwal?: string;
}

export const ModalAlokasiGaji: React.FC<Props> = ({
  visible,
  onTutup,
  periodeAwal,
}) => {
  const [periode, setPeriode] = useState(periodeAwal || getPeriodeBulanSekarang());
  const [tabAktif, setTabAktif] = useState<'alokasi' | 'fire'>('alokasi');
  const [loading, setLoading] = useState(false);
  const [alokasi, setAlokasi] = useState<AlokasiAnggaran | null>(null);

  // Muat data saat modal dibuka atau saat periode berganti
  const muatData = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const data = await ambilAlokasiBulan(p);
      if (data) {
        setAlokasi(data);
      } else {
        // Coba cek apakah ada bulan sebelumnya untuk disalin otomatis sebagai draf awal
        const prev = await ambilAlokasiBulanSebelumnya(p);
        if (prev) {
          // Salin struktur dari bulan sebelumnya tapi beri periode saat ini
          setAlokasi({
            ...prev,
            id: undefined,
            periode_bulan: p,
          });
        } else {
          // Buat template baru bawaan 70/20/10
          setAlokasi(buatTemplateAlokasiAwal(p));
        }
      }
    } catch (err: any) {
      console.error('Gagal memuat alokasi:', err);
      tampilkanAlert('Error', err.message || 'Gagal memuat data alokasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const targetBulan = periodeAwal || getPeriodeBulanSekarang();
      setPeriode(targetBulan);
      muatData(targetBulan);
    }
  }, [visible, periodeAwal, muatData]);

  const periodeSekarang = getPeriodeBulanSekarang();
  const isBulanSekarang = periode >= periodeSekarang;
  const isBulanTerawal = periode <= '2026-01';

  // Navigasi Bulan
  const handleGantiBulan = (offset: number) => {
    if (offset > 0 && isBulanSekarang) return;
    if (offset < 0 && isBulanTerawal) return;
    const baru = getPeriodeBulanOffset(periode, offset);
    if (offset > 0 && baru > periodeSekarang) return;
    if (offset < 0 && baru < '2026-01') return;
    setPeriode(baru);
    muatData(baru);
  };

  // Salin dari Bulan Lalu Manual
  const handleSalinBulanLalu = async () => {
    try {
      const prev = await ambilAlokasiBulanSebelumnya(periode);
      if (!prev) {
        tampilkanAlert('Informasi', 'Belum ada data alokasi di bulan-bulan sebelumnya untuk disalin.');
        return;
      }

      tampilkanAlert(
        'Salin Alokasi Bulan Lalu?',
        `Data bulan ${formatPeriodeBulan(prev.periode_bulan)} akan disalin ke ${formatPeriodeBulan(periode)}. Rincian saat ini akan digantikan.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Salin Sekarang',
            onPress: () => {
              setAlokasi({
                ...prev,
                id: alokasi?.id, // Pertahankan ID jika sudah pernah tersimpan di bulan ini
                periode_bulan: periode,
              });
              tampilkanAlert('Berhasil', 'Alokasi bulan lalu berhasil disalin. Silakan sesuaikan nominalnya jika ada perubahan!');
            },
          },
        ]
      );
    } catch (err: any) {
      tampilkanAlert('Error', err.message || 'Gagal menyalin alokasi');
    }
  };

  // Hitung total pendapatan dari array pendapatan
  const totalPendapatan = (alokasi?.pendapatan || []).reduce(
    (sum, p) => sum + (Number(p.nominal) || 0),
    0
  );

  // Handler Pemasukan (Tambah, Edit, Hapus)
  const handleUbahPendapatan = (index: number, field: 'nama_sumber' | 'nominal', val: string) => {
    if (!alokasi) return;
    const newList = [...alokasi.pendapatan];
    if (field === 'nominal') {
      newList[index] = { ...newList[index], nominal: parseAngka(val) };
    } else {
      newList[index] = { ...newList[index], nama_sumber: val };
    }
    setAlokasi({ ...alokasi, pendapatan: newList, total_pendapatan: newList.reduce((s, i) => s + i.nominal, 0) });
  };

  const handleTambahPendapatan = () => {
    if (!alokasi) return;
    const newList: AlokasiPendapatan[] = [
      ...alokasi.pendapatan,
      { nama_sumber: 'Sumber Pemasukan Baru', nominal: 0, urutan: alokasi.pendapatan.length + 1 },
    ];
    setAlokasi({ ...alokasi, pendapatan: newList });
  };

  const handleHapusPendapatan = (index: number) => {
    if (!alokasi) return;
    const newList = alokasi.pendapatan.filter((_, i) => i !== index);
    setAlokasi({ ...alokasi, pendapatan: newList, total_pendapatan: newList.reduce((s, i) => s + i.nominal, 0) });
  };

  // Handler Kalkulasi Dua Arah (Two-Way Dynamic Binding: Nominal ↔ Persentase)
  const handleUbahNominalPos = (tipePos: TipePosAlokasi, valStr: string) => {
    if (!alokasi) return;
    const nominal = parseAngka(valStr);
    const persen = totalPendapatan > 0 ? (nominal / totalPendapatan) * 100 : 0;

    const newPos = alokasi.pos.map((p) => {
      if (p.tipe_pos === tipePos) {
        return {
          ...p,
          target_nominal: nominal,
          target_persen: parseFloat(persen.toFixed(1)),
        };
      }
      return p;
    });

    setAlokasi({ ...alokasi, pos: newPos });
  };

  const handleUbahPersenPos = (tipePos: TipePosAlokasi, valStr: string) => {
    if (!alokasi) return;
    const persen = parseFloat(valStr.replace(',', '.')) || 0;
    const nominal = Math.round(totalPendapatan * (persen / 100));

    const newPos = alokasi.pos.map((p) => {
      if (p.tipe_pos === tipePos) {
        return {
          ...p,
          target_persen: persen,
          target_nominal: nominal,
        };
      }
      return p;
    });

    setAlokasi({ ...alokasi, pos: newPos });
  };

  // Terapkan Preset Proporsi
  const handleTerapkanPreset = (kebutuhanPersen: number, investasiPersen: number, keinginanPersen: number) => {
    if (!alokasi) return;
    const newPos = alokasi.pos.map((p) => {
      let pPersen = 0;
      if (p.tipe_pos === 'kebutuhan') pPersen = kebutuhanPersen;
      if (p.tipe_pos === 'investasi') pPersen = investasiPersen;
      if (p.tipe_pos === 'keinginan') pPersen = keinginanPersen;

      return {
        ...p,
        target_persen: pPersen,
        target_nominal: Math.round(totalPendapatan * (pPersen / 100)),
      };
    });

    setAlokasi({ ...alokasi, pos: newPos });
  };

  // Handler Subpos
  const handleUbahSubpos = (
    tipePos: TipePosAlokasi,
    subposIndex: number,
    field: 'nama_subpos' | 'nominal',
    val: string
  ) => {
    if (!alokasi) return;
    const newPos = alokasi.pos.map((p) => {
      if (p.tipe_pos === tipePos) {
        const newSub = [...p.subpos];
        if (field === 'nominal') {
          newSub[subposIndex] = { ...newSub[subposIndex], nominal: parseAngka(val) };
        } else {
          newSub[subposIndex] = { ...newSub[subposIndex], nama_subpos: val };
        }

        // Hitung total subpos
        const totalSubpos = newSub.reduce((s, item) => s + (Number(item.nominal) || 0), 0);
        const persen = totalPendapatan > 0 ? (totalSubpos / totalPendapatan) * 100 : p.target_persen;

        return {
          ...p,
          target_nominal: totalSubpos,
          target_persen: parseFloat(persen.toFixed(1)),
          subpos: newSub,
        };
      }
      return p;
    });

    setAlokasi({ ...alokasi, pos: newPos });
  };

  const handleTambahSubpos = (tipePos: TipePosAlokasi) => {
    if (!alokasi) return;
    const newPos = alokasi.pos.map((p) => {
      if (p.tipe_pos === tipePos) {
        const itemBaru: AlokasiSubpos = {
          nama_subpos: 'Subpos Baru',
          nominal: 0,
          urutan: p.subpos.length + 1,
        };
        return {
          ...p,
          subpos: [...p.subpos, itemBaru],
        };
      }
      return p;
    });

    setAlokasi({ ...alokasi, pos: newPos });
  };

  const handleHapusSubpos = (tipePos: TipePosAlokasi, subposIndex: number) => {
    if (!alokasi) return;
    const newPos = alokasi.pos.map((p) => {
      if (p.tipe_pos === tipePos) {
        const newSub = p.subpos.filter((_, idx) => idx !== subposIndex);
        const totalSubpos = newSub.reduce((s, item) => s + (Number(item.nominal) || 0), 0);
        const persen = totalPendapatan > 0 ? (totalSubpos / totalPendapatan) * 100 : p.target_persen;

        return {
          ...p,
          target_nominal: totalSubpos,
          target_persen: parseFloat(persen.toFixed(1)),
          subpos: newSub,
        };
      }
      return p;
    });

    setAlokasi({ ...alokasi, pos: newPos });
  };

  // Simpan Alokasi ke SQLite
  const handleSimpan = async () => {
    if (!alokasi) return;
    try {
      setLoading(true);
      await simpanAlokasiBulan(alokasi);
      setLoading(false);
      tampilkanAlert('Berhasil Disimpan', `Rencana alokasi anggaran bulan ${formatPeriodeBulan(periode)} telah berhasil disimpan!`);
      muatData(periode);
    } catch (err: any) {
      setLoading(false);
      tampilkanAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan ke database');
    }
  };

  // Kalkulasi Ringkasan Evaluasi
  const posKebutuhan = alokasi?.pos.find((p) => p.tipe_pos === 'kebutuhan');
  const posInvestasi = alokasi?.pos.find((p) => p.tipe_pos === 'investasi');
  const posKeinginan = alokasi?.pos.find((p) => p.tipe_pos === 'keinginan');

  const totalNominalAlokasi =
    (posKebutuhan?.target_nominal || 0) +
    (posInvestasi?.target_nominal || 0) +
    (posKeinginan?.target_nominal || 0);

  const selisihKas = totalPendapatan - totalNominalAlokasi;
  const totalPersenAlokasi =
    (posKebutuhan?.target_persen || 0) +
    (posInvestasi?.target_persen || 0) +
    (posKeinginan?.target_persen || 0);

  // Kalkulasi Financial Freedom (FIRE Tracker)
  const biayaHidupPokok = posKebutuhan?.target_nominal || 0;
  const biayaHidupTotal = biayaHidupPokok + (posKeinginan?.target_nominal || 0);

  const milestones = [
    {
      level: 1,
      nama: 'Level 1: Dana Darurat Mini (1 Bulan)',
      pengali: 1,
      target_nominal: biayaHidupPokok * 1,
      deskripsi: 'Jaring pengaman cepat jika gajian harian telat beberapa hari atau ada servis motor mendadak.',
      ikon: 'shield-outline',
      warna: '#0284C7',
    },
    {
      level: 2,
      nama: 'Level 2: Dana Darurat Aman (6 Bulan)',
      pengali: 6,
      target_nominal: biayaHidupPokok * 6,
      deskripsi: 'Target utama Excel acuanmu! Menjamin ketahanan hidup 6 bulan jika kontrak selesai atau masa transisi karir.',
      ikon: 'shield-checkmark',
      warna: '#10B981',
    },
    {
      level: 3,
      nama: 'Level 3: Bantalan Bebas Cemas (12 Bulan)',
      pengali: 12,
      target_nominal: biayaHidupPokok * 12,
      deskripsi: 'Biaya hidup aman selama 1 tahun penuh. Mental sangat tenang dan kamu punya kebebasan menentukan arah karir.',
      ikon: 'leaf-outline',
      warna: '#8B5CF6',
    },
    {
      level: 4,
      nama: 'Level 4: Lean FIRE (Pensiun Pokok)',
      pengali: 300,
      target_nominal: biayaHidupPokok * 300,
      deskripsi: 'Modal investasi yang hasil imbal bunganya (4% per tahun) sudah menutup biaya makan & kos selamanya.',
      ikon: 'flame-outline',
      warna: '#F59E0B',
    },
    {
      level: 5,
      nama: 'Level 5: Full Traditional FIRE',
      pengali: 300,
      target_nominal: biayaHidupTotal * 300,
      deskripsi: 'Formula klasik pensiun mandiri 300x. Menutup seluruh kebutuhan pokok PLUS jajan & liburan selamanya.',
      ikon: 'trophy-outline',
      warna: '#EC4899',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onTutup}>
      <SafeAreaView style={styles.safeArea}>
        {/* 1. HEADER MODAL */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onTutup} style={styles.btnKembali} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Alokasi Gaji & FIRE</Text>
            <Text style={styles.headerSub}>Rencana anggaran bulanan & target pensiun</Text>
          </View>
          <TouchableOpacity onPress={handleSimpan} style={styles.btnSimpanHeader} activeOpacity={0.7}>
            <Ionicons name="checkmark" size={18} color={Colors.textInverse} />
            <Text style={styles.btnSimpanHeaderText}>Simpan</Text>
          </TouchableOpacity>
        </View>

        {/* 2. BAR NAVIGASI BULAN & SALIN TEMPLATE */}
        <View style={styles.periodeBar}>
          <View style={styles.periodeNavRow}>
            <TouchableOpacity
              onPress={() => handleGantiBulan(-1)}
              style={[styles.btnPanah, isBulanTerawal && { opacity: 0.3 }]}
              disabled={isBulanTerawal}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.periodeBadge}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.periodeText}>{formatPeriodeBulan(periode)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleGantiBulan(1)}
              style={[styles.btnPanah, isBulanSekarang && { opacity: 0.3 }]}
              disabled={isBulanSekarang}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSalinBulanLalu} style={styles.btnSalinBulan} activeOpacity={0.7}>
            <Ionicons name="copy-outline" size={14} color="#047857" style={{ marginRight: 4 }} />
            <Text style={styles.btnSalinBulanText}>Salin Bulan Lalu</Text>
          </TouchableOpacity>
        </View>

        {/* 3. SWITCHER TAB: ALOKASI vs FIRE */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, tabAktif === 'alokasi' && styles.tabButtonActive]}
            onPress={() => setTabAktif('alokasi')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pie-chart-outline"
              size={17}
              color={tabAktif === 'alokasi' ? Colors.primary : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, tabAktif === 'alokasi' && styles.tabButtonTextActive]}>
              Alokasi Anggaran
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, tabAktif === 'fire' && styles.tabButtonActive]}
            onPress={() => setTabAktif('fire')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trending-up-outline"
              size={17}
              color={tabAktif === 'fire' ? Colors.primary : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, tabAktif === 'fire' && styles.tabButtonTextActive]}>
              Tangga FIRE (Pensiun)
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat rencana alokasi...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {tabAktif === 'alokasi' ? (
              <>
                {/* 1. KARTU TOTAL SUMBER PENDAPATAN */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cardTitle}>Sumber Pendapatan Bulanan</Text>
                      <Text style={styles.cardSubtitle}>Daftar gaji harian, sangu, sampingan, dll.</Text>
                    </View>
                    <View style={styles.badgeTotalIncome}>
                      <Text style={styles.badgeTotalIncomeText}>{formatRupiah(totalPendapatan)}</Text>
                    </View>
                  </View>

                  {/* List Pendapatan */}
                  {(alokasi?.pendapatan || []).map((item, idx) => (
                    <View key={idx} style={styles.incomeRow}>
                      <TextInput
                        style={styles.inputIncomeName}
                        value={item.nama_sumber}
                        placeholder="Nama sumber..."
                        placeholderTextColor={Colors.textMuted}
                        onChangeText={(txt) => handleUbahPendapatan(idx, 'nama_sumber', txt)}
                      />
                      <View style={styles.inputIncomeNominalWrapper}>
                        <Text style={styles.prefixRp}>Rp</Text>
                        <TextInput
                          style={styles.inputIncomeNominal}
                          keyboardType="numeric"
                          value={item.nominal > 0 ? String(item.nominal) : ''}
                          placeholder="0"
                          placeholderTextColor={Colors.textMuted}
                          onChangeText={(txt) => handleUbahPendapatan(idx, 'nominal', txt)}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => handleHapusPendapatan(idx)}
                        style={styles.btnHapusRow}
                      >
                        <Ionicons name="trash-outline" size={17} color={Colors.kredit} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleTambahPendapatan}
                    style={styles.btnTambahSumber}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.btnTambahSumberText}>Tambah Sumber Pendapatan</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. CHIP PRESET PROPORSI CEPAT */}
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Pilihan Preset Proporsi Anggaran:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                    <TouchableOpacity
                      style={styles.presetChip}
                      onPress={() => handleTerapkanPreset(70, 20, 10)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipTitle}>70 / 20 / 10</Text>
                      <Text style={styles.presetChipSub}>Anak Kos / Freshgrad</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.presetChip}
                      onPress={() => handleTerapkanPreset(80, 20, 0)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipTitle}>80 / 20</Text>
                      <Text style={styles.presetChipSub}>Pay Yourself First</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.presetChip}
                      onPress={() => handleTerapkanPreset(60, 20, 20)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipTitle}>60 / 20 / 20</Text>
                      <Text style={styles.presetChipSub}>Transisi Naik Gaji</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.presetChip}
                      onPress={() => handleTerapkanPreset(50, 30, 20)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipTitle}>50 / 30 / 20</Text>
                      <Text style={styles.presetChipSub}>Standar Klasik</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* 3. TIGA KARTU POS ANGGARAN (TWO-WAY BINDING) */}
                {/* POS 1: KEBUTUHAN POKOK */}
                {renderCardPos(
                  'kebutuhan',
                  'Kebutuhan Pokok',
                  'Makan harian, bayar kos, bensin, kuota & sabun',
                  'home-outline',
                  '#2563EB',
                  '#EFF6FF',
                  posKebutuhan,
                  handleUbahNominalPos,
                  handleUbahPersenPos,
                  handleUbahSubpos,
                  handleTambahSubpos,
                  handleHapusSubpos
                )}

                {/* POS 2: INVESTASI & TABUNGAN */}
                {renderCardPos(
                  'investasi',
                  'Investasi & Tabungan Dingin',
                  'RDPU tabungan, dana darurat, persiapan hobi/device',
                  'trending-up-outline',
                  '#059669',
                  '#ECFDF5',
                  posInvestasi,
                  handleUbahNominalPos,
                  handleUbahPersenPos,
                  handleUbahSubpos,
                  handleTambahSubpos,
                  handleHapusSubpos
                )}

                {/* POS 3: KEINGINAN & LIFESTYLE */}
                {renderCardPos(
                  'keinginan',
                  'Keinginan & Hiburan',
                  'Jajan akhir pekan, nongkrong ngopi, hobi santai',
                  'cafe-outline',
                  '#D97706',
                  '#FFFBEB',
                  posKeinginan,
                  handleUbahNominalPos,
                  handleUbahPersenPos,
                  handleUbahSubpos,
                  handleTambahSubpos,
                  handleHapusSubpos
                )}

                {/* 4. EVALUASI RINGKASAN CASHFLOW & STATUS ANGGARAN */}
                <View style={styles.cardEvaluasi}>
                  <Text style={styles.evaluasiTitle}>Evaluasi Alokasi Bulan Ini</Text>
                  
                  <View style={styles.evaluasiRow}>
                    <Text style={styles.evaluasiLabel}>Total Pendapatan:</Text>
                    <Text style={styles.evaluasiVal}>{formatRupiah(totalPendapatan)}</Text>
                  </View>
                  <View style={styles.evaluasiRow}>
                    <Text style={styles.evaluasiLabel}>Total Dialokasikan:</Text>
                    <Text style={styles.evaluasiVal}>{formatRupiah(totalNominalAlokasi)} ({totalPersenAlokasi.toFixed(1)}%)</Text>
                  </View>

                  <View style={styles.evaluasiDivider} />

                  <View style={styles.evaluasiRow}>
                    <Text style={styles.evaluasiLabelBold}>
                      {selisihKas >= 0 ? 'Sisa Surplus (Belum Teralokasi):' : 'Defisit Anggaran:'}
                    </Text>
                    <Text style={[styles.evaluasiValBold, { color: selisihKas >= 0 ? Colors.debit : Colors.kredit }]}>
                      {formatRupiah(selisihKas)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.evaluasiBadge,
                      {
                        backgroundColor:
                          selisihKas === 0
                            ? '#DCFCE7'
                            : selisihKas > 0
                            ? '#EFF6FF'
                            : '#FEE2E2',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        selisihKas === 0
                          ? 'checkmark-circle'
                          : selisihKas > 0
                          ? 'information-circle'
                          : 'alert-circle'
                      }
                      size={18}
                      color={
                        selisihKas === 0
                          ? '#15803D'
                          : selisihKas > 0
                          ? '#1D4ED8'
                          : '#B91C1C'
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.evaluasiBadgeText,
                        {
                          color:
                            selisihKas === 0
                              ? '#15803D'
                              : selisihKas > 0
                              ? '#1D4ED8'
                              : '#B91C1C',
                        },
                      ]}
                    >
                      {selisihKas === 0
                        ? 'Sempurna! Seluruh rupiah teralokasi pas 100% (Zero-Based).'
                        : selisihKas > 0
                        ? `Masih ada ${formatRupiah(selisihKas)} sisa uang dingin. Bisa dimasukkan ke pos tabungan.`
                        : `Alokasi melebihi pendapatan sebesar ${formatRupiah(Math.abs(selisihKas))}. Harap kurangi salah satu pos!`}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              /* TAB FIRE (FINANCIAL FREEDOM TRACKER) */
              <View>
                {/* Kartu Dasar Acuan Biaya Hidup */}
                <View style={styles.fireHeaderCard}>
                  <View style={styles.fireHeaderTop}>
                    <Ionicons name="flame" size={26} color="#EA580C" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.fireHeaderTitle}>Target Financial Freedom (FIRE)</Text>
                      <Text style={styles.fireHeaderSubtitle}>
                        Dihitung dari rencana biaya hidup di bulan {formatPeriodeBulan(periode)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fireBasisRow}>
                    <View style={styles.fireBasisCol}>
                      <Text style={styles.fireBasisLabel}>Biaya Pokok (Kebutuhan)</Text>
                      <Text style={styles.fireBasisVal}>{formatRupiah(biayaHidupPokok)}/bln</Text>
                    </View>
                    <View style={styles.fireBasisDivider} />
                    <View style={styles.fireBasisCol}>
                      <Text style={styles.fireBasisLabel}>Total Hidup (+ Jajan)</Text>
                      <Text style={styles.fireBasisVal}>{formatRupiah(biayaHidupTotal)}/bln</Text>
                    </View>
                  </View>
                </View>

                {/* List Tangga Milestone Level 1 s.d. Level 5 */}
                <Text style={styles.sectionTitle}>Tangga Kebebasan Finansial Karjimut:</Text>

                {milestones.map((m) => (
                  <View key={m.level} style={styles.milestoneCard}>
                    <View style={styles.milestoneTop}>
                      <View style={[styles.milestoneIconBg, { backgroundColor: m.warna + '20' }]}>
                        <Ionicons name={m.ikon as any} size={22} color={m.warna} />
                      </View>
                      <View style={styles.milestoneInfoCol}>
                        <Text style={styles.milestoneTitle}>{m.nama}</Text>
                        <Text style={styles.milestoneTarget}>
                          Target: <Text style={{ color: m.warna, fontWeight: '700' }}>{formatRupiah(m.target_nominal)}</Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.milestoneDesc}>{m.deskripsi}</Text>
                  </View>
                ))}

                {/* Tips Karjimut */}
                <View style={styles.tipsCard}>
                  <Ionicons name="bulb-outline" size={20} color="#B45309" style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.tipsText}>
                    <Text style={{ fontWeight: '700' }}>Tips Karjimut:</Text> Jangan terintimidasi dengan angka ratusan juta di Level 4 & 5. Fokuslah menuntaskan <Text style={{ fontWeight: '700' }}>Level 1 (Dana Darurat 1 Bulan)</Text> dan <Text style={{ fontWeight: '700' }}>Level 2 (Dana Darurat 6 Bulan)</Text> terlebih dahulu. Menyisihkan Rp 500rb/bulan secara konsisten jauh lebih berharga daripada menabung Rp 1 juta tapi ditarik lagi di akhir bulan!
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// Helper Render Kartu Pos
function renderCardPos(
  tipePos: TipePosAlokasi,
  judul: string,
  sub: string,
  ikon: string,
  warna: string,
  bgWarna: string,
  posData: AlokasiPos | undefined,
  onUbahNominal: (t: TipePosAlokasi, v: string) => void,
  onUbahPersen: (t: TipePosAlokasi, v: string) => void,
  onUbahSub: (t: TipePosAlokasi, idx: number, f: 'nama_subpos' | 'nominal', v: string) => void,
  onTambahSub: (t: TipePosAlokasi) => void,
  onHapusSub: (t: TipePosAlokasi, idx: number) => void
) {
  const nominal = posData?.target_nominal || 0;
  const persen = posData?.target_persen || 0;
  const subposList = posData?.subpos || [];

  return (
    <View style={styles.card}>
      {/* Header Pos */}
      <View style={styles.cardPosHeader}>
        <View style={[styles.posIconBg, { backgroundColor: bgWarna }]}>
          <Ionicons name={ikon as any} size={20} color={warna} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.cardPosTitle}>{judul}</Text>
          <Text style={styles.cardPosSub}>{sub}</Text>
        </View>
      </View>

      {/* Input Dua Arah (Nominal ↔ Persen) */}
      <View style={styles.twoWayInputRow}>
        {/* Input Nominal */}
        <View style={styles.twoWayInputColNominal}>
          <Text style={styles.twoWayLabel}>Nominal Target (Rp)</Text>
          <View style={styles.twoWayBox}>
            <Text style={styles.prefixRp}>Rp</Text>
            <TextInput
              style={styles.twoWayTextInput}
              keyboardType="numeric"
              value={nominal > 0 ? String(nominal) : ''}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              onChangeText={(txt) => onUbahNominal(tipePos, txt)}
            />
          </View>
        </View>

        {/* Input Persentase */}
        <View style={styles.twoWayInputColPersen}>
          <Text style={styles.twoWayLabel}>Porsi (%)</Text>
          <View style={styles.twoWayBox}>
            <TextInput
              style={[styles.twoWayTextInput, { textAlign: 'center' }]}
              keyboardType="numeric"
              value={persen > 0 ? String(persen) : ''}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              onChangeText={(txt) => onUbahPersen(tipePos, txt)}
            />
            <Text style={styles.suffixPersen}>%</Text>
          </View>
        </View>
      </View>

      {/* Rincian Subpos */}
      <View style={styles.subposContainer}>
        <Text style={styles.subposHeaderTitle}>Rincian Pos Ini ({subposList.length} item):</Text>

        {subposList.map((sp, idx) => (
          <View key={idx} style={styles.subposRow}>
            <TextInput
              style={styles.inputSubposName}
              value={sp.nama_subpos}
              placeholder="Nama pengeluaran..."
              placeholderTextColor={Colors.textMuted}
              onChangeText={(txt) => onUbahSub(tipePos, idx, 'nama_subpos', txt)}
            />
            <View style={styles.inputSubposNominalWrapper}>
              <Text style={styles.prefixRpSmall}>Rp</Text>
              <TextInput
                style={styles.inputSubposNominal}
                keyboardType="numeric"
                value={sp.nominal > 0 ? String(sp.nominal) : ''}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                onChangeText={(txt) => onUbahSub(tipePos, idx, 'nominal', txt)}
              />
            </View>
            <TouchableOpacity onPress={() => onHapusSub(tipePos, idx)} style={styles.btnHapusSubpos}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity onPress={() => onTambahSub(tipePos)} style={styles.btnTambahSubpos} activeOpacity={0.7}>
          <Ionicons name="add" size={15} color={warna} style={{ marginRight: 4 }} />
          <Text style={[styles.btnTambahSubposText, { color: warna }]}>Tambah Rincian</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  btnKembali: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  btnSimpanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnSimpanHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textInverse,
    marginLeft: 4,
  },
  periodeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  periodeNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnPanah: {
    padding: 6,
  },
  periodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  periodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnSalinBulan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  btnSalinBulanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeTotalIncome: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeTotalIncomeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIncomeName: {
    flex: 1.4,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: Colors.textPrimary,
    marginRight: 6,
  },
  inputIncomeNominalWrapper: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  prefixRp: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  inputIncomeNominal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: 7,
  },
  btnHapusRow: {
    padding: 6,
  },
  btnTambahSumber: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    marginTop: 4,
  },
  btnTambahSumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  presetSection: {
    marginBottom: 14,
  },
  presetSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  presetChipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetChipSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardPosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  posIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPosTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardPosSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  twoWayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  twoWayInputColNominal: {
    flex: 1.5,
    marginRight: 10,
  },
  twoWayInputColPersen: {
    flex: 0.9,
  },
  twoWayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  twoWayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  twoWayTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: 7,
  },
  suffixPersen: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  subposContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  subposHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  subposRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputSubposName: {
    flex: 1.4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    color: Colors.textPrimary,
    marginRight: 6,
  },
  inputSubposNominalWrapper: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    marginRight: 4,
  },
  prefixRpSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 2,
  },
  inputSubposNominal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: 5,
  },
  btnHapusSubpos: {
    padding: 4,
  },
  btnTambahSubpos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  btnTambahSubposText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardEvaluasi: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  evaluasiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  evaluasiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  evaluasiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  evaluasiVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  evaluasiDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  evaluasiLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  evaluasiValBold: {
    fontSize: 15,
    fontWeight: '800',
  },
  evaluasiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  evaluasiBadgeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  fireHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  fireHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fireHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fireHeaderSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  fireBasisRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  fireBasisCol: {
    flex: 1,
    alignItems: 'center',
  },
  fireBasisDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  fireBasisLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  fireBasisVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  milestoneCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  milestoneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  milestoneInfoCol: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  milestoneTarget: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  milestoneDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});
