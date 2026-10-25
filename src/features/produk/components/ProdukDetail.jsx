import React from 'react';
import { formatRupiah, formatStokUtama } from '../utils/produkUtils';
import { hitungMarginPersen } from '../utils/produkUtils';



export default function ProdukDetail({ produk, onTutup }) {
  if (!produk) return null;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-bold">{produk.namaProduk}</h3>
        {onTutup && (
          <button
            onClick={onTutup}
            className="text-gray-500 hover:text-gray-700 font-semibold text-sm"
          >
            Tutup
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Kategori:</span> {produk.kategori}
        </div>
        <div>
          <span className="text-gray-500">Stok Utama:</span>{' '}
          {formatStokUtama(produk.stokUtama, produk.satuanTerkecil)}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2">Daftar Satuan:</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2">Satuan</th>
                <th className="p-2">Barcode</th>
                <th className="p-2">Harga Beli</th>
                <th className="p-2">Harga Jual</th>
                <th className="p-2">Rasio</th>
                <th className="p-2">Margin %</th>
                <th className="p-2">Untung</th>
                <th className="p-2">Base</th>
              </tr>
            </thead>
            <tbody>
              {produk.listSatuan?.map((satuan) => {
                const margin = hitungMarginPersen(satuan.hargaBeli, satuan.hargaJual);
                const selisihRupiah = (satuan.hargaJual || 0) - (satuan.hargaBeli || 0);

                return (
                  <tr key={satuan.idSatuan} className="border-b">
                    <td className="p-2 font-medium">{satuan.namaSatuan}</td>
                    <td className="p-2">{satuan.barcode || '-'}</td>
                    <td className="p-2">{formatRupiah(satuan.hargaBeli)}</td>
                    <td className="p-2">{formatRupiah(satuan.hargaJual)}</td>
                    <td className="p-2">{satuan.rasio}</td>

                    {/* Tampilan Margin Persen */}
                    <td className="p-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-semibold">
                        {margin}%
                      </span>
                    </td>

                    {/* Tampilan Keuntungan Rupiah */}
                    <td className="p-2 font-semibold text-blue-600">
                      {formatRupiah(selisihRupiah)}
                    </td>

                    <td className="p-2">{satuan.isBase ? 'Ya' : 'Tidak'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}