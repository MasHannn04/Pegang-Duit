import { Alert } from 'react-native';

export type AlertStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertStyle;
  onPress?: () => void;
}

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface CustomAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: AlertType;
}

type AlertListener = (options: CustomAlertOptions | null) => void;

let currentListener: AlertListener | null = null;

export const setCustomAlertListener = (listener: AlertListener | null) => {
  currentListener = listener;
};

/**
 * Pengganti Alert.alert bawaan sistem Android/iOS.
 * Menggunakan tampilan modal modern yang serasi dengan tema Pegang Duit.
 */
export const tampilkanAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  tipeManual?: AlertType
): void => {
  if (currentListener) {
    // Deteksi tipe otomatis jika tidak ditentukan
    let tipe: AlertType = tipeManual || 'info';
    if (!tipeManual) {
      const lowerTitle = title.toLowerCase();
      if (
        lowerTitle.includes('sukses') ||
        lowerTitle.includes('berhasil') ||
        lowerTitle.includes('tersimpan') ||
        lowerTitle.includes('selesai')
      ) {
        tipe = 'success';
      } else if (
        lowerTitle.includes('gagal') ||
        lowerTitle.includes('error') ||
        lowerTitle.includes('salah')
      ) {
        tipe = 'error';
      } else if (
        lowerTitle.includes('hapus') ||
        lowerTitle.includes('kosongkan') ||
        buttons?.some((b) => b.style === 'destructive')
      ) {
        tipe = 'warning';
      } else if (
        lowerTitle.includes('konfirmasi') ||
        lowerTitle.includes('perhatian') ||
        (buttons && buttons.length > 1)
      ) {
        tipe = 'confirm';
      }
    }

    currentListener({
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'Mengerti', style: 'default' }],
      type: tipe,
    });
  } else {
    // Fallback jika modal belum ter-mount
    Alert.alert(title, message, buttons);
  }
};
