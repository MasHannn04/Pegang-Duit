import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { TabMenu } from '../types';

interface Props {
  tabAktif: TabMenu;
  onPilihTab: (tab: TabMenu) => void;
  onTekanTambahTransaksi: () => void;
}

export const NavbarBawah: React.FC<Props> = ({
  tabAktif,
  onPilihTab,
  onTekanTambahTransaksi,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      {/* 1. Tab: Dashboard */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onPilihTab('dashboard')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={tabAktif === 'dashboard' ? 'grid' : 'grid-outline'}
          size={21}
          color={tabAktif === 'dashboard' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.navLabel,
            tabAktif === 'dashboard' && styles.navLabelActive,
          ]}
        >
          Dashboard
        </Text>
      </TouchableOpacity>

      {/* 2. Tab: Dompet (Nata Uang Fisik & Rekonsiliasi) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onPilihTab('dompet')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={tabAktif === 'dompet' ? 'wallet' : 'wallet-outline'}
          size={22}
          color={tabAktif === 'dompet' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.navLabel,
            tabAktif === 'dompet' && styles.navLabelActive,
          ]}
        >
          Dompet
        </Text>
      </TouchableOpacity>

      {/* 3. Tombol Tengah Menonjol: Catat Transaksi (+) */}
      <View style={styles.centerButtonWrapper}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={onTekanTambahTransaksi}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text
          style={[
            styles.floatingLabel,
            tabAktif === 'catat' && { color: Colors.primary, fontWeight: '800' },
          ]}
        >
          Catat
        </Text>
      </View>

      {/* 4. Tab: Laporan (Portofolio Bibit Style & Mutasi) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onPilihTab('laporan')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={tabAktif === 'laporan' ? 'document-text' : 'document-text-outline'}
          size={22}
          color={tabAktif === 'laporan' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.navLabel,
            tabAktif === 'laporan' && styles.navLabelActive,
          ]}
        >
          Laporan
        </Text>
      </TouchableOpacity>

      {/* 5. Tab: Akun (Profil & Pengaturan) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onPilihTab('akun')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={tabAktif === 'akun' ? 'person' : 'person-outline'}
          size={22}
          color={tabAktif === 'akun' ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.navLabel,
            tabAktif === 'akun' && styles.navLabelActive,
          ]}
        >
          Akun
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    minHeight: 60,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 3,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3.5,
    borderColor: Colors.background,
  },
  floatingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
