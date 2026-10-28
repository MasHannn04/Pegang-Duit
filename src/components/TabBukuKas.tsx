import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JenisBuku } from '../types';
import { Colors } from '../theme/colors';

interface Props {
  jenisAktif: JenisBuku;
  onPilihJenis: (jenis: JenisBuku) => void;
}

export const TabBukuKas: React.FC<Props> = ({ jenisAktif, onPilihJenis }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          jenisAktif === 'pribadi' && styles.tabButtonActive,
        ]}
        onPress={() => onPilihJenis('pribadi')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={jenisAktif === 'pribadi' ? 'person' : 'person-outline'}
          size={18}
          color={jenisAktif === 'pribadi' ? Colors.textInverse : Colors.textSecondary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.tabText,
            jenisAktif === 'pribadi' && styles.tabTextActive,
          ]}
        >
          Keuangan Pribadi
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          jenisAktif === 'kas' && styles.tabButtonActive,
        ]}
        onPress={() => onPilihJenis('kas')}
        activeOpacity={0.8}
      >
        <Ionicons
          name={jenisAktif === 'kas' ? 'briefcase' : 'briefcase-outline'}
          size={18}
          color={jenisAktif === 'kas' ? Colors.textInverse : Colors.textSecondary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.tabText,
            jenisAktif === 'kas' && styles.tabTextActive,
          ]}
        >
          Kas Pegangan
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
