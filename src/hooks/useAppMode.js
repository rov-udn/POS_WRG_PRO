
import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { KUNCI_STORAGE_MODE, ATURAN_MODE } from '../constants/configMode';

const AppModeContext = createContext(null);

export function AppModeProvider({ children }) {
  const [modeAktif, setModeAktif] = useState(() => {
    try {
      return localStorage.getItem(KUNCI_STORAGE_MODE) || 'simple';
    } catch (error) {
      console.error('Gagal memuat mode aplikasi:', error);
      return 'simple';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_MODE, modeAktif);
    } catch (error) {
      console.error('Gagal menyimpan mode aplikasi:', error);
    }
  }, [modeAktif]);

  const value = useMemo(() => {
    const ubahMode = (modeBaru) => {
      if (ATURAN_MODE[modeBaru]) {
        setModeAktif(modeBaru);
      }
    };

    return {
      modeAktif,
      ubahMode,
      isSimpleMode: modeAktif === 'simple',
      isFullMode: modeAktif === 'full',
      fitur: ATURAN_MODE[modeAktif] || ATURAN_MODE.simple
    };
  }, [modeAktif]);

  return createElement(AppModeContext.Provider, { value }, children);
}

export function useAppMode() {
  const modeAplikasi = useContext(AppModeContext);
  if (!modeAplikasi) {
    throw new Error('useAppMode harus digunakan di dalam AppModeProvider.');
  }
  return modeAplikasi;
}