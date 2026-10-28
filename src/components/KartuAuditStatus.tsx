import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusAudit } from '../types';
import { formatRupiah } from '../utils/format';
import { Colors } from '../theme/colors';

interface Props {
  audit: StatusAudit;
  onBukaAudit: () => void;
}

export const KartuAuditStatus: React.FC<Props> = ({ audit, onBukaAudit }) => {
  const isBalance = audit.apakah_cocok;
  const isNegative = audit.selisih < 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isBalance
          ? styles.cardBalance
          : isNegative
          ? styles.cardWarning
          : styles.cardNeutral,
      ]}
      onPress={onBukaAudit}
      activeOpacity={0.8}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isBalance ? Colors.balanceBg : Colors.warningBg },
          ]}
        >
          <Ionicons
            name={isBalance ? 'checkmark-circle' : 'alert-circle'}
            size={22}
            color={isBalance ? Colors.balance : Colors.warning}
          />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.labelAudit}>
            {isBalance
              ? 'Uang Aktual Cocok (Balance)'
              : `Ada Selisih: ${formatRupiah(audit.selisih)}`}
          </Text>
          <Text style={styles.subAudit}>
            Aktual: {formatRupiah(audit.total_fisik)} • Laporan: {formatRupiah(audit.total_buku_seluruhnya)}
          </Text>
        </View>
      </View>

      <View style={styles.rightAction}>
        <Text style={styles.actionText}>Audit</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardBalance: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  cardNeutral: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
  },
  labelAudit: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subAudit: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
