import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { AppModeProvider } from '../../hooks/useAppMode';
import { useSettings } from '../../features/setting/hooks/useSettings';

const DAFTAR_MENU = [
  { id: 'produk', label: 'Produk', ikon: '📦' },
  { id: 'gudang', label: 'Gudang', ikon: '🏬' },
  { id: 'kasir', label: 'Kasir', ikon: '🛒' },
  { id: 'belanja', label: 'Belanja', ikon: '📝' },
  { id: 'history', label: 'Riwayat', ikon: '📜' },
  { id: 'laporan', label: 'Laporan', ikon: '📊' },
  { id: 'setting', label: 'Pengaturan', ikon: '⚙️' }
];

export default function AppLayout({
  children,
  menuAktif,
  onPilihMenu,
  daftarMenuDiizinkan,
  profil,
  onKeluar
}) {
  const daftarMenu = DAFTAR_MENU.filter((menu) => daftarMenuDiizinkan.includes(menu.id));
  const menuSaatIni = daftarMenu.find((menu) => menu.id === menuAktif);
  const judulHalaman = menuSaatIni ? menuSaatIni.label : 'POS Warung';
  const { settings } = useSettings();
  const namaToko = settings.profil.namaToko;
  const namaPengguna = profil.nama || profil.email || 'Pengguna';
  const labelRole = profil.role === 'admin' ? 'Admin' : 'Karyawan';

  return (
    <AppModeProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar untuk Layar Besar (Desktop) */}
        <Sidebar
          namaToko={namaToko}
          daftarMenu={daftarMenu}
          menuAktif={menuAktif}
          onPilihMenu={onPilihMenu}
          namaPengguna={namaPengguna}
          labelRole={labelRole}
          onKeluar={onKeluar}
        />

        {/* Konten Utama */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header
            judulHalaman={judulHalaman}
            namaToko={namaToko}
            namaPengguna={namaPengguna}
            labelRole={labelRole}
            onKeluar={onKeluar}
          />

          <main className="flex-1 p-4 max-w-5xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Navigasi Bawah untuk Layar HP (Mobile) */}
        <BottomNavigation
          daftarMenu={daftarMenu}
          menuAktif={menuAktif}
          onPilihMenu={onPilihMenu}
        />
      </div>
    </AppModeProvider>
  );
}