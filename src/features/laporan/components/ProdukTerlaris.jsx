import React from 'react';

export default function ProdukTerlaris({ produkList = [] }) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
      <div className="border-b pb-2">
        <h4 className="font-bold text-gray-800 text-sm">Produk Terlaris & Margin Keuntungan</h4>
        <p className="text-[11px] text-gray-400">Barang terlaris beserta estimasi kontribusi laba bersihnya untuk warung.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
              <th className="p-2.5">No</th>
              <th className="p-2.5">Nama Produk</th>
              <th className="p-2.5 text-center">Terjual</th>
              <th className="p-2.5 text-right">Total Pendapatan</th>
              <th className="p-2.5 text-right">Estimasi Laba</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produkList.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2.5 text-gray-500 font-medium">{idx + 1}</td>
                <td className="p-2.5 font-semibold text-gray-800">{item.namaProduk}</td>
                <td className="p-2.5 text-center text-gray-600">{item.totalQty} pcs</td>
                <td className="p-2.5 text-right font-medium text-gray-700">{formatRupiah(item.totalOmzet)}</td>
                <td className="p-2.5 text-right font-bold text-green-600">
                  {formatRupiah(item.estimasiLaba)}
                </td>
              </tr>
            ))}
            {produkList.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400">
                  Belum ada data produk terjual untuk ditampilkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}