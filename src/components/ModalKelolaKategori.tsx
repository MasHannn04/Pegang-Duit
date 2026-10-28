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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Kategori, TipeTransaksi } from '../types';
import { Colors } from '../theme/colors';
import { tampilkanAlert } from '../utils/customAlert';
import {
  ambilSemuaKategori,
  tambahKategori,
  perbaruiKategori,
  hapusKategori,
} from '../database/kategori';

interface Props {
  visible: boolean;
  onTutup: () => void;
  onDataBerubah?: () => void;
  tipeAwal?: TipeTransaksi;
}

const PILIHAN_WARNA = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#EF4444', // Red
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#64748B', // Slate
];

const IKON_PENGELUARAN = [
  'fast-food',
  'bicycle',
  'car',
  'home',
  'basket',
  'cart',
  'shirt',
  'medical',
  'school',
  'film',
  'game-controller',
  'fitness',
  'airplane',
  'phone-portrait',
  'construct',
  'gift',
  'heart',
  'flash',
  'water',
  'receipt',
  'ellipsis-horizontal-circle',
];

const IKON_PEMASUKAN = [
  'cash',
  'gift',
  'pricetag',
  'wallet',
  'trending-up',
  'card',
  'business',
  'briefcase',
  'ribbon',
  'sparkles',
  'add-circle',
];

export const ModalKelolaKategori: React.FC<Props> = ({
  visible,
  onTutup,
  onDataBerubah,
  tipeAwal = 'kredit',
}) => {
  const [tabTipe, setTabTipe] = useState<TipeTransaksi>(tipeAwal);
  const [daftarKategori, setDaftarKategori] = useState<Kategori[]>([]);
  const [tambahMode, setTambahMode] = useState(false);
  const [namaInput, setNamaInput] = useState('');
  const [ikonDipilih, setIkonDipilih] = useState('fast-food');
  const [warnaDipilih, setWarnaDipilih] = useState(PILIHAN_WARNA[0]);

  // State untuk mode edit
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setTabTipe(tipeAwal);
      muatKategori(tipeAwal);
      resetForm();
    }
  }, [visible, tipeAwal]);

  const muatKategori = async (tipe: TipeTransaksi) => {
    const list = await ambilSemuaKategori(tipe);
    setDaftarKategori(list);
  };

  const handleGantiTab = (tipe: TipeTransaksi) => {
    setTabTipe(tipe);
    muatKategori(tipe);
    resetForm();
  };

  const resetForm = () => {
    setTambahMode(false);
    setEditId(null);
    setNamaInput('');
    setWarnaDipilih(PILIHAN_WARNA[0]);
    setIkonDipilih(tabTipe === 'kredit' ? 'fast-food' : 'cash');
  };

  const mulaiTambah = () => {
    resetForm();
    setIkonDipilih(tabTipe === 'kredit' ? 'fast-food' : 'cash');
    setTambahMode(true);
  };

  const mulaiEdit = (item: Kategori) => {
    setTambahMode(false);
    setEditId(item.id);
    setNamaInput(item.nama);
    setIkonDipilih(item.ikon);
    setWarnaDipilih(item.warna);
  };

  const handleSimpan = async () => {
    if (!namaInput.trim()) {
      tampilkanAlert('Perhatian', 'Nama kategori tidak boleh kosong.');
      return;
    }

    if (editId !== null) {
      // Perbarui
      await perbaruiKategori(editId, namaInput.trim(), ikonDipilih, warnaDipilih);
      tampilkanAlert('Sukses', 'Kategori berhasil diperbarui!');
    } else {
      // Tambah baru
      await tambahKategori(namaInput.trim(), tabTipe, ikonDipilih, warnaDipilih);
      tampilkanAlert('Sukses', 'Kategori baru berhasil ditambahkan!');
    }

    resetForm();
    await muatKategori(tabTipe);
    if (onDataBerubah) onDataBerubah();
  };

  const konfirmasiHapus = (item: Kategori) => {
    tampilkanAlert(
      'Hapus Kategori',
      `Yakin ingin menghapus kategori "${item.nama}"? Catatan transaksi yang sudah ada tidak akan hilang dan tetap tercatat.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const hasil = await hapusKategori(item.id);
            tampilkanAlert('Sukses', hasil.pesan);
            await muatKategori(tabTipe);
            if (onDataBerubah) onDataBerubah();
          },
        },
      ]
    );
  };

  const ikonPilihanList = tabTipe === 'kredit' ? IKON_PENGELUARAN : IKON_PEMASUKAN;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onTutup}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Kelola Kategori Transaksi</Text>
              <Text style={styles.headerSubtitle}>
                Tambah, ubah, atau hapus kategori untuk mempermudah pencatatan & analisis laporan
              </Text>
            </View>
            <TouchableOpacity onPress={onTutup} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Toggle Tab: Pengeluaran vs Pemasukan */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                tabTipe === 'kredit' && styles.tabBtnActiveKredit,
              ]}
              onPress={() => handleGantiTab('kredit')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up-circle"
                size={16}
                color={tabTipe === 'kredit' ? Colors.textInverse : Colors.kredit}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  tabTipe === 'kredit' && styles.tabBtnTextActive,
                ]}
              >
                Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                tabTipe === 'debit' && styles.tabBtnActiveDebit,
              ]}
              onPress={() => handleGantiTab('debit')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-circle"
                size={16}
                color={tabTipe === 'debit' ? Colors.textInverse : Colors.debit}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  tabTipe === 'debit' && styles.tabBtnTextActive,
                ]}
              >
                Pemasukan
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Form Tambah / Edit Kategori */}
            {(tambahMode || editId !== null) && (
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {editId !== null ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
                  </Text>
                  <TouchableOpacity onPress={resetForm} activeOpacity={0.7}>
                    <Text style={styles.batalFormText}>Batal</Text>
                  </TouchableOpacity>
                </View>

                {/* Input Nama */}
                <Text style={styles.inputLabel}>Nama Kategori</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={tabTipe === 'kredit' ? 'Contoh: Jajan & Kopi' : 'Contoh: Hadiah / Sawer'}
                  placeholderTextColor={Colors.textMuted}
                  value={namaInput}
                  onChangeText={setNamaInput}
                  autoFocus={true}
                />

                {/* Pilih Warna */}
                <Text style={styles.inputLabel}>Pilih Warna Aksen</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                  {PILIHAN_WARNA.map((c) => {
                    const isSelected = warnaDipilih === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c },
                          isSelected && styles.colorCircleSelected,
                        ]}
                        onPress={() => setWarnaDipilih(c)}
                        activeOpacity={0.8}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Pilih Ikon */}
                <Text style={styles.inputLabel}>Pilih Ikon Simbol</Text>
                <View style={styles.iconGrid}>
                  {ikonPilihanList.map((ik) => {
                    const isSelected = ikonDipilih === ik;
                    return (
                      <TouchableOpacity
                        key={ik}
                        style={[
                          styles.iconBox,
                          isSelected && { backgroundColor: warnaDipilih + '20', borderColor: warnaDipilih },
                        ]}
                        onPress={() => setIkonDipilih(ik)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={ik as any}
                          size={20}
                          color={isSelected ? warnaDipilih : Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Tombol Simpan Form */}
                <TouchableOpacity
                  style={[styles.btnSimpanForm, { backgroundColor: warnaDipilih || Colors.primary }]}
                  onPress={handleSimpan}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnSimpanFormText}>
                    {editId !== null ? 'Simpan Perubahan' : 'Tambahkan Kategori'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tombol Buka Form Tambah */}
            {!tambahMode && editId === null && (
              <TouchableOpacity
                style={styles.btnBukaTambah}
                onPress={mulaiTambah}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.btnBukaTambahText}>
                  + Tambah Kategori {tabTipe === 'kredit' ? 'Pengeluaran' : 'Pemasukan'} Baru
                </Text>
              </TouchableOpacity>
            )}

            {/* List Kategori Tersedia */}
            <View style={styles.listSectionHeader}>
              <Text style={styles.sectionTitle}>
                Daftar Kategori {tabTipe === 'kredit' ? 'Pengeluaran' : 'Pemasukan'}
              </Text>
              <Text style={styles.itemCountText}>{daftarKategori.length} kategori</Text>
            </View>

            {daftarKategori.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetags-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyStateText}>Belum ada kategori untuk tipe ini.</Text>
              </View>
            ) : (
              daftarKategori.map((item) => {
                const isItemEditing = editId === item.id;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.kategoriRow,
                      isItemEditing && { borderColor: item.warna, backgroundColor: item.warna + '08' },
                    ]}
                  >
                    <View style={[styles.kategoriIconBg, { backgroundColor: item.warna + '1E' }]}>
                      <Ionicons name={(item.ikon as any) || 'pricetag'} size={20} color={item.warna} />
                    </View>

                    <View style={styles.kategoriInfoCol}>
                      <Text style={styles.kategoriNamaText}>{item.nama}</Text>
                      <Text style={styles.kategoriSubText}>
                        {tabTipe === 'kredit' ? 'Pos Pengeluaran' : 'Sumber Pemasukan'}
                      </Text>
                    </View>

                    <View style={styles.kategoriActionRow}>
                      <TouchableOpacity
                        style={styles.btnAction}
                        onPress={() => mulaiEdit(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={18} color={Colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnAction}
                        onPress={() => konfirmasiHapus(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.kredit} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  tabToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabBtnActiveKredit: {
    backgroundColor: Colors.kredit,
    borderColor: Colors.kredit,
  },
  tabBtnActiveDebit: {
    backgroundColor: Colors.debit,
    borderColor: Colors.debit,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.textInverse,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  formContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  batalFormText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  colorScroll: {
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSimpanForm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  btnSimpanFormText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnBukaTambah: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  btnBukaTambahText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  kategoriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  kategoriIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kategoriInfoCol: {
    flex: 1,
  },
  kategoriNamaText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  kategoriSubText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  kategoriActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
