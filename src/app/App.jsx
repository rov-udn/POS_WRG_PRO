import React, { useState } from 'react';
import AppLayout from '../components/Layout/AppLayout';
import ProdukPage from '../features/produk/produkPage';
import GudangPage from '../features/gudang/GudangPage';
import KasirPage from '../features/kasir/KasirPage';
import BelanjaPage from '../features/belanja/BelanjaPage';
import RiwayatPage from '../features/riwayat/RiwayatPage';
import LaporanPage from '../features/laporan/LaporanPage';

export default function App() {
  const [menuAktif, setMenuAktif] = useState('produk');

  const renderHalaman = () => {
    switch (menuAktif) {
      case 'belanja':
        return <BelanjaPage />;
      case 'kasir':
        return <KasirPage />;
      case 'produk':
        return <ProdukPage />;
      case 'gudang':
        return <GudangPage />;
      case 'history':
        return <RiwayatPage />;
      case 'laporan':
        return <LaporanPage />;
      default:
        return (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500 shadow-sm">
            <h2 className="text-lg font-bold text-gray-700 mb-2">Fitur Belum Tersedia</h2>
            <p className="text-sm">Halaman ini sedang dalam tahap pengembangan.</p>
          </div>
        );
    }
  };

  return (
    <AppLayout menuAktif={menuAktif} onPilihMenu={setMenuAktif}>
      {renderHalaman()}
    </AppLayout>
  );
}