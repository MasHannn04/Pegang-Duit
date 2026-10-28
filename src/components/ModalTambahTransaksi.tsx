import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TipeTransaksi, Transaksi, JenisKeuangan } from '../types';
import { formatRupiah, parseAngka, getTanggalHariIni } from '../utils/format';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  daftarJenis: JenisKeuangan[];
  jenisDipilihId: number;
  transaksiEdit?: Transaksi | null;
  onTutup: () => void;
  onSimpan: (transaksi: Transaksi) => void;
}

const CHIPS_PRIBADI_KELUAR = ['Makan', 'Jajan', 'Bensin', 'Bayar Kos', 'Laundry', 'Belanja', 'Spotify', 'Cuci Motor'];
const CHIPS_PRIBADI_MASUK = ['Gaji', 'Bonus', 'Kembalian', 'Jual Barang', 'Uang Makan'];
const CHIPS_KAS = ['Pegangan Kas', 'Beli Perlengkapan', 'Operasional', 'Uang Kegiatan', 'Pengembalian Kas'];

export const ModalTambahTransaksi: React.FC<Props> = ({
  visible,
  daftarJenis,
  jenisDipilihId,
  transaksiEdit,
  onTutup,
  onSimpan,
}) => {
  const [jenisId, setJenisId] = useState<number>(jenisDipilihId || 1);
  const [tipe, setTipe] = useState<TipeTransaksi>('kredit');
  const [nominalStr, setNominalStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(getTanggalHariIni());

  useEffect(() => {
    if (transaksiEdit) {
      setJenisId(transaksiEdit.jenis_keuangan_id);
      setTipe(transaksiEdit.tipe);
      setNominalStr(String(transaksiEdit.nominal));
      setKeterangan(transaksiEdit.keterangan);
      setTanggal(transaksiEdit.tanggal);
    } else {
      setJenisId(jenisDipilihId || (daftarJenis[0]?.id ?? 1));
      setTipe('kredit');
      setNominalStr('');
      setKeterangan('');
      setTanggal(getTanggalHariIni());
    }
  }, [transaksiEdit, visible, jenisDipilihId, daftarJenis]);

  const handleSimpan = () => {
    const nominal = parseAngka(nominalStr);
    if (!nominal || nominal <= 0) return;
    if (!keterangan.trim()) return;

    onSimpan({
      id: transaksiEdit?.id,
      jenis_keuangan_id: jenisId,
      tanggal: tanggal.trim() || getTanggalHariIni(),
      keterangan: keterangan.trim(),
      tipe: tipe,
      nominal: nominal,
    });

    onTutup();
  };

  const jenisAktifObj = daftarJenis.find((j) => j.id === jenisId);
  const isKas = jenisAktifObj?.kode === 'kas';
  const chips = isKas
    ? CHIPS_KAS
    : tipe === 'debit'
    ? CHIPS_PRIBADI_MASUK
    : CHIPS_PRIBADI_KELUAR;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onTutup}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {transaksiEdit ? 'Ubah Catatan' : 'Tambah Transaksi'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Catat mutasi keuangan ke buku yang dipilih
              </Text>
            </View>
            <TouchableOpacity onPress={onTutup} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. Pilih Jenis Keuangan */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pilih Buku Keuangan</Text>
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
                        styles.jenisChip,
                        isSelected && {
                          backgroundColor: j.warna || Colors.primary,
                          borderColor: j.warna || Colors.primary,
                        },
                      ]}
                      onPress={() => setJenisId(j.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={(j.ikon as any) || 'wallet'}
                        size={14}
                        color={isSelected ? Colors.textInverse : Colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.jenisChipText,
                          isSelected && styles.jenisChipTextActive,
                        ]}
                      >
                        {j.nama}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Tipe Selector: Pemasukan vs Pengeluaran */}
            <View style={styles.tipeSelector}>
              <TouchableOpacity
                style={[
                  styles.tipeButton,
                  tipe === 'kredit' && styles.tipeButtonKreditActive,
                ]}
                onPress={() => setTipe('kredit')}
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
                    styles.tipeText,
                    tipe === 'kredit' && styles.tipeTextActive,
                  ]}
                >
                  Pengeluaran
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipeButton,
                  tipe === 'debit' && styles.tipeButtonDebitActive,
                ]}
                onPress={() => setTipe('debit')}
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
                    styles.tipeText,
                    tipe === 'debit' && styles.tipeTextActive,
                  ]}
                >
                  Pemasukan
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Input Nominal */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nominal (Rp)</Text>
              <View style={styles.nominalInputContainer}>
                <Text style={styles.prefixRp}>Rp</Text>
                <TextInput
                  style={styles.nominalInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={nominalStr}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^\d]/g, '');
                    setNominalStr(clean);
                  }}
                  autoFocus={!transaksiEdit}
                />
              </View>
              {nominalStr.length > 0 && (
                <Text style={styles.previewRupiah}>
                  Terbaca: {formatRupiah(parseAngka(nominalStr))}
                </Text>
              )}
            </View>

            {/* 4. Input Keterangan */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Uraian Transaksi</Text>
              <TextInput
                style={styles.textInput}
                placeholder="misal: Makan Siang, Bensin, Gaji"
                placeholderTextColor={Colors.textMuted}
                value={keterangan}
                onChangeText={setKeterangan}
              />

              {/* Chips Rekomendasi Cepat */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
              >
                {chips.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.chip}
                    onPress={() => setKeterangan(chip)}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 5. Input Tanggal */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2025-10-15"
                placeholderTextColor={Colors.textMuted}
                value={tanggal}
                onChangeText={setTanggal}
              />
            </View>

            {/* Tombol Simpan */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                tipe === 'debit' ? styles.submitDebit : styles.submitKredit,
              ]}
              onPress={handleSimpan}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-sharp" size={20} color={Colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={styles.submitText}>
                {transaksiEdit ? 'Simpan Perubahan' : 'Catat Transaksi'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  jenisChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  jenisChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  jenisChipTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  tipeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tipeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  tipeButtonDebitActive: {
    backgroundColor: Colors.debit,
  },
  tipeButtonKreditActive: {
    backgroundColor: Colors.kredit,
  },
  tipeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tipeTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  nominalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prefixRp: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 6,
  },
  nominalInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  previewRupiah: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chip: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    marginTop: 8,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitDebit: {
    backgroundColor: Colors.debit,
  },
  submitKredit: {
    backgroundColor: Colors.kredit,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
