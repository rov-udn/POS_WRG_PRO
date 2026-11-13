import React, { useEffect, useState } from 'react';
import { useAppMode } from '../../hooks/useAppMode';

export default function Header({
  judulHalaman,
  namaToko,
  namaPengguna,
  labelRole,
  onKeluar,
  onTutupShift,
  isKasir
}) {
  const { isSimpleMode, ubahMode } = useAppMode();
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine
  );

  useEffect(() => {
    const tandaiOnline = () => setIsOnline(true);
    const tandaiOffline = () => setIsOnline(false);

    window.addEventListener('online', tandaiOnline);
    window.addEventListener('offline', tandaiOffline);
    return () => {
      window.removeEventListener('online', tandaiOnline);
      window.removeEventListener('offline', tandaiOffline);
    };
  }, []);

  return (
    <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex justify-between items-center gap-2 shadow-sm">
      <div className="min-w-0 flex-1">
        {/* Nama Toko sekarang jadi judul utama yang tebal dan besar */}
        <h1 className="truncate text-lg font-bold text-gray-800" title={namaToko}>
          {namaToko || 'POS Warung'}
        </h1>
        {/* Nama Menu (Produk, Gudang, dll) pindah ke bawah dengan ukuran lebih kecil */}
        <p className="truncate text-xs font-medium text-gray-500">
          {judulHalaman}
        </p>
        <div className="flex min-w-0 items-center gap-1 sm:hidden">
          <span className="truncate text-[10px] font-medium text-gray-700">
            {namaPengguna}
          </span>
          <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
            {labelRole}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-2">
        <div className="hidden max-w-36 flex-col items-end sm:flex">
          <span className="max-w-full truncate text-xs font-medium text-gray-700">
            {namaPengguna}
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            {labelRole}
          </span>
        </div>
        <span className={`text-[10px] font-medium sm:text-xs ${isSimpleMode ? 'text-blue-700' : 'text-gray-500'}`}>
          Sederhana
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={!isSimpleMode}
          aria-label="Mode aplikasi"
          onClick={() => ubahMode(isSimpleMode ? 'full' : 'simple')}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSimpleMode ? 'bg-gray-300' : 'bg-blue-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSimpleMode ? 'translate-x-1' : 'translate-x-6'
            }`}
          />
        </button>
        <span className={`text-[10px] font-medium sm:text-xs ${!isSimpleMode ? 'text-blue-700' : 'text-gray-500'}`}>
          Full
        </span>
        {isKasir && (
          <button
            type="button"
            onClick={onTutupShift}
            aria-label="Tutup Shift"
            title="Tutup Shift"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-base text-red-700 transition hover:bg-red-100 md:hidden"
          >
            ⏹
          </button>
        )}
        <span
          role="status"
          aria-live="polite"
          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium sm:px-2.5 sm:text-xs ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <button
          type="button"
          onClick={onKeluar}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-3 sm:text-sm"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}