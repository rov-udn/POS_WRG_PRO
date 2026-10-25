import React, { useState } from 'react';
import RiwayatPenjualan from './components/RiwayatPenjualan';
import DetailTransaksi from './components/DetailTransaksi';

export default function RiwayatPage() {
  // State untuk menyimpan data transaksi yang sedang dipilih untuk dibuka detailnya
  const [transaksiAktif, setTransaksiAktif] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header Halaman Riwayat */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h2>
        <p className="text-sm text-gray-500">
          Pusat arsip dan penelusuran seluruh catatan transaksi penjualan warung.
        </p>
      </div>

      {/* Komponen Daftar Riwayat Penjualan */}
      <RiwayatPenjualan 
        onPilihTransaksi={(trx) => setTransaksiAktif(trx)} 
      />

      {/* Modal Detail Struk Transaksi */}
      <DetailTransaksi 
        transaksi={transaksiAktif}
        isOpen={!!transaksiAktif}
        onClose={() => setTransaksiAktif(null)}
      />
    </div>
  );
}