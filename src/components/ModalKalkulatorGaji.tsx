import React, { useState } from 'react';
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
import { formatRupiah, parseAngka } from '../utils/format';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onTutup: () => void;
  onGunakanSebagaiPemasukan: (nominalGaji: number, keterangan: string) => void;
}

export const ModalKalkulatorGaji: React.FC<Props> = ({
  visible,
  onTutup,
  onGunakanSebagaiPemasukan,
}) => {
  const [totalGajiStr, setTotalGajiStr] = useState('3125000');
  const [hariKerjaStr, setHariKerjaStr] = useState('25');
  const [rateStandarStr, setRateStandarStr] = useState('125000');

  const totalGaji = parseAngka(totalGajiStr);
  const hariKerja = parseAngka(hariKerjaStr);
  const rateStandar = parseAngka(rateStandarStr);

  const payPerDay = hariKerja > 0 ? Math.round(totalGaji / hariKerja) : 0;
  const selisihTotal = (payPerDay - rateStandar) * hariKerja;
  const isPas = selisihTotal === 0 && payPerDay === rateStandar;

  const handleCatatGaji = () => {
    onGunakanSebagaiPemasukan(totalGaji, `Gaji (${hariKerja} hari kerja @ ${formatRupiah(payPerDay)})`);
    onTutup();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onTutup}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Kalkulator Verifikasi Gaji</Text>
              <Text style={styles.headerSubtitle}>
                Cek apakah gaji harian bulanan sudah sesuai tarif
              </Text>
            </View>
            <TouchableOpacity onPress={onTutup} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Input Total Gaji */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gaji Diterima (Rp)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={totalGajiStr}
                placeholder="misal: 3125000"
                placeholderTextColor={Colors.textMuted}
                onChangeText={(txt) => setTotalGajiStr(txt.replace(/[^\d]/g, ''))}
              />
              <Text style={styles.helperText}>{formatRupiah(totalGaji)}</Text>
            </View>

            {/* Input Hari Kerja & Rate Standar */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Hari Kerja</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={hariKerjaStr}
                  placeholder="25"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={(txt) => setHariKerjaStr(txt.replace(/[^\d]/g, ''))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>Tarif/Hari Standar</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={rateStandarStr}
                  placeholder="125000"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={(txt) => setRateStandarStr(txt.replace(/[^\d]/g, ''))}
                />
              </View>
            </View>

            {/* Kotak Hasil Analisis Gaji (Formula Excel G6:H7) */}
            <View style={styles.hasilBox}>
              <View style={styles.hasilRow}>
                <Text style={styles.hasilLabel}>Tarif Didapat (Pay / Day):</Text>
                <Text style={styles.hasilValue}>{formatRupiah(payPerDay)} / hari</Text>
              </View>

              <View style={styles.hasilRow}>
                <Text style={styles.hasilLabel}>Sisa / Selisih:</Text>
                <Text
                  style={[
                    styles.hasilValue,
                    { color: isPas ? Colors.debit : selisihTotal > 0 ? Colors.debit : Colors.kredit },
                  ]}
                >
                  {formatRupiah(selisihTotal)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statusBox}>
                <Ionicons
                  name={isPas ? 'checkmark-circle' : 'information-circle'}
                  size={20}
                  color={isPas ? Colors.balance : Colors.warning}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.statusText}>
                  {isPas
                    ? 'Gaji PAS! Sesuai dengan tarif Rp ' + formatRupiah(rateStandar).replace('Rp ', '') + '/hari tanpa potongan.'
                    : selisihTotal > 0
                    ? `Ada kelebihan/bonus sebesar ${formatRupiah(selisihTotal)}.`
                    : `Ada pemotongan gaji sebesar ${formatRupiah(Math.abs(selisihTotal))}.`}
                </Text>
              </View>
            </View>

            {/* Tombol Catat ke Buku Transaksi */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCatatGaji}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color={Colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={styles.submitText}>Catat ke Pemasukan Pribadi</Text>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
    marginLeft: 2,
  },
  hasilBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hasilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hasilLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  hasilValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.debit,
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
