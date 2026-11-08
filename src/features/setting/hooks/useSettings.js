import { useCallback, useEffect, useState } from 'react';

const KUNCI_STORAGE_SETTINGS = 'pos_wrg_settings';

export const DEFAULT_SETTINGS = {
  profil: {
    namaToko: 'Warung Saya',
    alamat: '',
    noTelp: ''
  },
  nota: {
    ukuranKertas: '58mm',
    pesanFooter: 'Terima Kasih Atas Kunjungan Anda',
    tampilkanLogo: false
  },

  pajakLayanan: {
    aktifkanPajak: false,
    persentasePajak: 0, // misal 10%
    aktifkanBiayaLayanan: false,
    namaBiayaLayanan: 'Biaya Bungkus / Lainnya',
    nominalBiayaLayanan: 0
  },

  perangkat: {
    tipePrinter: 'bluetooth', // bluetooth / usb / network
    lebarKertas: '58mm',     // 58mm atau 80mm
    autoCetakStruk: true
  },
  
  sistem: {
    modeOffline: true,
    peringatanStokTipis: 5
  }
};

function gabungkanSettings(settingsAwal, settingsBaru = {}) {
  return {
    ...settingsAwal,
    ...settingsBaru,
    profil: { ...settingsAwal.profil, ...settingsBaru.profil },
    nota: { ...settingsAwal.nota, ...settingsBaru.nota },
    sistem: { ...settingsAwal.sistem, ...settingsBaru.sistem }
  };
}

function ambilSettings() {
  try {
    const dataTersimpan = localStorage.getItem(KUNCI_STORAGE_SETTINGS);
    return dataTersimpan
      ? gabungkanSettings(DEFAULT_SETTINGS, JSON.parse(dataTersimpan))
      : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Gagal memuat pengaturan dari localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(ambilSettings);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Gagal menyimpan pengaturan ke localStorage:', error);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((settingsSaatIni) => gabungkanSettings(settingsSaatIni, newSettings));
  }, []);

  return { settings, updateSettings };
}
