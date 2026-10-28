import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfilPengguna } from '../types';
import { getDatabase, resetDataKePenggunaBaru } from '../database/db';
import { ambilProfilPengguna, simpanProfilPengguna } from '../database/pengaturan';
import { eksporCadanganData, pulihkanCadanganData } from '../utils/backup';
import { tampilkanAlert } from '../utils/customAlert';
import { Colors } from '../theme/colors';

import { ModalKelolaKategori } from '../components/ModalKelolaKategori';
import { ModalAlokasiGaji } from '../components/ModalAlokasiGaji';

interface Props {
  onBukaKalkulatorGaji: () => void;
  onMuatDataSimulasi: () => Promise<void>;
  onDataBerubah: () => void;
}

const PILIHAN_WARNA = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
const PILIHAN_IKON = ['person', 'wallet', 'star', 'flame', 'trophy', 'heart', 'shield', 'cafe'];

export const AkunView: React.FC<Props> = ({
  onBukaKalkulatorGaji,
  onMuatDataSimulasi,
  onDataBerubah,
}) => {
  const [profil, setProfil] = useState<ProfilPengguna>({
    nama: 'Pengguna',
    motto: 'Catat uang tiap hari, hidup tenang & teratur.',
    avatar_ikon: 'person',
    avatar_warna: '#2563EB',
  });

  const [modalEditProfil, setModalEditProfil] = useState(false);
  const [modalKategoriVisible, setModalKategoriVisible] = useState(false);
  const [modalAlokasiVisible, setModalAlokasiVisible] = useState(false);
  const [formNama, setFormNama] = useState('');
  const [formMotto, setFormMotto] = useState('');
  const [formWarna, setFormWarna] = useState('#2563EB');
  const [formIkon, setFormIkon] = useState('person');

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    muatProfil();
  }, []);

  const muatProfil = async () => {
    const p = await ambilProfilPengguna();
    setProfil(p);
  };

  const bukaEditProfil = () => {
    setFormNama(profil.nama);
    setFormMotto(profil.motto);
    setFormWarna(profil.avatar_warna);
    setFormIkon(profil.avatar_ikon);
    setModalEditProfil(true);
  };

  const handleSimpanProfil = async () => {
    if (!formNama.trim()) {
      tampilkanAlert('Perhatian', 'Nama tidak boleh kosong.');
      return;
    }

    const dataBaru: ProfilPengguna = {
      nama: formNama.trim(),
      motto: formMotto.trim() || 'Catat uang tiap hari, hidup tenang & teratur.',
      avatar_ikon: formIkon,
      avatar_warna: formWarna,
    };

    await simpanProfilPengguna(dataBaru);
    setProfil(dataBaru);
    setModalEditProfil(false);
    tampilkanAlert('Sukses', 'Profil berhasil diperbarui!');
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      setLoadingText('Membuat cadangan data JSON...');
      await eksporCadanganData();
    } catch (error: any) {
      tampilkanAlert('Gagal Cadangkan', error.message || 'Gagal menyimpan file cadangan');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    tampilkanAlert(
      'Konfirmasi Pulihkan Data',
      'Data yang ada saat ini di HP akan ditimpa dengan data dari file cadangan .json. Lanjutkan?',
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
      'Aplikasi akan memuat transaksi contoh bulan Oktober (dari sistem Excel acuan). Lanjutkan?',
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
          },
        },
      ]
    );
  };

  const handleResetData = async () => {
    tampilkanAlert(
      'Kosongkan Seluruh Data?',
      'Semua transaksi dan riwayat audit akan dihapus, dan saldo dompet fisik akan diatur ke Rp 0 seperti aplikasi baru di-install.\n\nGunakan fitur ini untuk mulai mencatat dari awal atau sebelum menguji file cadangan (.json). Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kosongkan Sekarang',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setLoadingText('Mengosongkan database...');
              await resetDataKePenggunaBaru();
              setLoading(false);
              tampilkanAlert('Selesai', 'Data berhasil dikosongkan. Aplikasi sekarang bersih dan siap digunakan!');
              onDataBerubah();
            } catch (err: any) {
              setLoading(false);
              tampilkanAlert('Gagal', err.message || 'Gagal mengosongkan data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Halaman */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Akun & Pengaturan</Text>
        <Text style={styles.headerSubtitle}>
          Profil pribadi lokal, cadangan data, dan preferensi aplikasi
        </Text>
      </View>

      {/* 1. KARTU PROFIL PENGGUNA */}
      <View style={styles.profilCard}>
        <View style={styles.profilTopRow}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: profil.avatar_warna || Colors.primary },
            ]}
          >
            <Ionicons
              name={(profil.avatar_ikon as any) || 'person'}
              size={34}
              color={Colors.textInverse}
            />
          </View>

          <View style={styles.profilInfoCol}>
            <Text style={styles.profilNama} numberOfLines={1}>
              {profil.nama}
            </Text>
            <Text style={styles.profilMotto} numberOfLines={2}>
              "{profil.motto}"
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnEditProfil}
          onPress={bukaEditProfil}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.btnEditProfilText}>Ubah Profil & Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* 2. SECTION ALAT FINANSIAL */}
      <Text style={styles.sectionHeaderTitle}>Alat & Fitur Tambahan</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setModalKategoriVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="pricetags-outline" size={20} color="#7E22CE" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Kelola Kategori Transaksi</Text>
            <Text style={styles.menuSub}>Atur pos pengeluaran & sumber pemasukan</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onBukaKalkulatorGaji}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calculator-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Kalkulator Gaji Bersih</Text>
            <Text style={styles.menuSub}>Hitung gaji kotor, potongan, dan masukkan ke kas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setModalAlokasiVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="pie-chart-outline" size={20} color="#0284C7" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Alokasi Gaji & Target FIRE</Text>
            <Text style={styles.menuSub}>Simulasi pos anggaran (70/20/10, 50/30/20) & tangga pensiun</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 3. SECTION CADANGAN & PEMULIHAN */}
      <Text style={styles.sectionHeaderTitle}>Cadangan & Keamanan Data</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleBackup}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color="#15803D" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Cadangkan Data (.json)</Text>
            <Text style={styles.menuSub}>Simpan seluruh transaksi & akun ke file lokal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleRestore}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cloud-download-outline" size={20} color="#B45309" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Pulihkan Data (.json)</Text>
            <Text style={styles.menuSub}>Kembalikan data dari file cadangan sebelumnya</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 4. SECTION DATA SIMULASI & EKSPERIMEN */}
      <Text style={styles.sectionHeaderTitle}>Kelola & Eksperimen Data</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSimulasi}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="refresh-circle-outline" size={22} color="#7E22CE" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Muat Data Contoh (Oktober)</Text>
            <Text style={styles.menuSub}>Isi transaksi simulasi sesuai file Excel acuan</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleResetData}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Kosongkan Seluruh Data</Text>
            <Text style={styles.menuSub}>Hapus semua transaksi & setel saldo ke Rp 0 (Pengguna Baru)</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* 5. TENTANG APLIKASI */}
      <View style={styles.appInfoCard}>
        <View style={styles.appInfoTop}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet" size={18} color={Colors.textInverse} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.appInfoName}>Pegang Duit</Text>
            <Text style={styles.appInfoVersion}>Versi 1.0.0 • 100% Offline</Text>
          </View>
        </View>
        <Text style={styles.appInfoDesc}>
          Aplikasi pembukuan keuangan pribadi dan kas harian offline tanpa koneksi cloud. Seluruh data disimpan langsung dan aman di penyimpanan lokal HP kamu.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingOverlayText}>{loadingText}</Text>
        </View>
      )}

      {/* MODAL UBAH PROFIL */}
      <Modal
        visible={modalEditProfil}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEditProfil(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Profil Pengguna</Text>
              <TouchableOpacity onPress={() => setModalEditProfil(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Preview Avatar */}
              <View style={styles.avatarPreviewCenter}>
                <View
                  style={[
                    styles.avatarBigPreview,
                    { backgroundColor: formWarna },
                  ]}
                >
                  <Ionicons
                    name={(formIkon as any) || 'person'}
                    size={42}
                    color={Colors.textInverse}
                  />
                </View>
              </View>

              {/* Pilihan Warna */}
              <Text style={styles.fieldLabel}>Pilih Warna Avatar:</Text>
              <View style={styles.colorRow}>
                {PILIHAN_WARNA.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.colorDot,
                      { backgroundColor: w },
                      formWarna === w && styles.colorDotSelected,
                    ]}
                    onPress={() => setFormWarna(w)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              {/* Pilihan Ikon */}
              <Text style={styles.fieldLabel}>Pilih Ikon Avatar:</Text>
              <View style={styles.iconRow}>
                {PILIHAN_IKON.map((ik) => (
                  <TouchableOpacity
                    key={ik}
                    style={[
                      styles.iconPickItem,
                      formIkon === ik && styles.iconPickItemSelected,
                    ]}
                    onPress={() => setFormIkon(ik)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={ik as any}
                      size={20}
                      color={formIkon === ik ? Colors.primary : Colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input Nama */}
              <Text style={styles.fieldLabel}>Nama Lengkap / Panggilan:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan namamu..."
                value={formNama}
                onChangeText={setFormNama}
              />

              {/* Input Motto */}
              <Text style={styles.fieldLabel}>Motto / Catatan Finansial:</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Contoh: Hemat pangkal kaya, catat tiap hari..."
                value={formMotto}
                onChangeText={setFormMotto}
                multiline
              />

              <TouchableOpacity
                style={styles.btnSimpanProfil}
                onPress={handleSimpanProfil}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSimpanProfilText}>Simpan Profil</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL KELOLA KATEGORI */}
      <ModalKelolaKategori
        visible={modalKategoriVisible}
        onTutup={() => setModalKategoriVisible(false)}
        onDataBerubah={onDataBerubah}
      />

      {/* MODAL ALOKASI GAJI & FIRE */}
      <ModalAlokasiGaji
        visible={modalAlokasiVisible}
        onTutup={() => setModalAlokasiVisible(false)}
      />
    </ScrollView>
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
  headerArea: {
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

  // Profil Card
  profilCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profilTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profilInfoCol: {
    flex: 1,
  },
  profilNama: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profilMotto: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  btnEditProfil: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnEditProfilText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Menu Groups
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  menuGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 66,
  },

  // App Info Card
  appInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  appInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfoName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appInfoVersion: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  appInfoDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loadingOverlayText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Modal Sheet Ubah Profil
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  avatarPreviewCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarBigPreview: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  iconPickItem: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPickItemSelected: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  btnSimpanProfil: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  btnSimpanProfilText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textInverse,
  },
});
