import React, { useState } from 'react';

export default function KeranjangKasir({
  keranjang,
  totalQtyItems,
  totalBayar,
  daftarDraf,
  onTahanTransaksi,
  onPanggilDraf,
  onHapusDraf,
  onUbahQty,
  onHapusItem,
  onResetKeranjang,
  onLanjutPembayaran
}) {
  const [tampilModalDraf, setTampilModalDraf] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Keranjang */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          🛒 Keranjang
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Tombol Lihat Draf Ditahan */}
          {daftarDraf.length > 0 && (
            <button
              type="button"
              onClick={() => setTampilModalDraf(true)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-xs rounded-lg border border-amber-300 transition-colors animate-pulse flex items-center gap-1"
              title="Lihat transaksi yang ditahan"
            >
              ⏳ Draf ({daftarDraf.length})
            </button>
          )}

          {/* Tombol Hapus Semua */}
          {keranjang.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Yakin ingin mengosongkan seluruh keranjang belanja?')) {
                  onResetKeranjang();
                }
              }}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition-colors"
              title="Kosongkan seluruh item"
            >
              🗑️
            </button>
          )}

          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
            {totalQtyItems} Item
          </span>
        </div>
      </div>

      {/* Item Keranjang */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-360px)]">
        {keranjang.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
            <span className="text-3xl mb-2">🛍️</span>
            <p className="text-sm font-medium">Keranjang masih kosong</p>
            <p className="text-xs text-gray-400 mt-0.5">Silakan pilih produk atau scan barcode</p>
          </div>
        ) : (
          keranjang.map((item) => (
            <div
              key={`${item.idProduk}-${item.idSatuan}`}
              className="flex flex-col p-2.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs line-clamp-1">
                    {item.namaProduk}
                  </h4>
                  <span className="inline-block px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded">
                    Satuan: {item.namaSatuan}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onHapusItem(item.idProduk, item.idSatuan)}
                  className="text-gray-400 hover:text-red-600 font-bold text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-200/50">
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onUbahQty(item.idProduk, item.idSatuan, item.qty - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 font-bold rounded text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-gray-800">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUbahQty(item.idProduk, item.idSatuan, item.qty + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-700 font-bold rounded text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-700">
                    Rp{item.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Ringkasan & Tombol Aksi */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Belanja:</span>
          <span className="text-xl font-black text-blue-600 tracking-tight">
            Rp{totalBayar.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex gap-2">
          {/* Tombol Tahan Nota */}
          <button
            type="button"
            disabled={keranjang.length === 0}
            onClick={() => {
              const label = window.prompt('Masukkan nama/label draf (opsional):', `Pelanggan ${daftarDraf.length + 1}`);
              if (label !== null) {
                onTahanTransaksi(label);
              }
            }}
            className={`py-3 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1 shrink-0 ${
              keranjang.length === 0
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 active:scale-95'
            }`}
            title="Tahan transaksi ini untuk melayani pelanggan lain"
          >
            <span>⏳</span> Tahan
          </button>

          {/* Tombol Lanjut Bayar */}
          <button
            type="button"
            disabled={keranjang.length === 0}
            onClick={onLanjutPembayaran}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              keranjang.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-500/30'
            }`}
          >
            <span>💳</span> Bayar
          </button>
        </div>
      </div>

      {/* Modal Daftar Draf Transaksi Ditahan */}
      {tampilModalDraf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 bg-amber-500 text-white">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                ⏳ Daftar Transaksi Ditahan
              </h3>
              <button
                type="button"
                onClick={() => setTampilModalDraf(false)}
                className="text-white font-bold text-lg hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {daftarDraf.map((draf) => {
                const totalDraf = draf.items.reduce((s, i) => s + i.subtotal, 0);
                const totalQty = draf.items.reduce((s, i) => s + i.qty, 0);

                return (
                  <div
                    key={draf.idDraf}
                    className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">{draf.catatan}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{draf.waktu}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {totalQty} item • <b className="text-amber-800">Rp{totalDraf.toLocaleString('id-ID')}</b>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onPanggilDraf(draf.idDraf);
                          setTampilModalDraf(false);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Lanjutkan
                      </button>
                      <button
                        type="button"
                        onClick={() => onHapusDraf(draf.idDraf)}
                        className="p-1.5 text-gray-400 hover:text-red-600 font-bold text-xs"
                        title="Hapus draf ini"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}