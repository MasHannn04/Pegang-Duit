import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TipeTransaksi, Transaksi, JenisKeuangan, Kategori } from '../types';
import { formatRupiah, parseAngka, getTanggalHariIni } from '../utils/format';
import { Colors } from '../theme/colors';
import { ambilSemuaKategori } from '../database/kategori';
import { ModalKelolaKategori } from '../components/ModalKelolaKategori';

interface Props {
  daftarJenis: JenisKeuangan[];
  jenisDipilihId?: number;
  transaksiEdit?: Transaksi | null;
  onSimpan: (transaksi: Transaksi) => void;
  onBatal: () => void;
  onHapus?: (id: number) => void;
}

const CHIPS_PRIBADI_KELUAR = ['Makan Siang', 'Jajan/Kopi', 'Bensin', 'Bayar Kos', 'Laundry', 'Belanja Harian', 'Pulsa/Paket Data', 'Darurat'];
const CHIPS_PRIBADI_MASUK = ['Gaji Pokok', 'Tunjangan', 'Bonus/Freelance', 'Kembalian', 'Uang Makan', 'Hasil Penjualan'];
const CHIPS_KAS = ['Pegangan Kas', 'Beli Perlengkapan', 'Operasional', 'Uang Kegiatan', 'Pengembalian Kas'];

export const CatatView: React.FC<Props> = ({
  daftarJenis,
  jenisDipilihId,
  transaksiEdit,
  onSimpan,
  onBatal,
  onHapus,
}) => {
  const [jenisId, setJenisId] = useState<number>(jenisDipilihId || (daftarJenis[0]?.id ?? 1));
  const [tipe, setTipe] = useState<TipeTransaksi>('kredit');
  const [nominalStr, setNominalStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(getTanggalHariIni());

  // State Kategori
  const [daftarKategori, setDaftarKategori] = useState<Kategori[]>([]);
  const [kategoriId, setKategoriId] = useState<number | null>(null);
  const [modalKelolaKategoriVisible, setModalKelolaKategoriVisible] = useState(false);

  const muatKategori = async (tipeTarget: TipeTransaksi, pilihId?: number | null) => {
    const list = await ambilSemuaKategori(tipeTarget);
    setDaftarKategori(list);
    if (pilihId !== undefined) {
      setKategoriId(pilihId);
    } else {
      setKategoriId((prev) => {
        const stillValid = list.some((k) => k.id === prev);
        return stillValid ? prev : (list[0]?.id ?? null);
      });
    }
  };

  useEffect(() => {
    if (transaksiEdit) {
      setJenisId(transaksiEdit.jenis_keuangan_id);
      setTipe(transaksiEdit.tipe);
      setNominalStr(String(transaksiEdit.nominal));
      setKeterangan(transaksiEdit.keterangan);
      setTanggal(transaksiEdit.tanggal);
      muatKategori(transaksiEdit.tipe, transaksiEdit.kategori_id ?? null);
    } else {
      setJenisId(jenisDipilihId || (daftarJenis[0]?.id ?? 1));
      setTipe('kredit');
      setNominalStr('');
      setKeterangan('');
      setTanggal(getTanggalHariIni());
      muatKategori('kredit', null);
    }
  }, [transaksiEdit, jenisDipilihId, daftarJenis]);

  const handleSimpan = () => {
    const nominal = parseAngka(nominalStr);
    if (!nominal || nominal <= 0) return;
    if (!keterangan.trim()) return;

    onSimpan({
      id: transaksiEdit?.id,
      jenis_keuangan_id: jenisId,
      kategori_id: kategoriId,
      tanggal: tanggal.trim() || getTanggalHariIni(),
      keterangan: keterangan.trim(),
      tipe: tipe,
      nominal: nominal,
    });
  };

  const tambahNominalInstan = (tambah: number) => {
    const saatIni = parseAngka(nominalStr || '0');
    setNominalStr(String(saatIni + tambah));
  };

  const jenisAktifObj = daftarJenis.find((j) => j.id === jenisId);
  const isKas = jenisAktifObj?.kode === 'kas';
  const chipsKeterangan = isKas
    ? CHIPS_KAS
    : tipe === 'debit'
    ? CHIPS_PRIBADI_MASUK
    : CHIPS_PRIBADI_KELUAR;

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Halaman */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {transaksiEdit ? 'Ubah Catatan Transaksi' : 'Catat Transaksi Baru'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {transaksiEdit
                ? 'Perbarui rincian mutasi transaksi yang dipilih'
                : 'Catat pemasukan atau pengeluaran ke buku keuangan'}
            </Text>
          </View>

          {transaksiEdit && (
            <TouchableOpacity
              style={styles.btnKembaliText}
              onPress={onBatal}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary }}>
                Batal
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. Pilih Buku Keuangan */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>Buku Keuangan Tujuan</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
          >
            {daftarJenis.map((j) => {
              const isSelected = j.id === jenisId;
              return (
                <TouchableOpacity
                  key={j.id}
                  style={[
                    styles.bookChip,
                    isSelected && {
                      backgroundColor: j.warna || Colors.primary,
                      borderColor: j.warna || Colors.primary,
                    },
                  ]}
                  onPress={() => setJenisId(j.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(j.ikon as any) || 'wallet'}
                    size={16}
                    color={isSelected ? Colors.textInverse : Colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.bookChipText,
                      isSelected && styles.bookChipTextSelected,
                    ]}
                  >
                    {j.nama}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Toggle Tipe Transaksi (Pengeluaran vs Pemasukan) */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>Jenis Arus Kas</Text>
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                tipe === 'kredit' && styles.typeButtonKreditActive,
              ]}
              onPress={() => {
                setTipe('kredit');
                muatKategori('kredit');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={tipe === 'kredit' ? Colors.textInverse : Colors.kredit}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  tipe === 'kredit' && styles.typeButtonTextActive,
                ]}
              >
                Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                tipe === 'debit' && styles.typeButtonDebitActive,
              ]}
              onPress={() => {
                setTipe('debit');
                muatKategori('debit');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={tipe === 'debit' ? Colors.textInverse : Colors.debit}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  tipe === 'debit' && styles.typeButtonTextActive,
                ]}
              >
                Pemasukan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Kategori Transaksi */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>
              Kategori {tipe === 'kredit' ? 'Pengeluaran' : 'Pemasukan'}
            </Text>
            <TouchableOpacity
              onPress={() => setModalKelolaKategoriVisible(true)}
              style={styles.btnKelolaShortcut}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.btnKelolaShortcutText}>Atur Kategori</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={{ paddingVertical: 2 }}
          >
            {daftarKategori.map((k) => {
              const isSelected = k.id === kategoriId;
              return (
                <TouchableOpacity
                  key={k.id}
                  style={[
                    styles.categoryChip,
                    isSelected && {
                      backgroundColor: k.warna || Colors.primary,
                      borderColor: k.warna || Colors.primary,
                    },
                  ]}
                  onPress={() => setKategoriId(k.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(k.ikon as any) || 'pricetag'}
                    size={15}
                    color={isSelected ? Colors.textInverse : (k.warna || Colors.textSecondary)}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {k.nama}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.categoryChipTambah}
              onPress={() => setModalKelolaKategoriVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={Colors.primary} style={{ marginRight: 3 }} />
              <Text style={styles.categoryChipTambahText}>Tambah</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3. Input Nominal Besar */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>Nominal Uang</Text>
          <View style={styles.nominalInputBox}>
            <Text style={styles.nominalPrefix}>Rp</Text>
            <TextInput
              style={styles.nominalTextInput}
              value={nominalStr}
              onChangeText={(text) => setNominalStr(text.replace(/[^0-9]/g, ''))}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {nominalStr !== '' && (
            <Text style={styles.nominalTerbilang}>
              {formatRupiah(parseAngka(nominalStr))}
            </Text>
          )}

          {/* Quick Nominal Chips */}
          <View style={styles.quickNominalRow}>
            {[10000, 20000, 50000, 100000, 500000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickNominalChip}
                onPress={() => tambahNominalInstan(amt)}
                activeOpacity={0.6}
              >
                <Text style={styles.quickNominalText}>+{amt / 1000}rb</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Keterangan / Deskripsi */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>Keterangan / Keperluan</Text>
          <TextInput
            style={styles.textInputBox}
            value={keterangan}
            onChangeText={setKeterangan}
            placeholder="Contoh: Makan siang, bayar kos, bensin..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* Pilihan Cepat Keterangan */}
          <Text style={[styles.sectionLabel, { marginTop: 12, marginBottom: 8 }]}>
            Pilihan Cepat:
          </Text>
          <View style={styles.chipsWrapContainer}>
            {chipsKeterangan.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={styles.recomChip}
                onPress={() => setKeterangan(chip)}
                activeOpacity={0.6}
              >
                <Text style={styles.recomChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Tanggal Transaksi */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>Tanggal (YYYY-MM-DD)</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.textInputBox, { flex: 1, marginBottom: 0 }]}
              value={tanggal}
              onChangeText={setTanggal}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => setTanggal(getTanggalHariIni())}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>Hari Ini</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tombol Aksi Simpan */}
        <TouchableOpacity
          style={[
            styles.btnSimpanUtama,
            (!nominalStr || !keterangan.trim()) && styles.btnSimpanDisabled,
          ]}
          onPress={handleSimpan}
          disabled={!nominalStr || !keterangan.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} style={{ marginRight: 8 }} />
          <Text style={styles.btnSimpanUtamaText}>
            {transaksiEdit ? 'Simpan Perubahan' : 'Catat Transaksi Sekarang'}
          </Text>
        </TouchableOpacity>

        {transaksiEdit && onHapus && (
          <TouchableOpacity
            style={styles.btnHapusTransaksi}
            onPress={() => {
              if (transaksiEdit.id) {
                onHapus(transaksiEdit.id);
                onBatal();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.kredit} style={{ marginRight: 6 }} />
            <Text style={styles.btnHapusTransaksiText}>Hapus Transaksi Ini</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>

      {/* MODAL KELOLA KATEGORI */}
      <ModalKelolaKategori
        visible={modalKelolaKategoriVisible}
        onTutup={() => {
          setModalKelolaKategoriVisible(false);
          muatKategori(tipe);
        }}
        onDataBerubah={() => muatKategori(tipe)}
        tipeAwal={tipe}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  btnKembaliText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  cardSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnKelolaShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  btnKelolaShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: Colors.textInverse,
  },
  categoryChipTambah: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  categoryChipTambahText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  bookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  bookChipTextSelected: {
    color: Colors.textInverse,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  typeButtonKreditActive: {
    backgroundColor: Colors.kredit,
  },
  typeButtonDebitActive: {
    backgroundColor: Colors.debit,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.textInverse,
  },
  nominalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  nominalPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  nominalTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  nominalTerbilang: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
    marginLeft: 4,
  },
  quickNominalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  quickNominalChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickNominalText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  chipsWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recomChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recomChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnSimpanUtama: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSimpanDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnSimpanUtamaText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  btnHapusTransaksi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  btnHapusTransaksiText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.kredit,
  },
});
