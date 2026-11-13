
import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { KUNCI_STORAGE_MODE, ATURAN_MODE } from '../constants/configMode';

const AppModeContext = createContext(null);
const JEDA_PENERAPAN_MODE = 180;
const DURASI_TRANSISI_MODE = 400;

export function AppModeProvider({ children }) {
  const [modeAktif, setModeAktif] = useState(() => {
    try {
      return localStorage.getItem(KUNCI_STORAGE_MODE) || 'simple';
    } catch (error) {
      console.error('Gagal memuat mode aplikasi:', error);
      return 'simple';
    }
  });
  const [modeMenunggu, setModeMenunggu] = useState(null);
  const sedangMengubahMode = modeMenunggu !== null;

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_MODE, modeAktif);
    } catch (error) {
      console.error('Gagal menyimpan mode aplikasi:', error);
    }
  }, [modeAktif]);

  useEffect(() => {
    if (!modeMenunggu) return undefined;

    const timerPenerapan = setTimeout(() => {
      setModeAktif(modeMenunggu);
    }, JEDA_PENERAPAN_MODE);
    const timerSelesai = setTimeout(() => {
      setModeMenunggu(null);
    }, DURASI_TRANSISI_MODE);
    return () => {
      clearTimeout(timerPenerapan);
      clearTimeout(timerSelesai);
    };
  }, [modeMenunggu]);

  const value = useMemo(() => {
    const ubahMode = (modeBaru) => {
      if (
        !ATURAN_MODE[modeBaru] ||
        modeBaru === modeAktif ||
        modeMenunggu
      ) return;

      setModeMenunggu(modeBaru);
    };

    return {
      modeAktif,
      ubahMode,
      sedangMengubahMode,
      isSimpleMode: modeAktif === 'simple',
      isFullMode: modeAktif === 'full',
      fitur: ATURAN_MODE[modeAktif] || ATURAN_MODE.simple
    };
  }, [modeAktif, modeMenunggu, sedangMengubahMode]);

  return createElement(AppModeContext.Provider, { value }, children);
}

export function useAppMode() {
  const modeAplikasi = useContext(AppModeContext);
  if (!modeAplikasi) {
    throw new Error('useAppMode harus digunakan di dalam AppModeProvider.');
  }
  return modeAplikasi;
}