import React, { useState } from 'react';

export default function DaftarStok({
  daftarProduk,
  keranjangRestock,
  onTambahKeKeranjang,
  onBukaKeranjang,
  onBukaPenyesuaian // <-- Callback baru
}) {
  const [kataKunci, setKataKunci] = useState('');

  const produkTersaring = daftarProduk.filter((item) =>
    item.namaProduk.toLowerCase().includes(kataKunci.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Tombol Floating Keranjang */}
      <div className="flex justify-between items-center gap-2">
        <input
          type="text"
          placeholder="Cari barang..."
          value={kataKunci}
          onChange={(e) => setKataKunci(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs"
        />

        <button
          onClick={onBukaKeranjang}
          className="relative bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <span>🛒 Keranjang Restock</span>
          {keranjangRestock.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {keranjangRestock.length}
            </span>
          )}
        </button>
      </div>

      {/* Tabel Stok */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
              <th className="p-3">Nama Produk</th>
              <th className="p-3">Kategori</th>
              <th className="p-3 text-right">Stok Utama</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {produkTersaring.map((item) => {
              const sudahDiKeranjang = keranjangRestock.some((k) => k.idProduk === item.idProduk);
              return (
                <tr key={item.idProduk} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{item.namaProduk}</td>
                  <td className="p-3 text-gray-500">{item.kategori}</td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    {item.stokUtama} <span className="text-xs text-gray-500 font-normal">{item.satuanTerkecil}</span>
                  </td>
                  <td className="p-3 text-center flex justify-center gap-1.5">
                    <button
                      onClick={() => onTambahKeKeranjang(item)}
                      disabled={sudahDiKeranjang}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        sudahDiKeranjang
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {sudahDiKeranjang ? '✓ Di Keranjang' : '+ Restock'}
                    </button>
                    
                    {/* Tombol Penyesuaian Stok */}
                    <button
                      onClick={() => onBukaPenyesuaian(item)}
                      className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-semibold transition-colors"
                      title="Catat barang rusak/expired/hilang"
                    >
                      ⚠️ Penyesuaian
                    </button>
                  </td>
                </tr>
              );
            })}
            {produkTersaring.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-400 text-sm">
                  Tidak ada produk ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}