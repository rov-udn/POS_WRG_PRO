import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { AppModeProvider, useAppMode } from '../../hooks/useAppMode';
import useMenuNotifications from '../../hooks/useMenuNotifications';
import { useSettings } from '../../features/setting/hooks/useSettings';
import EndShiftModal from '../../features/kasir/components/EndShiftModal';
import { mulaiShiftJikaBelumAda, tutupShift } from '../../features/laporan/utils/shiftStorage';
import { sinkronkanProdukPending } from '../../lib/services/produkSyncService';

const DAFTAR_MENU = [
  { id: 'produk', label: 'Produk', ikon: '📦' },
  { id: 'gudang', label: 'Gudang', ikon: '🏬' },
  { id: 'kasir', label: 'Kasir', ikon: '🛒' },
  { id: 'belanja', label: 'Belanja', ikon: '📝' },
  { id: 'history', label: 'Riwayat', ikon: '📜' },
  { id: 'laporan', label: 'Laporan', ikon: '📊' },
  { id: 'setting', label: 'Pengaturan', ikon: '⚙️' },
  { id: 'approval', label: 'Approval', ikon: '✅' }
];

export default function AppLayout({
  children,
  menuAktif,
  onPilihMenu,
  daftarMenuDiizinkan,
  profil,
  pengguna,
  onKeluar
}) {
  const [modalTutupShift, setModalTutupShift] = useState(false);
  const [pesanErrorShift, setPesanErrorShift] = useState('');
  const daftarMenu = DAFTAR_MENU.filter((menu) => daftarMenuDiizinkan.includes(menu.id));
  const menuSaatIni = daftarMenu.find((menu) => menu.id === menuAktif);
  const judulHalaman = menuSaatIni ? menuSaatIni.label : 'POS Warung';
  const { settings } = useSettings();
  const notifikasi = useMenuNotifications(profil.store_id);
  const daftarMenuDenganNotifikasi = daftarMenu.map((menu) => {
    if (menu.id === 'belanja') {
      return {
        ...menu,
        badgeCount: notifikasi.belanja,
        badgeLabel: `${notifikasi.belanja} draf belanja belum diselesaikan`
      };
    }
    if (menu.id === 'gudang') {
      return {
        ...menu,
        badgeCount: notifikasi.gudang,
        badgeLabel: `${notifikasi.gudang} tugas gudang atau produk perlu ditindaklanjuti`
      };
    }
    if (menu.id === 'produk') {
      return {
        ...menu,
        badgeCount: notifikasi.produk,
        badgeLabel: `${notifikasi.produk} produk perlu dilengkapi atau diperiksa harganya`
      };
    }
    if (menu.id === 'setting') {
      return {
        ...menu,
        badgeDot: notifikasi.setting,
        badgeLabel: 'Informasi profil toko belum lengkap'
      };
    }
    return menu;
  });
  const namaToko = settings.profil.namaToko;
  const namaPengguna = profil.nama || profil.email || 'Pengguna';
  const labelRole = profil.role === 'super_admin'
    ? 'Super Admin'
    : profil.role === 'admin'
      ? 'Admin'
      : 'Karyawan';
  const isKasir = profil.role === 'karyawan';

  useEffect(() => {
    if (!profil?.store_id) return undefined;

    const cobaSinkronkanProduk = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      sinkronkanProdukPending(profil.store_id).catch((error) => {
        console.error('Gagal melanjutkan sinkronisasi produk tertunda.', error);
      });
    };

    window.addEventListener('online', cobaSinkronkanProduk);
    cobaSinkronkanProduk();
    return () => window.removeEventListener('online', cobaSinkronkanProduk);
  }, [profil?.store_id]);

  useEffect(() => {
    if (!isKasir || !pengguna?.uid) return;
    try {
      mulaiShiftJikaBelumAda(pengguna.uid, namaPengguna);
    } catch (error) {
      console.error('Gagal menyiapkan shift kasir:', error);
    }
  }, [isKasir, pengguna?.uid, namaPengguna]);

  const simpanDanTutupShift = (cashActual) => {
    tutupShift({ idKasir: pengguna.uid, cashActual });
  };
  const bukaModalTutupShift = () => {
    try {
      mulaiShiftJikaBelumAda(pengguna.uid, namaPengguna);
      setPesanErrorShift('');
      setModalTutupShift(true);
    } catch (error) {
      console.error('Gagal membuka proses tutup shift:', error);
      setPesanErrorShift('Shift belum dapat disiapkan. Periksa penyimpanan sebelum melanjutkan.');
    }
  };

  return (
    <AppModeProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar untuk Layar Besar (Desktop) */}
        <Sidebar
          namaToko={namaToko}
          daftarMenu={daftarMenuDenganNotifikasi}
          menuAktif={menuAktif}
          onPilihMenu={onPilihMenu}
          namaPengguna={namaPengguna}
          labelRole={labelRole}
          onKeluar={onKeluar}
          onTutupShift={bukaModalTutupShift}
          isKasir={isKasir}
        />

        {/* Konten Utama */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header
            judulHalaman={judulHalaman}
            namaToko={namaToko}
            namaPengguna={namaPengguna}
            labelRole={labelRole}
            onKeluar={onKeluar}
            onTutupShift={bukaModalTutupShift}
            isKasir={isKasir}
          />

          <main className="flex-1 p-4 max-w-5xl w-full mx-auto">
            {pesanErrorShift && isKasir && (
              <p role="alert" className="mb-4 text-sm text-red-700">{pesanErrorShift}</p>
            )}
            {children}
          </main>
        </div>

        {/* Navigasi Bawah untuk Layar HP (Mobile) */}
        <BottomNavigation
          daftarMenu={daftarMenuDenganNotifikasi}
          menuAktif={menuAktif}
          onPilihMenu={onPilihMenu}
        />
        {isKasir && (
          <EndShiftModal
            key={modalTutupShift ? 'open' : 'closed'}
            isOpen={modalTutupShift}
            onClose={() => setModalTutupShift(false)}
            onLogout={onKeluar}
            onSimpan={simpanDanTutupShift}
          />
        )}
        <ModeTransitionOverlay />
      </div>
    </AppModeProvider>
  );
}


function ModeTransitionOverlay() {
  const { sedangMengubahMode } = useAppMode();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!sedangMengubahMode}
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-gray-50/90 backdrop-blur-sm transition-opacity duration-150 ${
        sedangMengubahMode ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {sedangMengubahMode && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg">
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"
          />
          <span className="text-sm font-semibold text-gray-700">
            Menyesuaikan mode aplikasi...
          </span>
        </div>
      )}
    </div>
  );
}