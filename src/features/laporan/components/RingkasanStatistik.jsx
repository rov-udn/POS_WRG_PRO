import React from 'react';

export default function RingkasanStatistik({ omzetKotor = 0, totalModal = 0, labaBersih = 0 }) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Kartu Omzet Kotor */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Omzet Kotor</span>
        <h3 className="text-xl font-bold text-gray-800">{formatRupiah(omzetKotor)}</h3>
        <p className="text-[11px] text-gray-400">Seluruh uang masuk dari transaksi penjualan kasir.</p>
      </div>

      {/* Kartu Modal Belanja */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Total Modal Kulakan</span>
        <h3 className="text-xl font-bold text-gray-800">{formatRupiah(totalModal)}</h3>
        <p className="text-[11px] text-gray-400">Akumulasi pengeluaran belanja agen/supplier.</p>
      </div>

      {/* Kartu Laba Bersih */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
        <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Penghasilan Bersih (Laba)</span>
        <h3 className="text-xl font-bold text-green-600">{formatRupiah(labaBersih)}</h3>
        <p className="text-[11px] text-gray-400">Estimasi selisih bersih omzet dikurangi modal.</p>
      </div>
    </div>
  );
}