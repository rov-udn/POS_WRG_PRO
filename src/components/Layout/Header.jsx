import React, { useEffect, useState } from 'react';
import { useAppMode } from '../../hooks/useAppMode';

export default function Header({
  judulHalaman,
  namaToko,
  namaPengguna,
  labelRole,
  onKeluar,
  onTutupShift,
  isKasir,
  statusSinkronisasiTransaksi = {},
  onKirimAntreanTransaksi
}) {
  const { isSimpleMode, ubahMode, sedangMengubahMode } = useAppMode();
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine
  );
  const [tampilPanelSync, setTampilPanelSync] = useState(false);
  const {
    pending = 0,
    syncing = 0,
    synced = 0,
    failed = 0,
    error = false
  } = statusSinkronisasiTransaksi;
  const jumlahPerluKirim = pending + failed;
  const labelStatusSync = error
    ? 'Status data bermasalah'
    : syncing > 0
      ? `Mengirim ${syncing}${pending > 0 ? ` · ${pending} menunggu` : ''}`
      : pending > 0 && failed > 0
        ? `${pending} menunggu · ${failed} gagal`
        : pending > 0
          ? `${pending} menunggu`
          : failed > 0
            ? `${failed} gagal`
            : synced > 0
              ? 'Semua tersinkron'
              : 'Belum ada transaksi';
  const warnaStatusSync = error || failed > 0
    ? 'border-red-200 bg-red-50 text-red-700'
    : pending > 0
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : syncing > 0
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-green-200 bg-green-50 text-green-700';

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
        <div className="relative mt-1 flex min-w-0 items-center gap-1.5">
          <span
            role="status"
            aria-live="polite"
            className={`inline-flex min-h-7 shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-medium sm:text-xs ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <button
            type="button"
            aria-label={`Status pengiriman transaksi: ${labelStatusSync}. Buka detail sinkronisasi.`}
            aria-expanded={tampilPanelSync}
            onClick={() => setTampilPanelSync((terbuka) => !terbuka)}
            className={`inline-flex min-h-7 max-w-[min(60vw,15rem)] items-center rounded-full border px-2 py-1 text-[10px] font-semibold sm:text-xs ${warnaStatusSync}`}
          >
            <span className="truncate" aria-live="polite">{labelStatusSync}</span>
          </button>
          {tampilPanelSync && (
            <section
              role="dialog"
              aria-label="Status sinkronisasi transaksi"
              className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-800">Sinkronisasi transaksi</h2>
                <button
                  type="button"
                  aria-label="Tutup status sinkronisasi"
                  onClick={() => setTampilPanelSync(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <p className="mb-3 text-xs text-gray-600">
                Koneksi {isOnline ? 'online' : 'offline'} · Pengiriman otomatis berjalan saat internet tersedia.
              </p>
              {error && (
                <p role="alert" className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  Status antrean tidak dapat dibaca. Periksa penyimpanan lokal.
                </p>
              )}
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-amber-50 p-2">
                  <dt className="text-amber-800">Menunggu dikirim</dt>
                  <dd className="font-bold text-amber-900">{pending}</dd>
                </div>
                <div className="rounded-lg bg-blue-50 p-2">
                  <dt className="text-blue-800">Sedang dikirim</dt>
                  <dd className="font-bold text-blue-900">{syncing}</dd>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <dt className="text-red-800">Gagal dikirim</dt>
                  <dd className="font-bold text-red-900">{failed}</dd>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <dt className="text-green-800">Sudah tersinkron</dt>
                  <dd className="font-bold text-green-900">{synced}</dd>
                </div>
              </dl>
              {jumlahPerluKirim > 0 && (
                <button
                  type="button"
                  onClick={onKirimAntreanTransaksi}
                  disabled={!isOnline || syncing > 0 || error}
                  aria-busy={syncing > 0}
                  className="mt-3 min-h-10 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {syncing > 0
                    ? 'Sedang mengirim...'
                    : `Kirim ${jumlahPerluKirim} transaksi sekarang`}
                </button>
              )}
              {!isOnline && (
                <p className="mt-2 text-xs text-gray-500">
                  Tombol kirim tersedia kembali setelah perangkat online.
                </p>
              )}
            </section>
          )}
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
          aria-busy={sedangMengubahMode}
          disabled={sedangMengubahMode}
          onClick={() => ubahMode(isSimpleMode ? 'full' : 'simple')}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSimpleMode ? 'bg-gray-300' : 'bg-blue-600'
          }`}
        >
          {sedangMengubahMode ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          ) : (
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSimpleMode ? 'translate-x-1' : 'translate-x-6'
              }`}
            />
          )}
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