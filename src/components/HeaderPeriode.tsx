import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPeriodeBulan, getPeriodeBulanSekarang } from '../utils/format';
import { Colors } from '../theme/colors';

interface Props {
  periodeBulan: string; // YYYY-MM
  periodeTerawal?: string; // YYYY-MM (misal: '2026-01')
  sembunyikanBulan?: boolean;
  onUbahPeriode: (periodeBaru: string) => void;
  onBukaPengaturan?: () => void;
  onBukaAudit?: () => void;
}

export const HeaderPeriode: React.FC<Props> = ({
  periodeBulan,
  periodeTerawal = '2026-01',
  sembunyikanBulan = false,
  onUbahPeriode,
  onBukaPengaturan,
  onBukaAudit,
}) => {
  const periodeSekarang = getPeriodeBulanSekarang();
  const batasAwal = periodeTerawal || '2026-01';
  const isBulanSekarang = periodeBulan >= periodeSekarang;
  const isBulanTerawal = periodeBulan <= batasAwal;

  const geserBulan = (offset: number) => {
    // Cegah geser ke bulan setelah bulan ini (masa depan)
    if (offset > 0 && isBulanSekarang) return;

    // Cegah geser ke sebelum bulan terawal (sebelum mulai pencatatan)
    if (offset < 0 && isBulanTerawal) return;

    const [tahunStr, bulanStr] = periodeBulan.split('-');
    let tahun = parseInt(tahunStr, 10);
    let bulan = parseInt(bulanStr, 10) + offset;

    if (bulan > 12) {
      bulan = 1;
      tahun += 1;
    } else if (bulan < 1) {
      bulan = 12;
      tahun -= 1;
    }

    const bulanFormat = String(bulan).padStart(2, '0');
    const targetPeriode = `${tahun}-${bulanFormat}`;

    // Pastikan tidak melompat ke masa depan
    if (offset > 0 && targetPeriode > periodeSekarang) return;

    // Pastikan tidak melompat ke sebelum batas awal
    if (offset < 0 && targetPeriode < batasAwal) return;

    onUbahPeriode(targetPeriode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet" size={20} color={Colors.textInverse} />
          </View>
          <Text style={styles.appName}>Pegang Duit</Text>
        </View>

        {(onBukaAudit || onBukaPengaturan) && (
          <View style={styles.actionButtons}>
            {onBukaAudit && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onBukaAudit}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {onBukaPengaturan && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onBukaPengaturan}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Navigasi Bulan (Hanya jika tidak disembunyikan) */}
      {!sembunyikanBulan && (
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[
              styles.arrowButton,
              isBulanTerawal && styles.arrowButtonDisabled,
            ]}
            onPress={() => geserBulan(-1)}
            disabled={isBulanTerawal}
            activeOpacity={isBulanTerawal ? 1 : 0.6}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.monthBadge}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.monthText}>{formatPeriodeBulan(periodeBulan)}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.arrowButton,
              isBulanSekarang && styles.arrowButtonDisabled,
            ]}
            onPress={() => geserBulan(1)}
            disabled={isBulanSekarang}
            activeOpacity={isBulanSekarang ? 1 : 0.6}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 6,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  arrowButtonDisabled: {
    opacity: 0.35,
    elevation: 0,
    shadowOpacity: 0,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
