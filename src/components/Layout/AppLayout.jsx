import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

const DAFTAR_MENU = [
  { id: 'produk', label: 'Produk', ikon: '📦' },
  { id: 'gudang', label: 'Gudang', ikon: '🏬' },
  { id: 'kasir', label: 'Kasir', ikon: '🛒' },
  { id: 'belanja', label: 'Belanja', ikon: '📝' },
  { id: 'history', label: 'History', ikon: '📜' },
  { id: 'laporan', label: 'Laporan', ikon: '📊' }
];

export default function AppLayout({ children, menuAktif, onPilihMenu }) {
  const menuSaatIni = DAFTAR_MENU.find((m) => m.id === menuAktif);
  const judulHalaman = menuSaatIni ? menuSaatIni.label : 'POS Warung';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar untuk Layar Besar (Desktop) */}
      <Sidebar
        daftarMenu={DAFTAR_MENU}
        menuAktif={menuAktif}
        onPilihMenu={onPilihMenu}
      />

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header judulHalaman={judulHalaman} />

        <main className="flex-1 p-4 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Navigasi Bawah untuk Layar HP (Mobile) */}
      <BottomNavigation
        daftarMenu={DAFTAR_MENU}
        menuAktif={menuAktif}
        onPilihMenu={onPilihMenu}
      />
    </div>
  );
}