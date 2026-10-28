import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eksporLaporanBulanKeExcel } from '../utils/exportExcel';
import { eksporCadanganData, pulihkanCadanganData } from '../utils/backup';
import { formatPeriodeBulan } from '../utils/format';
import { tampilkanAlert } from '../utils/customAlert';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  periodeBulan: string;
  onTutup: () => void;
  onBukaKalkulatorGaji: () => void;
  onMuatDataSimulasi: () => Promise<void>;
  onDataBerubah: () => void;
}

export const ModalPengaturan: React.FC<Props> = ({
  visible,
  periodeBulan,
  onTutup,
  onBukaKalkulatorGaji,
  onMuatDataSimulasi,
  onDataBerubah,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleEksporExcel = async () => {
    try {
      setLoading(true);
      setLoadingText('Menyiapkan file Excel...');
      await eksporLaporanBulanKeExcel(periodeBulan);
    } catch (error: any) {
      tampilkanAlert('Gagal Ekspor', error.message || 'Terjadi kesalahan saat membuat Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      setLoadingText('Membuat cadangan data...');
      await eksporCadanganData();
    } catch (error: any) {
      tampilkanAlert('Gagal Backup', error.message || 'Gagal menyimpan file cadangan');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    tampilkanAlert(
      'Konfirmasi Pulihkan Data',
      'Data yang ada saat ini akan ditimpa dengan data dari file cadangan. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Pilih File Cadangan',
          onPress: async () => {
            try {
              setLoading(true);
              setLoadingText('Memulihkan database...');
              const hasil = await pulihkanCadanganData();
              if (hasil.sukses) {
                tampilkanAlert('Sukses', hasil.pesan);
                onDataBerubah();
                onTutup();
              } else {
                tampilkanAlert('Informasi', hasil.pesan);
              }
            } catch (error: any) {
              tampilkanAlert('Error', error.message || 'Gagal memulihkan data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSimulasi = async () => {
    tampilkanAlert(
      'Muat Data Contoh',
      'Aplikasi akan memuat transaksi contoh bulan Oktober (dari file Excel acuan) agar kamu bisa langsung mencoba seluruh fitur. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Muat Data',
          onPress: async () => {
            setLoading(true);
            setLoadingText('Mengisi data simulasi...');
            await onMuatDataSimulasi();
            setLoading(false);
            tampilkanAlert('Berhasil', 'Data contoh bulan Oktober telah dimuat!');
            onDataBerubah();
            onTutup();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Pengaturan & Alat</Text>
              <Text style={styles.headerSubtitle}>Ekspor Excel, Backup data, dan utilitas</Text>
            </View>
            <TouchableOpacity onPress={onTutup} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Grup 1: Ekspor Excel */}
              <Text style={styles.groupTitle}>Ekspor Dokumen</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEksporExcel}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="document-text" size={22} color="#15803D" />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuTitle}>Ekspor ke Excel (.xlsx)</Text>
                  <Text style={styles.menuSubtitle}>
                    Buat spreadsheet {formatPeriodeBulan(periodeBulan)} (Pribadi, Kas, & Penempatan)
                  </Text>
                </View>
                <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Grup 2: Cadangan & Pindah HP */}
              <Text style={styles.groupTitle}>Cadangan Data (Pindah HP Offline)</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleBackup}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="cloud-upload-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuTitle}>Simpan Cadangan (.json)</Text>
                  <Text style={styles.menuSubtitle}>
                    Simpan seluruh riwayat keuangan ke file untuk disimpan di HP / WA / Drive
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleRestore}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="cloud-download-outline" size={22} color="#D97706" />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuTitle}>Pulihkan Cadangan (Restore)</Text>
                  <Text style={styles.menuSubtitle}>
                    Pilih file cadangan .json saat ganti HP baru
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Grup 3: Fitur Pembantu */}
              <Text style={styles.groupTitle}>Fitur Tambahan</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onTutup();
                  onBukaKalkulatorGaji();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="calculator-outline" size={22} color="#9333EA" />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuTitle}>Kalkulator Verifikasi Gaji</Text>
                  <Text style={styles.menuSubtitle}>
                    Hitung rate Pay / Day dan verifikasi sisa/potongan gaji bulanan
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSimulasi}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="sparkles-outline" size={22} color="#4F46E5" />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuTitle}>Muat Data Contoh (Oktober)</Text>
                  <Text style={styles.menuSubtitle}>
                    Isi otomatis transaksi dari spreadsheet Contoh Sistem Keuangan.xlsx
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Info Aplikasi */}
              <View style={styles.appInfoBox}>
                <Text style={styles.appInfoTitle}>Pegang Duit v1.0.0</Text>
                <Text style={styles.appInfoSub}>100% Offline • SQLite Internal Storage</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
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
    paddingBottom: 30,
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
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextColumn: {
    flex: 1,
    paddingRight: 6,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  appInfoBox: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  appInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  appInfoSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
