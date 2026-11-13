import React, { useState } from 'react';
import RiwayatPenjualan from './components/RiwayatPenjualan';
import DetailTransaksi from './components/DetailTransaksi';
import RiwayatRetur from './components/RiwayatRetur';

export default function RiwayatPage({ profil, pengguna }) {
  // State untuk menyimpan data transaksi yang sedang dipilih untuk dibuka detailnya
  const [transaksiAktif, setTransaksiAktif] = useState(null);
  const [tabAktif, setTabAktif] = useState('penjualan');

  return (
    <div className="space-y-6">
      {/* Header Halaman Riwayat */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h2>
        <p className="text-sm text-gray-500">
          Pusat arsip dan penelusuran transaksi penjualan, retur, dan tukar barang.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTabAktif('penjualan')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold ${
            tabAktif === 'penjualan'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Penjualan
        </button>
        <button
          type="button"
          onClick={() => setTabAktif('retur')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold ${
            tabAktif === 'retur'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Retur & Tukar
        </button>
      </div>

      {tabAktif === 'penjualan' ? (
        <RiwayatPenjualan
          onPilihTransaksi={(trx) => setTransaksiAktif(trx)}
        />
      ) : (
        <RiwayatRetur storeId={profil?.store_id} pengguna={pengguna} />
      )}

      {/* Modal Detail Struk Transaksi */}
      <DetailTransaksi 
        transaksi={transaksiAktif}
        isOpen={!!transaksiAktif}
        onClose={() => setTransaksiAktif(null)}
      />
    </div>
  );
}