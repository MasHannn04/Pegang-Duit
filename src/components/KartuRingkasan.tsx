import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RingkasanBulan, JenisBuku } from '../types';
import { formatRupiah } from '../utils/format';
import { Colors } from '../theme/colors';

interface Props {
  ringkasan: RingkasanBulan;
  jenisBuku?: JenisBuku;
  judul?: string;
}

export const KartuRingkasan: React.FC<Props> = ({ ringkasan, jenisBuku, judul }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.labelTitle}>
            {judul || 'Sisa Saldo Laporan'}
          </Text>
          <Text
            style={[
              styles.saldoAkhir,
              ringkasan.saldo_akhir < 0 && { color: Colors.kredit },
            ]}
          >
            {formatRupiah(ringkasan.saldo_akhir)}
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons
            name={jenisBuku === 'pribadi' ? 'wallet-outline' : 'cash-outline'}
            size={24}
            color={Colors.primary}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomGrid}>
        {/* Efek Sisa / Tanggungan dari Bulan Lalu (Kiri) */}
        <View style={styles.gridItemLeft}>
          <View style={styles.labelWithDot}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    ringkasan.saldo_awal < 0
                      ? Colors.kredit
                      : ringkasan.saldo_awal > 0
                      ? Colors.debit
                      : Colors.textMuted,
                },
              ]}
            />
            <Text
              style={[styles.gridLabel, ringkasan.saldo_awal < 0 && { color: Colors.kredit }]}
              numberOfLines={1}
            >
              {ringkasan.saldo_awal < 0 ? 'Tanggungan' : 'Sisa Lalu'}
            </Text>
          </View>
          <Text
            style={[
              styles.gridValueAwal,
              ringkasan.saldo_awal < 0 && { color: Colors.kredit },
              ringkasan.saldo_awal > 0 && { color: Colors.debit },
            ]}
            numberOfLines={1}
          >
            {formatRupiah(ringkasan.saldo_awal)}
          </Text>
        </View>

        {/* Masuk (Debit - Tengah) */}
        <View style={styles.gridItemCenter}>
          <View style={styles.labelWithDot}>
            <View style={[styles.dot, { backgroundColor: Colors.debit }]} />
            <Text style={styles.gridLabel}>Masuk</Text>
          </View>
          <Text style={styles.gridValueDebit} numberOfLines={1}>
            +{formatRupiah(ringkasan.total_debit).replace('Rp ', '')}
          </Text>
        </View>

        {/* Keluar (Kredit - Kanan) */}
        <View style={styles.gridItemRight}>
          <View style={styles.labelWithDot}>
            <View style={[styles.dot, { backgroundColor: Colors.kredit }]} />
            <Text style={styles.gridLabel}>Keluar</Text>
          </View>
          <Text style={styles.gridValueKredit} numberOfLines={1}>
            -{formatRupiah(ringkasan.total_kredit).replace('Rp ', '')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saldoAkhir: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
  },
  bottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridItemLeft: {
    flex: 1.15,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  gridItemCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  gridItemRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  labelWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  gridValueAwal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  gridValueDebit: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.debit,
  },
  gridValueKredit: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.kredit,
  },
});
