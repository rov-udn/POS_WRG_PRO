import React, { useCallback, useState } from 'react';
import { useGudang } from './hooks/useGudang';
import DaftarStok from './components/DaftarStok';
import KeranjangRestockModal from './components/KeranjangRestockModal';
import PenyesuaianStokModal from './components/PenyesuaianStokModal';
import RiwayatRestock from './components/RiwayatRestock';
import { useAppMode } from '../../hooks/useAppMode';
import UnpackLogWidget from './components/UnpackLogWidget'; // Sesuaikan path folder jika diperlukan
export default function GudangPage({ role, storeId }) {
  const isAdmin = role === 'admin';
  const { fitur } = useAppMode();
  const [bukaModalKeranjang, setBukaModalKeranjang] = useState(false);
  const bukaModalAntrean = useCallback(() => setBukaModalKeranjang(true), []);
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
    prosesPenyesuaianStok
  } = useGudang({ storeId, onAntreanRestockDiterima: bukaModalAntrean });
  
  const [produkPenyesuaian, setProdukPenyesuaian] = useState(null);
  const tabEfektif = isAdmin ? tabAktif : 'stok';

  return (
    <div className="space-y-4">
      {/* Tab Navigasi */}
      <div className="flex border-b bg-white rounded-t-lg overflow-x-auto shadow-sm">
        <button
          onClick={() => setTabAktif('stok')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tabEfektif === 'stok' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📦 Stok Terkini
        </button>
        {isAdmin && (
          <button
            onClick={() => setTabAktif('riwayat')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabEfektif === 'riwayat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            📜 Riwayat Log Gudang
          </button>
        )}
      </div>

      <div className="my-4">
        <UnpackLogWidget storeId={storeId} />
      </div>

      {/* Konten Tab */}
      <div className="pt-2">
        {tabEfektif === 'stok' && (
          <DaftarStok
            daftarProduk={daftarProduk}
            keranjangRestock={keranjangRestock}
            bolehKelolaStok={isAdmin}
            onTambahKeKeranjang={tambahKeKeranjangRestock}
            onBukaKeranjang={isAdmin ? () => setBukaModalKeranjang(true) : undefined}
            onBukaPenyesuaian={isAdmin ? (produk) => setProdukPenyesuaian(produk) : undefined}
          />
        )}
        {isAdmin && tabEfektif === 'riwayat' && (
          <RiwayatRestock riwayatRestock={riwayatRestock} />
        )}
      </div>

      {/* Modal Keranjang Restock Massal */}
      {isAdmin && (
        <KeranjangRestockModal
          isOpen={bukaModalKeranjang}
          onClose={() => setBukaModalKeranjang(false)}
          keranjang={keranjangRestock}
          onUbahItem={ubahItemKeranjang}
          onHapusItem={hapusItemKeranjang}
          onProsesMassal={prosesRestockMassal}
        />
      )}

      {/* Modal Penyesuaian Stok (Rusak/Expired/Hilang) */}
      {isAdmin && fitur.ubahStok && produkPenyesuaian && (
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