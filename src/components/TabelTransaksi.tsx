import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaksi } from '../types';
import { formatRupiah, formatTanggalTampilan } from '../utils/format';
import { tampilkanAlert } from '../utils/customAlert';
import { Colors } from '../theme/colors';

interface Props {
  transaksiList: Transaksi[];
  onHapusTransaksi: (id: number) => void;
  onEditTransaksi: (trx: Transaksi) => void;
}

export const TabelTransaksi: React.FC<Props> = ({
  transaksiList,
  onHapusTransaksi,
  onEditTransaksi,
}) => {
  const [filterKategoriId, setFilterKategoriId] = useState<number | null>(null);

  const konfirmasiHapus = (trx: Transaksi) => {
    tampilkanAlert(
      'Hapus Transaksi',
      `Yakin ingin menghapus catatan "${trx.keterangan}" (${formatRupiah(trx.nominal)})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => trx.id && onHapusTransaksi(trx.id),
        },
      ]
    );
  };

  // Ringkasan kategori yang muncul pada transaksi ini untuk filter chips
  const kategoriTersedia = useMemo(() => {
    const map = new Map<
      number,
      { id: number; nama: string; ikon: string; warna: string; count: number; total: number; tipe: string }
    >();

    transaksiList.forEach((t) => {
      if (t.kategori_id && t.nama_kategori) {
        const existing = map.get(t.kategori_id);
        if (existing) {
          existing.count += 1;
          existing.total += t.nominal;
        } else {
          map.set(t.kategori_id, {
            id: t.kategori_id,
            nama: t.nama_kategori,
            ikon: t.ikon_kategori || 'pricetag',
            warna: t.warna_kategori || Colors.primary,
            count: 1,
            total: t.nominal,
            tipe: t.tipe,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transaksiList]);

  const katAktif = useMemo(() => {
    return filterKategoriId ? kategoriTersedia.find((k) => k.id === filterKategoriId) : null;
  }, [filterKategoriId, kategoriTersedia]);

  const listDiurutkan = useMemo(() => {
    let list = [...transaksiList].reverse();
    if (filterKategoriId !== null) {
      list = list.filter((t) => t.kategori_id === filterKategoriId);
    }
    return list;
  }, [transaksiList, filterKategoriId]);

  if (transaksiList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Ionicons name="receipt-outline" size={36} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
        <Text style={styles.emptySubtitle}>
          Tekan tombol "+ Transaksi" di bawah untuk mulai mencatat pemasukan atau pengeluaran.
        </Text>
      </View>
    );
  }

  // Cek apakah tanggal berubah dari baris sebelumnya untuk menampilkan header tanggal
  const renderItem = ({ item, index }: { item: Transaksi; index: number }) => {
    const tanggalSebelumnya = index > 0 ? listDiurutkan[index - 1].tanggal : null;
    const isTanggalBaru = item.tanggal !== tanggalSebelumnya;

    return (
      <View>
        {isTanggalBaru && (
          <View style={styles.dateHeader}>
            <Ionicons name="calendar" size={13} color={Colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={styles.dateHeaderText}>
              {formatTanggalTampilan(item.tanggal)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => onEditTransaksi(item)}
          onLongPress={() => konfirmasiHapus(item)}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View
              style={[
                styles.badgeType,
                item.tipe === 'debit' ? styles.badgeDebit : styles.badgeKredit,
              ]}
            >
              <Ionicons
                name={item.tipe === 'debit' ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={item.tipe === 'debit' ? Colors.debit : Colors.kredit}
              />
            </View>

            <View style={styles.descColumn}>
              <Text style={styles.keteranganText} numberOfLines={1}>
                {item.keterangan}
              </Text>
              <View style={styles.subInfoRow}>
                {item.nama_kategori ? (
                  <View
                    style={[
                      styles.kategoriBadge,
                      { backgroundColor: (item.warna_kategori || Colors.primary) + '1A' },
                    ]}
                  >
                    <Ionicons
                      name={(item.ikon_kategori as any) || 'pricetag'}
                      size={10}
                      color={item.warna_kategori || Colors.primary}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.kategoriBadgeText,
                        { color: item.warna_kategori || Colors.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.nama_kategori}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.saldoBerjalanText}>
                  Saldo: {formatRupiah(item.saldo_berjalan ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.itemRight}>
            <Text
              style={[
                styles.nominalText,
                item.tipe === 'debit' ? styles.nominalDebit : styles.nominalKredit,
              ]}
            >
              {item.tipe === 'debit' ? '+' : '-'} {formatRupiah(item.nominal)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Riwayat Catatan Harian</Text>
        <Text style={styles.totalItems}>
          {filterKategoriId ? `${listDiurutkan.length} dari ${transaksiList.length} transaksi` : `${transaksiList.length} transaksi`}
        </Text>
      </View>

      {/* Filter Kategori Chips Bar */}
      {kategoriTersedia.length > 0 && (
        <View style={styles.filterBarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterKategoriId === null && styles.filterChipActive,
              ]}
              onPress={() => setFilterKategoriId(null)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterKategoriId === null && styles.filterChipTextActive,
                ]}
              >
                Semua ({transaksiList.length})
              </Text>
            </TouchableOpacity>

            {kategoriTersedia.map((kat) => {
              const isSelected = filterKategoriId === kat.id;
              return (
                <TouchableOpacity
                  key={kat.id}
                  style={[
                    styles.filterChip,
                    isSelected && {
                      backgroundColor: kat.warna,
                      borderColor: kat.warna,
                    },
                  ]}
                  onPress={() => setFilterKategoriId(isSelected ? null : kat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(kat.ikon as any) || 'pricetag'}
                    size={12}
                    color={isSelected ? '#FFFFFF' : kat.warna}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {kat.nama} ({kat.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Banner Ringkasan Filter Kategori Aktif */}
      {katAktif && (
        <View style={[styles.filterBanner, { borderColor: katAktif.warna + '60' }]}>
          <View style={[styles.filterBannerIconBg, { backgroundColor: katAktif.warna + '20' }]}>
            <Ionicons name={(katAktif.ikon as any) || 'pricetag'} size={18} color={katAktif.warna} />
          </View>
          <View style={styles.filterBannerInfo}>
            <Text style={styles.filterBannerTitle}>Kategori: {katAktif.nama}</Text>
            <Text style={styles.filterBannerSub}>
              Total:{' '}
              <Text style={{ fontWeight: '800', color: Colors.textPrimary }}>
                {formatRupiah(katAktif.total)}
              </Text>{' '}
              • {listDiurutkan.length} transaksi
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setFilterKategoriId(null)}
            style={styles.filterBannerResetBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={15} color={Colors.textSecondary} style={{ marginRight: 3 }} />
            <Text style={styles.filterBannerResetText}>Semua</Text>
          </TouchableOpacity>
        </View>
      )}

      {listDiurutkan.length === 0 ? (
        <View style={styles.emptyFilterContainer}>
          {transaksiList.length === 0 ? (
            <>
              <Ionicons name="receipt-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyFilterTitle}>Belum Ada Catatan Transaksi</Text>
              <Text style={styles.emptyFilterSub}>
                Buku ini masih bersih di bulan ini. Tekan menu Catat di bawah untuk mulai mencatat pemasukan atau pengeluaran.
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyFilterTitle}>Tidak Ada Transaksi</Text>
              <Text style={styles.emptyFilterSub}>
                Belum ada catatan transaksi pada kategori yang dipilih.
              </Text>
              <TouchableOpacity
                style={styles.btnResetFilterEmpty}
                onPress={() => setFilterKategoriId(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.btnResetFilterEmptyText}>Tampilkan Semua</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={listDiurutkan}
          keyExtractor={(item, idx) => (item.id ? String(item.id) : String(idx))}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  totalItems: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterBarContainer: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingVertical: 4,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  filterBannerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  filterBannerInfo: {
    flex: 1,
  },
  filterBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  filterBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  filterBannerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  filterBannerResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: 90,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badgeType: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeDebit: {
    backgroundColor: Colors.debitBg,
  },
  badgeKredit: {
    backgroundColor: Colors.kreditBg,
  },
  descColumn: {
    flex: 1,
    paddingRight: 8,
  },
  keteranganText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  kategoriBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kategoriBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  saldoBerjalanText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  nominalText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nominalDebit: {
    color: Colors.debit,
  },
  nominalKredit: {
    color: Colors.kredit,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyFilterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyFilterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyFilterSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  btnResetFilterEmpty: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  btnResetFilterEmptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});

