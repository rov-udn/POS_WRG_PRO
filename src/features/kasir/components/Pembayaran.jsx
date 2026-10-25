import React from 'react';

export default function Pembayaran({
  totalBayar,
  metodePembayaran,
  onUbahMetodePembayaran,
  jumlahUangDiterima,
  onUbahUangDiterima,
  dapatkanNominalCepat,
  pilihNominalCepat,
  kembalian,
  onProsesBayar,
  onBatal
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            💳 Selesaikan Pembayaran
          </h3>
          <button
            type="button"
            onClick={onBatal}
            className="text-white/80 hover:text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Konten Utama */}
        <div className="p-6 space-y-5">
          
          {/* Ringkasan Total Belanja (Dibuat Sangat Besar & Menonjol) */}
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 text-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
              Total Tagihan
            </span>
            <div className="text-3xl font-black text-blue-900 tracking-tight">
              Rp{totalBayar.toLocaleString('id-ID')}
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUbahMetodePembayaran('CASH')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-all ${
                  metodePembayaran === 'CASH'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                💵 Tunai (Cash)
              </button>
              <button
                type="button"
                onClick={() => onUbahMetodePembayaran('QRIS')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-all ${
                  metodePembayaran === 'QRIS'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                📱 QRIS / Transfer
              </button>
            </div>
          </div>

          {/* Jika Pilih Tunai: Input Uang Diterima & Quick Amount Chips */}
          {metodePembayaran === 'CASH' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                  Uang Tunai Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={jumlahUangDiterima}
                  onChange={(e) => onUbahUangDiterima(e.target.value)}
                  placeholder="Masukkan nominal uang..."
                  className="w-full px-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-800"
                  autoFocus
                />
              </div>

              {/* Quick Amount Chips */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Pintasan Nominal Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dapatkanNominalCepat().map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => pilihNominalCepat(nominal)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold rounded-xl border border-blue-200 active:scale-95 transition-all"
                    >
                      {nominal === totalBayar ? 'Uang Pas' : `Rp${nominal.toLocaleString('id-ID')}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perhitungan Kembalian (Dibuat Besar) */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase">Uang Kembalian:</span>
                <span className="text-xl font-black text-emerald-700 tracking-tight">
                  Rp{kembalian.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Tombol Aksi Konfirmasi (Sangat Besar & Touch-Friendly) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onProsesBayar}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>✅</span> Konfirmasi & Cetak Struk
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}