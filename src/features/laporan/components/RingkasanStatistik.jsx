import React from 'react';

export default function RingkasanStatistik({
  omzetKotor = 0
}) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Kartu Omzet Kotor */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pendapatan Bersih</span>
        <h3 className="text-xl font-bold text-gray-800">{formatRupiah(omzetKotor)}</h3>
        <p className="text-[11px] text-gray-400">Nilai transaksi penjualan setelah memperhitungkan retur/tukar.</p>
      </div>
    </div>
  );
}