import React from 'react';

export default function RekapPembayaran({ totalTunai = 0, totalNonTunai = 0, transaksiCount = 0 }) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const totalPembayaran = totalTunai + totalNonTunai;
  const persenTunai = totalPembayaran > 0 ? Math.round((totalTunai / totalPembayaran) * 100) : 0;
  const persenNonTunai = totalPembayaran > 0 ? Math.round((totalNonTunai / totalPembayaran) * 100) : 0;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Rekap Arus Kasir</h4>
          <p className="text-[11px] text-gray-400">Rincian metode pembayaran dari {transaksiCount} transaksi.</p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
          Total: {formatRupiah(totalPembayaran)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Jalur Tunai / Cash */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-100 space-y-1">
          <div className="flex justify-between items-center text-green-800 font-semibold">
            <span>Uang Tunai (Laci Kasir)</span>
            <span>{persenTunai}%</span>
          </div>
          <p className="text-lg font-bold text-green-700">{formatRupiah(totalTunai)}</p>
          <p className="text-[10px] text-green-600">Uang fisik yang harus ada di laci.</p>
        </div>

        {/* Jalur Non-Tunai / Digital */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
          <div className="flex justify-between items-center text-blue-800 font-semibold">
            <span>Non-Tunai (QRIS / Transfer)</span>
            <span>{persenNonTunai}%</span>
          </div>
          <p className="text-lg font-bold text-blue-700">{formatRupiah(totalNonTunai)}</p>
          <p className="text-[10px] text-blue-600">Uang masuk langsung ke rekening/e-wallet.</p>
        </div>
      </div>
    </div>
  );
}