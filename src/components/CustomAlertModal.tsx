import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CustomAlertOptions,
  setCustomAlertListener,
} from '../utils/customAlert';
import { Colors } from '../theme/colors';

export const CustomAlertModal: React.FC = () => {
  const [alertConfig, setAlertConfig] = useState<CustomAlertOptions | null>(null);

  useEffect(() => {
    setCustomAlertListener((config) => {
      setAlertConfig(config);
    });

    return () => {
      setCustomAlertListener(null);
    };
  }, []);

  if (!alertConfig) return null;

  const { title, message, buttons = [], type = 'info' } = alertConfig;

  const handleTutup = () => {
    setAlertConfig(null);
  };

  // Konfigurasi Ikon & Warna sesuai Tipe Alert
  const getIconConfig = () => {
    const lowerTitle = title.toLowerCase();
    const isDelete =
      lowerTitle.includes('hapus') ||
      lowerTitle.includes('kosongkan') ||
      buttons.some((b) => b.style === 'destructive');

    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#16A34A',
          bgColor: '#DCFCE7',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#DC2626',
          bgColor: '#FEE2E2',
        };
      case 'warning':
        return {
          icon: isDelete ? ('trash-outline' as const) : ('warning' as const),
          color: '#DC2626',
          bgColor: '#FEE2E2',
        };
      case 'confirm':
        return {
          icon: isDelete ? ('trash-outline' as const) : ('help-circle' as const),
          color: isDelete ? '#DC2626' : '#D97706',
          bgColor: isDelete ? '#FEE2E2' : '#FEF3C7',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: Colors.primary,
          bgColor: '#EFF6FF',
        };
    }
  };

  const iconCfg = getIconConfig();

  // Tentukan apakah tombol disusun vertikal atau horizontal
  const isStacked =
    buttons.length > 2 || buttons.some((b) => (b.text || '').length > 13);

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleTutup}
    >
      <Pressable style={styles.backdrop} onPress={handleTutup}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Ikon Lingkaran Cantik */}
          <View style={[styles.iconWrapper, { backgroundColor: iconCfg.bgColor }]}>
            <Ionicons name={iconCfg.icon} size={30} color={iconCfg.color} />
          </View>

          {/* Judul & Pesan */}
          <Text style={styles.titleText}>{title}</Text>
          {!!message && <Text style={styles.messageText}>{message}</Text>}

          {/* Tombol Aksi */}
          <View
            style={[
              styles.buttonsContainer,
              isStacked ? styles.buttonsStacked : styles.buttonsRow,
            ]}
          >
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.buttonBase,
                    !isStacked && styles.buttonFlex,
                    isCancel
                      ? styles.buttonCancel
                      : isDestructive
                      ? styles.buttonDestructive
                      : styles.buttonPrimary,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleTutup();
                    if (btn.onPress) {
                      // Beri sedikit jeda mikro agar modal menutup halus sebelum aksi dijalankan
                      setTimeout(() => {
                        btn.onPress?.();
                      }, 50);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel
                        ? styles.buttonTextCancel
                        : styles.buttonTextSolid,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 13.5,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  buttonsContainer: {
    width: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonsStacked: {
    flexDirection: 'column-reverse',
    gap: 10,
  },
  buttonBase: {
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonDestructive: {
    backgroundColor: '#DC2626',
  },
  buttonCancel: {
    backgroundColor: '#F1F5F9',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextSolid: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#64748B',
  },
});
