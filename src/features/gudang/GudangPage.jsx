import React, { useState } from 'react';
import { useGudang } from './hooks/useGudang';
import DaftarStok from './components/DaftarStok';
import KeranjangRestockModal from './components/KeranjangRestockModal';
import PenyesuaianStokModal from './components/PenyesuaianStokModal';
import RiwayatRestock from './components/RiwayatRestock';

export default function GudangPage() {
  const {
    tabAktif,
    setTabAktif,
    daftarProduk,
    riwayatRestock,
    keranjangRestock,
    tambahKeKeranjangRestock,
    ubahItemKeranjang,
    hapusItemKeranjang,
    prosesRestockMassal,
    prosesPenyesuaianStok // Gunakan fungsi penyesuaian dari hook
  } = useGudang();
  
  const [bukaModalKeranjang, setBukaModalKeranjang] = useState(false);
  const [produkPenyesuaian, setProdukPenyesuaian] = useState(null);

  return (
    <div className="space-y-4">
      {/* Tab Navigasi */}
      <div className="flex border-b bg-white rounded-t-lg overflow-x-auto shadow-sm">
        <button
          onClick={() => setTabAktif('stok')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tabAktif === 'stok' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📦 Stok Terkini
        </button>
        <button
          onClick={() => setTabAktif('riwayat')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tabAktif === 'riwayat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📜 Riwayat Log Gudang
        </button>
      </div>

      {/* Konten Tab */}
      <div className="pt-2">
        {tabAktif === 'stok' && (
          <DaftarStok
            daftarProduk={daftarProduk}
            keranjangRestock={keranjangRestock}
            onTambahKeKeranjang={tambahKeKeranjangRestock}
            onBukaKeranjang={() => setBukaModalKeranjang(true)}
            onBukaPenyesuaian={(produk) => setProdukPenyesuaian(produk)}
          />
        )}
        {tabAktif === 'riwayat' && <RiwayatRestock riwayatRestock={riwayatRestock} />}
      </div>

      {/* Modal Keranjang Restock Massal */}
      <KeranjangRestockModal
        isOpen={bukaModalKeranjang}
        onClose={() => setBukaModalKeranjang(false)}
        keranjang={keranjangRestock}
        onUbahItem={ubahItemKeranjang}
        onHapusItem={hapusItemKeranjang}
        onProsesMassal={prosesRestockMassal}
      />

      {/* Modal Penyesuaian Stok (Rusak/Expired/Hilang) */}
      {produkPenyesuaian && (
        <PenyesuaianStokModal
          isOpen={Boolean(produkPenyesuaian)}
          onClose={() => setProdukPenyesuaian(null)}
          produk={produkPenyesuaian}
          onSubmitPenyesuaian={prosesPenyesuaianStok}
        />
      )}
    </div>
  );
}