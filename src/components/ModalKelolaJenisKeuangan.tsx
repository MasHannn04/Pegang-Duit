import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JenisKeuangan } from '../types';
import { tampilkanAlert } from '../utils/customAlert';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  periodeBulan: string;
  daftarJenis: JenisKeuangan[];
  onTutup: () => void;
  onTambahJenis: (nama: string, ikon: string, warna: string) => Promise<void>;
  onUbahNamaJenis: (id: number, namaBaru: string) => Promise<void>;
  onToggleArsip: (id: number, arsipkan: boolean) => Promise<void>;
  onToggleAktifBulan: (jenisId: number, isAktif: boolean) => Promise<void>;
  onHapusPermanen: (id: number) => Promise<void>;
}

const PILIHAN_WARNA = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export const ModalKelolaJenisKeuangan: React.FC<Props> = ({
  visible,
  daftarJenis,
  onTutup,
  onTambahJenis,
  onUbahNamaJenis,
  onToggleArsip,
  onToggleAktifBulan,
  onHapusPermanen,
}) => {
  const [tambahMode, setTambahMode] = useState(false);
  const [namaBaru, setNamaBaru] = useState('');
  const [warnaDipilih, setWarnaDipilih] = useState(PILIHAN_WARNA[0]);

  // State untuk ubah nama inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');

  const handleSimpanTambah = async () => {
    if (!namaBaru.trim()) return;
    await onTambahJenis(namaBaru.trim(), 'wallet', warnaDipilih);
    setNamaBaru('');
    setTambahMode(false);
  };

  const handleSimpanEditNama = async (id: number) => {
    if (!editNama.trim()) return;
    await onUbahNamaJenis(id, editNama.trim());
    setEditId(null);
    setEditNama('');
  };

  const konfirmasiHapus = (jenis: JenisKeuangan) => {
    tampilkanAlert(
      'Hapus Permanen',
      `Yakin ingin menghapus permanen "${jenis.nama}"? Pastikan tidak ada transaksi di dalamnya.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => onHapusPermanen(jenis.id),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onTutup}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Kelola Jenis Keuangan</Text>
              <Text style={styles.headerSubtitle}>
                Atur buku kas, nama, status arsip, dan tampilan bulan ini
              </Text>
            </View>
            <TouchableOpacity onPress={onTutup} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Daftar Jenis Keuangan */}
            <Text style={styles.sectionTitle}>Daftar Buku Keuangan</Text>

            {daftarJenis.map((jenis) => {
              const isEditing = editId === jenis.id;
              const isDefault = jenis.is_default === 1;

              return (
                <View key={jenis.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemLeft}>
                      <View
                        style={[
                          styles.itemIconBg,
                          { backgroundColor: jenis.warna || Colors.primary },
                        ]}
                      >
                        <Ionicons
                          name={(jenis.ikon as any) || 'wallet'}
                          size={18}
                          color={Colors.textInverse}
                        />
                      </View>

                      {isEditing ? (
                        <View style={styles.editRow}>
                          <TextInput
                            style={styles.editInput}
                            value={editNama}
                            onChangeText={setEditNama}
                            autoFocus
                          />
                          <TouchableOpacity
                            onPress={() => handleSimpanEditNama(jenis.id)}
                            style={styles.btnSimpanEdit}
                          >
                            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.itemNama}>{jenis.nama}</Text>
                            {isDefault && (
                              <View style={styles.badgeDefault}>
                                <Text style={styles.badgeDefaultText}>Bawaan</Text>
                              </View>
                            )}
                            {jenis.is_arsip === 1 && (
                              <View style={styles.badgeArsip}>
                                <Text style={styles.badgeArsipText}>Diarsipkan</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.itemSubtext}>
                            {jenis.is_aktif_bulan_ini ? 'Tampil di bulan ini' : 'Disembunyikan di bulan ini'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Switch Tampil di Bulan Ini */}
                    <Switch
                      value={jenis.is_aktif_bulan_ini}
                      onValueChange={(val) => onToggleAktifBulan(jenis.id, val)}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.surface}
                    />
                  </View>

                  {/* Tombol Aksi Tambahan */}
                  {!isEditing && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                          setEditId(jenis.id);
                          setEditNama(jenis.nama);
                        }}
                      >
                        <Ionicons name="pencil" size={13} color={Colors.textSecondary} style={{ marginRight: 3 }} />
                        <Text style={styles.actionBtnText}>Ubah Nama</Text>
                      </TouchableOpacity>

                      {!isDefault && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => onToggleArsip(jenis.id, jenis.is_arsip === 0)}
                        >
                          <Ionicons
                            name={jenis.is_arsip === 0 ? 'archive-outline' : 'refresh-outline'}
                            size={13}
                            color={Colors.textSecondary}
                            style={{ marginRight: 3 }}
                          />
                          <Text style={styles.actionBtnText}>
                            {jenis.is_arsip === 0 ? 'Arsipkan' : 'Buka Arsip'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!isDefault && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => konfirmasiHapus(jenis)}
                        >
                          <Ionicons name="trash-outline" size={13} color={Colors.kredit} style={{ marginRight: 3 }} />
                          <Text style={[styles.actionBtnText, { color: Colors.kredit }]}>Hapus</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Form Tambah Baru */}
            {tambahMode ? (
              <View style={styles.tambahBox}>
                <Text style={styles.tambahTitle}>Tambah Jenis Keuangan Baru</Text>
                <TextInput
                  style={styles.inputTambah}
                  placeholder="Nama (misal: Tabungan Qurban, Bisnis)"
                  placeholderTextColor={Colors.textMuted}
                  value={namaBaru}
                  onChangeText={setNamaBaru}
                />

                <Text style={styles.warnaLabel}>Pilih Warna Aksen:</Text>
                <View style={styles.warnaRow}>
                  {PILIHAN_WARNA.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.warnaCircle,
                        { backgroundColor: c },
                        warnaDipilih === c && styles.warnaCircleSelected,
                      ]}
                      onPress={() => setWarnaDipilih(c)}
                    />
                  ))}
                </View>

                <View style={styles.tambahActions}>
                  <TouchableOpacity
                    style={styles.btnBatalTambah}
                    onPress={() => setTambahMode(false)}
                  >
                    <Text style={styles.btnBatalText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnSimpanTambah}
                    onPress={handleSimpanTambah}
                  >
                    <Text style={styles.btnSimpanText}>Tambah</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.btnBukaTambah}
                onPress={() => setTambahMode(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.btnBukaTambahText}>Tambah Jenis Keuangan Baru</Text>
              </TouchableOpacity>
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
    maxHeight: '90%',
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemNama: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badgeDefault: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeDefaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  badgeArsip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeArsipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.danger,
  },
  itemSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  btnSimpanEdit: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnBukaTambah: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: 6,
    marginBottom: 20,
  },
  btnBukaTambahText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  tambahBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  tambahTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputTambah: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  warnaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  warnaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  warnaCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  warnaCircleSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  tambahActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btnBatalTambah: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnBatalText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  btnSimpanTambah: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnSimpanText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
