import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JenisKeuangan, Transaksi, RingkasanBulan } from '../types';
import { formatRupiah } from '../utils/format';
import { Colors } from '../theme/colors';
import { KartuRingkasan } from '../components/KartuRingkasan';
import { TabelTransaksi } from '../components/TabelTransaksi';

interface Props {
  daftarJenis: JenisKeuangan[];
  jenisDipilih: JenisKeuangan | null;
  ringkasan: RingkasanBulan;
  transaksiList: Transaksi[];
  onPilihJenis: (jenis: JenisKeuangan | null) => void;
  onBukaKelolaJenis: () => void;
  onEksporExcel: () => void;
  onHapusTransaksi: (id: number) => void;
  onEditTransaksi: (trx: Transaksi) => void;
}

export const LaporanView: React.FC<Props> = ({
  daftarJenis,
  jenisDipilih,
  ringkasan,
  transaksiList,
  onPilihJenis,
  onBukaKelolaJenis,
  onEksporExcel,
  onHapusTransaksi,
  onEditTransaksi,
}) => {
  // ==========================================
  // MODE DETAIL: KETIKA MEMBUKA SALAH SATU BUKU
  // ==========================================
  if (jenisDipilih) {
    return (
      <View style={styles.container}>
        {/* Header Bar Detail: Tombol Kembali & Info Buku */}
        <View style={styles.detailHeaderBar}>
          <TouchableOpacity
            style={styles.btnKembali}
            onPress={() => onPilihJenis(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
            <Text style={styles.btnKembaliText}>Portofolio</Text>
          </TouchableOpacity>

          <View style={styles.detailTitleCenter}>
            <View
              style={[
                styles.miniColorDot,
                { backgroundColor: jenisDipilih.warna || Colors.primary },
              ]}
            />
            <Text style={styles.detailTitleText} numberOfLines={1}>
              {jenisDipilih.nama}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnEksporMini}
            onPress={onEksporExcel}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Kartu Ringkasan Saldo Buku */}
        <KartuRingkasan
          ringkasan={ringkasan}
          judul={`Sisa Saldo ${jenisDipilih.nama}`}
        />

        {/* Tabel Mutasi Transaksi dengan Running Balance */}
        <TabelTransaksi
          transaksiList={transaksiList}
          onHapusTransaksi={onHapusTransaksi}
          onEditTransaksi={onEditTransaksi}
        />
      </View>
    );
  }

  // ==========================================
  // MODE UTAMA: DAFTAR PORTOFOLIO (GAYA BIBIT)
  // ==========================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.portfolioContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Judul Portofolio */}
      <View style={styles.portfolioHeaderContainer}>
        <Text style={styles.portfolioHeading}>Daftar Portofolio</Text>
        <Text style={styles.portfolioSubheading}>
          Pilih buku untuk melihat rincian mutasi & laporan
        </Text>
      </View>

      {/* 2. Banner Ekspor Excel Bulanan */}
      <TouchableOpacity
        style={styles.bannerEkspor}
        onPress={onEksporExcel}
        activeOpacity={0.8}
      >
        <View style={styles.bannerEksporLeft}>
          <View style={styles.iconExcelBg}>
            <Ionicons name="document-text" size={20} color="#15803D" />
          </View>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={styles.bannerEksporTitle}>Ekspor Laporan Bulanan</Text>
            <Text style={styles.bannerEksporSub}>Download file .xlsx semua portofolio</Text>
          </View>
        </View>
        <Ionicons name="cloud-download-outline" size={20} color="#15803D" />
      </TouchableOpacity>

      {/* 3. Section Title & Tombol Kelola (Pas di dalam frame tanpa offside) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.listSectionTitle}>Buku Laporan Aktif ({daftarJenis.length})</Text>
        <TouchableOpacity
          style={styles.btnKelolaMaster}
          onPress={onBukaKelolaJenis}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.btnKelolaMasterText}>Kelola Buku</Text>
        </TouchableOpacity>
      </View>

      {/* 4. List Kartu Portofolio (Gaya Bibit: 2 Baris Lega, Anti Numpuk) */}
      {daftarJenis.map((item) => {
        const isDefault = item.is_default === 1;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.portofolioCard}
            onPress={() => onPilihJenis(item)}
            activeOpacity={0.75}
          >
            {/* Baris Atas: Ikon + Nama Buku + Badge Utama + Tombol Panah Kecil */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardTopLeft}>
                <View
                  style={[
                    styles.cardIconBg,
                    { backgroundColor: item.warna || Colors.primary },
                  ]}
                >
                  <Ionicons
                    name={(item.ikon as any) || 'wallet'}
                    size={18}
                    color={Colors.textInverse}
                  />
                </View>

                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.nama}
                  </Text>
                  {isDefault && (
                    <View style={styles.badgeUtama}>
                      <Text style={styles.badgeUtamaText}>Utama</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.chevronBox}>
                <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
              </View>
            </View>

            {/* Garis Pemisah Halus */}
            <View style={styles.cardDivider} />

            {/* Baris Bawah: Label Saldo & Hint Buka Mutasi di Kiri, Nominal di Kanan */}
            <View style={styles.cardBottomRow}>
              <View style={styles.saldoLabelBox}>
                <Text style={styles.saldoLabelText}>Total Saldo Laporan</Text>
                <Text style={styles.mutasiHintText}>Ketuk untuk buka mutasi ›</Text>
              </View>

              <Text
                style={[
                  styles.cardSaldo,
                  (item.saldo_bulan_ini ?? 0) < 0 && { color: Colors.kredit },
                ]}
              >
                {formatRupiah(item.saldo_bulan_ini ?? 0)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  portfolioContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 6,
  },
  portfolioHeaderContainer: {
    marginBottom: 16,
  },
  portfolioHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  portfolioSubheading: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnKelolaMaster: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnKelolaMasterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  bannerEkspor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  bannerEksporLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconExcelBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerEksporTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  bannerEksporSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  portofolioCard: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  badgeUtama: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeUtamaText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  chevronBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  saldoLabelBox: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  saldoLabelText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  mutasiHintText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  cardSaldo: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flexShrink: 0,
  },

  // Detail View Header
  detailHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 4,
  },
  btnKembali: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnKembaliText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  detailTitleCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  miniColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  detailTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  btnEksporMini: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
