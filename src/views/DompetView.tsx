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
  dompetList: DompetFisik[];
  auditStatus: StatusAudit;
  onSimpanDompet: (id: number, saldoBaru: number) => Promise<void>;
  onUbahNamaDompet: (id: number, namaBaru: string) => Promise<void>;
  onTambahDompet: (nama: string, saldoAwal: number) => Promise<void>;
  onHapusDompet: (id: number) => Promise<void>;
  onAutoCatatSelisih: (selisihNominal: number) => void;
}

export const DompetView: React.FC<Props> = ({
  dompetList,
  auditStatus,
  onSimpanDompet,
  onUbahNamaDompet,
  onTambahDompet,
  onHapusDompet,
  onAutoCatatSelisih,
}) => {
  const [saldomap, setSaldomap] = useState<Record<number, string>>({});
  const [namaBaru, setNamaBaru] = useState('');
  const [modalTambahVisible, setModalTambahVisible] = useState(false);

  // State untuk ubah nama akun
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');

  const [suksesSimpan, setSuksesSimpan] = useState(false);

  useEffect(() => {
    const map: Record<number, string> = {};
    dompetList.forEach((d) => {
      if (d.id) map[d.id] = String(d.saldo_sekarang);
    });
    setSaldomap(map);
  }, [dompetList]);

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
    let adaPerubahan = false;
    for (const d of dompetList) {
      if (d.id) {
        const saldoBaru = parseAngka(saldomap[d.id] ?? '0');
        if (saldoBaru !== d.saldo_sekarang) {
          adaPerubahan = true;
          await onSimpanDompet(d.id, saldoBaru);
        }
      }
    }
    setSuksesSimpan(true);
    setTimeout(() => setSuksesSimpan(false), 2500);
    if (!adaPerubahan) {
      tampilkanAlert('Tersimpan', 'Semua saldo dompet aktual sudah sinkron.');
    }
  };

  const handleTambahKantong = async () => {
    if (!namaBaru.trim()) return;
    await onTambahDompet(namaBaru.trim(), 0);
    setNamaBaru('');
    setModalTambahVisible(false);
  };

  const bukaModalEditNama = (dompet: DompetFisik) => {
    if (dompet.id) {
      setEditId(dompet.id);
      setEditNama(dompet.nama);
      setModalEditVisible(true);
    }
  };

  const handleSimpanUbahNama = async () => {
    if (!editNama.trim() || editId === null) return;
    await onUbahNamaDompet(editId, editNama.trim());
    setModalEditVisible(false);
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
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Dompet & Uang Aktual</Text>
          <Text style={styles.headerSubtitle}>
            Sinkronisasi saldo nyata (rekening, tunai, e-wallet) dengan catatan pembukuan laporan.
          </Text>
        </View>

        {/* 1. KARTU HASIL REKONSILIASI / AUDIT */}
        <View
          style={[
            styles.rekonCard,
            isBalance ? styles.rekonCardBalance : styles.rekonCardDiff,
          ]}
        >
          <View style={styles.rekonHeaderRow}>
            <View style={styles.rekonStatusPill}>
              <Ionicons
                name={isBalance ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={isBalance ? '#15803D' : '#B45309'}
              />
              <Text
                style={[
                  styles.rekonStatusText,
                  { color: isBalance ? '#15803D' : '#B45309' },
                ]}
              >
                {isBalance ? 'Saldo Cocok & Sempurna' : 'Perhatian: Ada Selisih Uang'}
              </Text>
            </View>
          </View>

          {/* Grid 3 Kolom: Aktual, Laporan, Selisih */}
          <View style={styles.rekonGrid}>
            <View style={styles.rekonCol}>
              <View style={styles.rekonLabelWrapper}>
                <Text style={styles.rekonColLabel}>Total Uang Aktual</Text>
              </View>
              <Text style={styles.rekonColValue}>
                {formatRupiah(totalFisikRealtime)}
              </Text>
            </View>

            <View style={styles.rekonColDivider} />

            <View style={styles.rekonCol}>
              <View style={styles.rekonLabelWrapper}>
                <Text style={styles.rekonColLabel}>Total Laporan</Text>
              </View>
              <Text style={styles.rekonColValue}>
                {formatRupiah(totalBuku)}
              </Text>
            </View>

            <View style={styles.rekonColDivider} />

            <View style={styles.rekonCol}>
              <View style={styles.rekonLabelWrapper}>
                <Text style={styles.rekonColLabel}>Selisih</Text>
              </View>
              <Text
                style={[
                  styles.rekonColValue,
                  {
                    color: isBalance
                      ? '#15803D'
                      : selisihRealtime < 0
                      ? Colors.kredit
                      : Colors.debit,
                    fontWeight: '800',
                  },
                ]}
              >
                {formatRupiah(selisihRealtime)}
              </Text>
            </View>
          </View>

          {/* Rincian Saldo per Buku Laporan */}
          {auditStatus.rincian_buku.length > 0 && (
            <View style={styles.rincianBukuContainer}>
              <Text style={styles.rincianTitle}>Rincian Saldo Laporan:</Text>
              <View style={styles.rincianPillsRow}>
                {auditStatus.rincian_buku.map((buku, idx) => (
                  <View key={idx} style={styles.rincianPillItem}>
                    <View
                      style={[
                        styles.dotBuku,
                        { backgroundColor: buku.warna || Colors.primary },
                      ]}
                    />
                    <Text style={styles.rincianBukuText}>
                      {buku.nama}:{' '}
                      <Text style={{ fontWeight: '700' }}>
                        {formatRupiah(buku.saldo)}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 2. SECTION DAFTAR KANTONG & DOMPET AKTUAL (Anti-Offside) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Pos Uang Aktual</Text>
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              Rekening bank, tunai, atau e-wallet
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnTambahPos}
            onPress={() => setModalTambahVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={15} color={Colors.primary} style={{ marginRight: 3 }} />
            <Text style={styles.btnTambahPosText}>Tambah Pos</Text>
          </TouchableOpacity>
        </View>

        {/* List Dompet Fisik */}
        {dompetList.map((dompet) => {
          if (!dompet.id) return null;
          const isDefault = dompet.is_default === 1;

          return (
            <View key={dompet.id} style={styles.dompetCard}>
              <View style={styles.dompetCardTop}>
                <View style={styles.dompetNameBox}>
                  <View style={styles.dompetIconBg}>
                    <Ionicons
                      name={isDefault ? 'card-outline' : 'cash-outline'}
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.dompetNameText} numberOfLines={1}>
                        {dompet.nama}
                      </Text>
                      {isDefault && (
                        <View style={styles.badgeUtama}>
                          <Text style={styles.badgeUtamaText}>Utama</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dompetHint}>Masukkan saldo riil saat ini</Text>
                  </View>
                </View>

                {/* Tombol Edit Nama & Hapus */}
                <View style={styles.dompetActions}>
                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => bukaModalEditNama(dompet)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>

                  {!isDefault && (
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => konfirmasiHapusAkun(dompet)}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.kredit} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Input Saldo Riil */}
              <View style={styles.dompetInputContainer}>
                <Text style={styles.prefixRp}>Rp</Text>
                <TextInput
                  style={styles.inputSaldo}
                  value={saldomap[dompet.id] ?? ''}
                  onChangeText={(text) => {
                    setSaldomap({
                      ...saldomap,
                      [dompet.id!]: text.replace(/[^0-9]/g, ''),
                    });
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          );
        })}

        {/* Tombol Simpan Semua Saldo Aktual */}
        <TouchableOpacity
          style={styles.btnSimpanSemua}
          onPress={handleSimpanSemua}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done-circle" size={20} color={Colors.textInverse} style={{ marginRight: 8 }} />
          <Text style={styles.btnSimpanSemuaText}>Simpan Seluruh Saldo Aktual</Text>
        </TouchableOpacity>

        {suksesSimpan && (
          <View style={styles.toastSukses}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.toastSuksesText}>Saldo aktual berhasil diperbarui!</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: Tambah Pos Baru */}
      <Modal
        visible={modalTambahVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalTambahVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Tambah Pos Uang Aktual</Text>
            <Text style={styles.modalSub}>
              Contoh: BCA, Mandiri, ShopeePay, Dompet Kulit, Brankas
            </Text>

            <TextInput
              style={styles.textInputModal}
              placeholder="Nama Pos (misal: Blu BCA)"
              value={namaBaru}
              onChangeText={setNamaBaru}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnBatalModal}
                onPress={() => setModalTambahVisible(false)}
              >
                <Text style={styles.btnBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSimpanModal}
                onPress={handleTambahKantong}
              >
                <Text style={styles.btnSimpanText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Ubah Nama Pos */}
      <Modal
        visible={modalEditVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ubah Nama Pos</Text>
            <Text style={styles.modalSub}>Ketik nama baru untuk pos keuangan ini:</Text>

            <TextInput
              style={styles.textInputModal}
              placeholder="Nama Baru"
              value={editNama}
              onChangeText={setEditNama}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnBatalModal}
                onPress={() => setModalEditVisible(false)}
              >
                <Text style={styles.btnBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSimpanModal}
                onPress={handleSimpanUbahNama}
              >
                <Text style={styles.btnSimpanText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    lineHeight: 17,
  },

  // Rekonsiliasi Card
  rekonCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rekonCardBalance: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  rekonCardDiff: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  rekonHeaderRow: {
    marginBottom: 14,
  },
  rekonStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  rekonStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  rekonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  rekonCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rekonLabelWrapper: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rekonColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  rekonColValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  rekonColDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  rincianBukuContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  rincianTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  rincianPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rincianPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dotBuku: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  rincianBukuText: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
  // Section
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  btnTambahPos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexShrink: 0,
  },
  btnTambahPosText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Dompet Cards
  dompetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dompetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dompetNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dompetIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dompetNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  badgeUtama: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeUtamaText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  dompetHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dompetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dompetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  prefixRp: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 6,
  },
  inputSaldo: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Tombol Simpan Semua
  btnSimpanSemua: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSimpanSemuaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  toastSukses: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  toastSuksesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  textInputModal: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnBatalModal: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  btnBatalText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnSimpanModal: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  btnSimpanText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
