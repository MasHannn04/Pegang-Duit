import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RingkasanDashboard, StatusAudit, JenisKeuangan } from '../types';
import { formatRupiah } from '../utils/format';
import { Colors } from '../theme/colors';
import { KartuAuditStatus } from '../components/KartuAuditStatus';

interface Props {
  dashboardData: RingkasanDashboard;
  auditStatus: StatusAudit;
  onBukaAudit: () => void;
  onBukaKelolaJenis: () => void;
  onPilihLaporanJenis: (jenis: JenisKeuangan) => void;
}

export const DashboardView: React.FC<Props> = ({
  dashboardData,
  auditStatus,
  onBukaAudit,
  onBukaKelolaJenis,
  onPilihLaporanJenis,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Kartu Grand Total (Akumulasi Semua Jenis Keuangan Aktif) */}
      <View style={styles.grandTotalCard}>
        <View style={styles.grandHeaderRow}>
          <View>
            <Text style={styles.grandLabel}>Total Seluruh Saldo</Text>
            <Text style={styles.grandNominal}>
              {formatRupiah(dashboardData.total_saldo_semua)}
            </Text>
          </View>
          <View style={styles.grandIconBg}>
            <Ionicons name="pie-chart" size={24} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.grandDivider} />

        <View style={styles.grandStatsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Masuk</Text>
            <Text style={styles.statValueDebit}>
              +{formatRupiah(dashboardData.total_debit_semua).replace('Rp ', '')}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Keluar</Text>
            <Text style={styles.statValueKredit}>
              -{formatRupiah(dashboardData.total_kredit_semua).replace('Rp ', '')}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Kartu Status Audit Dompet Fisik */}
      <KartuAuditStatus audit={auditStatus} onBukaAudit={onBukaAudit} />

      {/* 3. Section Jenis Keuangan Aktif */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Buku Keuangan Bulan Ini</Text>
          <Text style={styles.sectionSubtitle}>
            {dashboardData.daftar_ringkasan.length} jenis aktif
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnKelolaBulan}
          onPress={onBukaKelolaJenis}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={15} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.btnKelolaText}>Atur Tampilan</Text>
        </TouchableOpacity>
      </View>

      {/* Daftar Kartu Tiap Jenis Keuangan */}
      {dashboardData.daftar_ringkasan.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Tidak ada jenis keuangan yang aktif di bulan ini.</Text>
        </View>
      ) : (
        dashboardData.daftar_ringkasan.map((item) => {
          const { jenis, ringkasan } = item;
          return (
            <TouchableOpacity
              key={jenis.id}
              style={styles.jenisCard}
              onPress={() => onPilihLaporanJenis(jenis)}
              activeOpacity={0.75}
            >
              <View style={styles.jenisTopRow}>
                <View style={styles.jenisTitleLeft}>
                  <View
                    style={[
                      styles.jenisIconBg,
                      { backgroundColor: jenis.warna || Colors.primary },
                    ]}
                  >
                    <Ionicons
                      name={
                        (jenis.ikon as any) ||
                        (jenis.kode === 'pribadi'
                          ? 'person'
                          : jenis.kode === 'kas'
                          ? 'briefcase'
                          : 'wallet')
                      }
                      size={18}
                      color={Colors.textInverse}
                    />
                  </View>
                  <View style={styles.jenisInfoCol}>
                    <Text style={styles.jenisNama} numberOfLines={1} ellipsizeMode="tail">
                      {jenis.nama}
                    </Text>
                    {jenis.is_default === 1 ? (
                      <Text style={styles.defaultBadgeText}>Buku Utama</Text>
                    ) : (
                      <Text style={styles.subTextNonUtama}>Buku Tambahan</Text>
                    )}
                  </View>
                </View>

                <View style={styles.jenisSaldoRight}>
                  <Text
                    style={[
                      styles.jenisSaldoText,
                      ringkasan.saldo_akhir < 0 && { color: Colors.kredit },
                    ]}
                    numberOfLines={1}
                  >
                    {formatRupiah(ringkasan.saldo_akhir)}
                  </Text>
                  <View style={styles.viewDetailRow}>
                    <Text style={styles.viewDetailText}>Buka Laporan</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  grandTotalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  grandHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  grandNominal: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  grandIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grandDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  grandStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValueDebit: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.debit,
  },
  statValueKredit: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.kredit,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  btnKelolaBulan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnKelolaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  jenisCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  jenisTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jenisTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  jenisIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  jenisInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  jenisNama: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  subTextNonUtama: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  jenisSaldoRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  jenisSaldoText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  viewDetailText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginRight: 2,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
