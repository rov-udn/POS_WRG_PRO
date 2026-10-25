import React from 'react';

export default function KeranjangBelanja({
  keranjangBelanja,
  totalQtyItems,
  totalEstimasiModal,
  namaAgen,
  jumlahDraf = 0, // <-- Tambahan prop jumlahDraf
  onUbahNamaAgen,
  onUbahQty,
  onHapusItem,
  onResetKeranjang,
  onSimpanDraf,
  onBukaDraf
}) {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        <h2 className="font-bold text-emerald-900 text-base flex items-center gap-2">
          📝 Rencana Belanja Agen
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Tombol Lihat Draf Tersimpan + Badge Merah */}
          <button
            type="button"
            onClick={onBukaDraf}
            className="relative px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-xs rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
          >
            📂 Draf
            {jumlahDraf > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                {jumlahDraf}
              </span>
            )}
          </button>

          {keranjangBelanja.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Kosongkan daftar belanjaan agen?')) {
                  onResetKeranjang();
                }
              }}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition-colors"
            >
              🗑️
            </button>
          )}

          <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-xs rounded-full">
            {totalQtyItems} Item
          </span>
        </div>
      </div>

      {/* Input Nama Agen */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <input
          type="text"
          value={namaAgen}
          onChange={(e) => onUbahNamaAgen(e.target.value)}
          placeholder="Nama Agen / Toko Grosir (opsional)..."
          className="w-full px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
        />
      </div>

      {/* Daftar Item Rencana Belanja */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-360px)]">
        {keranjangBelanja.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
            <span className="text-3xl mb-2">🚛</span>
            <p className="text-sm font-medium">Belum ada daftar belanjaan</p>
            <p className="text-xs text-gray-400 mt-0.5">Pilih barang yang mau dikulakan ke agen</p>
          </div>
        ) : (
          keranjangBelanja.map((item) => (
            <div
              key={`${item.idProduk}-${item.idSatuan}`}
              className="flex flex-col p-2.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs line-clamp-1">
                    {item.namaProduk}
                  </h4>
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                    Satuan Beli: {item.namaSatuan}
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

              {/* Kontrol Qty & Harga Modal Unit */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
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
                    className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold rounded text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal Modal */}
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-700">
                    Rp{item.subtotal.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    @Rp{item.hargaBeliSatuan.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Ringkasan Modal & Tombol Simpan Draf */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimasi Uang Modal:</span>
          <span className="text-xl font-black text-emerald-700 tracking-tight">
            Rp{totalEstimasiModal.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          type="button"
          disabled={keranjangBelanja.length === 0}
          onClick={onSimpanDraf}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
            keranjangBelanja.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/30'
          }`}
        >
          <span>💾</span> Simpan ke Draf Belanja
        </button>
      </div>
    </div>
  );
}