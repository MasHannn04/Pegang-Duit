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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DompetFisik, StatusAudit } from '../types';
import { formatRupiah, parseAngka } from '../utils/format';
import { tampilkanAlert } from '../utils/customAlert';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  dompetList: DompetFisik[];
  auditStatus: StatusAudit;
  onTutup: () => void;
  onSimpanDompet: (id: number, saldoBaru: number) => Promise<void>;
  onUbahNamaDompet: (id: number, namaBaru: string) => Promise<void>;
  onTambahDompet: (nama: string, saldoAwal: number) => Promise<void>;
  onHapusDompet: (id: number) => Promise<void>;
  onAutoCatatSelisih: (selisihNominal: number) => void;
}

export const ModalAuditDompet: React.FC<Props> = ({
  visible,
  dompetList,
  auditStatus,
  onTutup,
  onSimpanDompet,
  onUbahNamaDompet,
  onTambahDompet,
  onHapusDompet,
  onAutoCatatSelisih,
}) => {
  const [saldomap, setSaldomap] = useState<Record<number, string>>({});
  const [namaBaru, setNamaBaru] = useState('');
  const [tambahMode, setTambahMode] = useState(false);

  // State untuk ubah nama akun inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');

  useEffect(() => {
    const map: Record<number, string> = {};
    dompetList.forEach((d) => {
      if (d.id) map[d.id] = String(d.saldo_sekarang);
    });
    setSaldomap(map);
  }, [dompetList, visible]);

  // Hitung preview total fisik secara real-time
  const hitungTotalFisikPreview = () => {
    let total = 0;
    dompetList.forEach((d) => {
      if (d.id) {
        total += parseAngka(saldomap[d.id] ?? '0');
      }
    });
    return total;
  };

  const totalFisikRealtime = hitungTotalFisikPreview();
  const totalBuku = auditStatus.total_buku_seluruhnya;
  const selisihRealtime = totalFisikRealtime - totalBuku;
  const isBalance = selisihRealtime === 0;

  const handleSimpanSemua = async () => {
    for (const d of dompetList) {
      if (d.id) {
        const saldoBaru = parseAngka(saldomap[d.id] ?? '0');
        if (saldoBaru !== d.saldo_sekarang) {
          await onSimpanDompet(d.id, saldoBaru);
        }
      }
    }
    onTutup();
  };

  const handleTambahKantong = async () => {
    if (!namaBaru.trim()) return;
    await onTambahDompet(namaBaru.trim(), 0);
    setNamaBaru('');
    setTambahMode(false);
  };

  const handleSimpanUbahNama = async (id: number) => {
    if (!editNama.trim()) return;
    await onUbahNamaDompet(id, editNama.trim());
    setEditId(null);
    setEditNama('');
  };

  const konfirmasiHapusAkun = (dompet: DompetFisik) => {
    if (dompet.is_default === 1) {
      tampilkanAlert('Informasi', 'Akun utama tidak dapat dihapus, tapi namanya bisa kamu ganti.');
      return;
    }

    tampilkanAlert(
      'Hapus Akun',
      `Yakin ingin menghapus akun "${dompet.nama}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => dompet.id && onHapusDompet(dompet.id),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Audit Uang Fisik (Penempatan)</Text>
              <Text style={styles.headerSubtitle}>
                Cocokkan uang riil di kantong vs total catatan pembukuan
              </Text>
            </View>
            <TouchableOpacity onPress={onTutup} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Banner Status Selisih */}
            <View
              style={[
                styles.statusBanner,
                isBalance
                  ? styles.statusBannerBalance
                  : styles.statusBannerWarning,
              ]}
            >
              <Ionicons
                name={isBalance ? 'checkmark-circle' : 'alert-circle'}
                size={26}
                color={isBalance ? Colors.balance : Colors.warning}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  {isBalance
                    ? 'UANG FISIK & CATATAN BALANCE!'
                    : `ADA SELISIH: ${formatRupiah(selisihRealtime)}`}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isBalance
                    ? 'Seluruh uang fisik kamu sama persis dengan sisa saldo di catatan.'
                    : selisihRealtime < 0
                    ? `Uang fisik lebih sedikit ${formatRupiah(Math.abs(selisihRealtime))} dari pembukuan. Kemungkinan ada pengeluaran yang lupa dicatat.`
                    : `Uang fisik lebih banyak ${formatRupiah(selisihRealtime)} dari pembukuan. Kemungkinan ada pemasukan belum dicatat.`}
                </Text>
              </View>
            </View>

            {/* Rekap Perbandingan Angka */}
            <View style={styles.rekapBox}>
              <View style={styles.rekapItem}>
                <Text style={styles.rekapLabel}>Total Real (Fisik)</Text>
                <Text style={styles.rekapValue}>{formatRupiah(totalFisikRealtime)}</Text>
              </View>
              <Text style={styles.rekapOperator}>-</Text>
              <View style={styles.rekapItem}>
                <Text style={styles.rekapLabel}>Total Buku</Text>
                <Text style={styles.rekapValue}>{formatRupiah(totalBuku)}</Text>
              </View>
              <Text style={styles.rekapOperator}>=</Text>
              <View style={styles.rekapItem}>
                <Text style={styles.rekapLabel}>Selisih</Text>
                <Text
                  style={[
                    styles.rekapValue,
                    { color: isBalance ? Colors.balance : Colors.kredit },
                  ]}
                >
                  {formatRupiah(selisihRealtime)}
                </Text>
              </View>
            </View>

            {/* Opsi Auto-Catat Selisih jika minus */}
            {!isBalance && selisihRealtime < 0 && (
              <TouchableOpacity
                style={styles.btnAutoCatat}
                onPress={() => {
                  onAutoCatatSelisih(Math.abs(selisihRealtime));
                  onTutup();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.btnAutoCatatText}>
                  Catat Otomatis sebagai "Pengeluaran Tak Terduga"
                </Text>
              </TouchableOpacity>
            )}

            {/* Daftar Kantong Penempatan */}
            <View style={styles.dompetSectionHeader}>
              <Text style={styles.sectionTitle}>Saldo di Setiap Kantong / Akun</Text>
              <Text style={styles.sectionHint}>Ketuk pensil untuk ganti nama</Text>
            </View>

            {dompetList.map((dompet) => {
              if (!dompet.id) return null;
              const val = saldomap[dompet.id] ?? '';
              const isEditing = editId === dompet.id;
              const isDefault = dompet.is_default === 1;

              return (
                <View key={dompet.id} style={styles.dompetRow}>
                  {/* Nama Akun & Aksi Ganti Nama / Hapus */}
                  <View style={styles.dompetInfo}>
                    <Ionicons
                      name={
                        dompet.nama.toLowerCase().includes('rekening') || dompet.nama.toLowerCase().includes('bank')
                          ? 'card-outline'
                          : dompet.nama.toLowerCase().includes('dompet') || dompet.nama.toLowerCase().includes('tunai')
                          ? 'wallet-outline'
                          : 'phone-portrait-outline'
                      }
                      size={18}
                      color={Colors.primary}
                      style={{ marginRight: 8 }}
                    />

                    {isEditing ? (
                      <View style={styles.editNameRow}>
                        <TextInput
                          style={styles.editNameInput}
                          value={editNama}
                          onChangeText={setEditNama}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.btnSimpanName}
                          onPress={() => handleSimpanUbahNama(dompet.id!)}
                        >
                          <Ionicons name="checkmark" size={14} color={Colors.textInverse} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.nameAndActions}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.dompetNama} numberOfLines={1}>
                            {dompet.nama}
                          </Text>
                          {isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Utama</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.smallActionsRow}>
                          <TouchableOpacity
                            onPress={() => {
                              setEditId(dompet.id!);
                              setEditNama(dompet.nama);
                            }}
                            style={styles.iconMini}
                          >
                            <Ionicons name="pencil" size={11} color={Colors.textMuted} />
                          </TouchableOpacity>

                          {!isDefault && (
                            <TouchableOpacity
                              onPress={() => konfirmasiHapusAkun(dompet)}
                              style={styles.iconMini}
                            >
                              <Ionicons name="trash-outline" size={12} color={Colors.kredit} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Input Saldo */}
                  <View style={styles.dompetInputContainer}>
                    <Text style={styles.dompetPrefix}>Rp</Text>
                    <TextInput
                      style={styles.dompetInput}
                      keyboardType="numeric"
                      value={val}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      onChangeText={(txt) => {
                        const clean = txt.replace(/[^\d]/g, '');
                        setSaldomap((prev) => ({ ...prev, [dompet.id!]: clean }));
                      }}
                    />
                  </View>
                </View>
              );
            })}

            {/* Form Tambah Kantong Baru */}
            {tambahMode ? (
              <View style={styles.tambahBox}>
                <TextInput
                  style={styles.inputTambah}
                  placeholder="Nama Akun (misal: GoPay, Bank Jago, Tabungan)"
                  placeholderTextColor={Colors.textMuted}
                  value={namaBaru}
                  onChangeText={setNamaBaru}
                  autoFocus
                />
                <View style={styles.tambahActions}>
                  <TouchableOpacity
                    style={styles.btnBatalTambah}
                    onPress={() => setTambahMode(false)}
                  >
                    <Text style={styles.btnBatalText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnSimpanTambah}
                    onPress={handleTambahKantong}
                  >
                    <Text style={styles.btnSimpanText}>Tambah Akun</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.btnTambahKantong}
                onPress={() => setTambahMode(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.btnTambahText}>Tambah Akun / Kantong Baru</Text>
              </TouchableOpacity>
            )}

            {/* Tombol Simpan Audit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSimpanSemua}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-sharp" size={20} color={Colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={styles.submitText}>Simpan Hasil Audit</Text>
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
    maxHeight: '92%',
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusBannerBalance: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBannerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  rekapBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  rekapItem: {
    alignItems: 'center',
  },
  rekapLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  rekapValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  rekapOperator: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  btnAutoCatat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnAutoCatatText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dompetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  dompetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  dompetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 6,
  },
  nameAndActions: {
    flex: 1,
  },
  dompetNama: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  smallActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  iconMini: {
    padding: 2,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editNameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  btnSimpanName: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    padding: 5,
    marginLeft: 4,
  },
  dompetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 125,
  },
  dompetPrefix: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  dompetInput: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: 6,
    textAlign: 'right',
    flex: 1,
  },
  btnTambahKantong: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 16,
  },
  btnTambahText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  tambahBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  inputTambah: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  tambahActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btnBatalTambah: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnBatalText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  btnSimpanTambah: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnSimpanText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
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
