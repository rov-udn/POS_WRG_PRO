import React from 'react';

export default function Nota({ transaksi, onTutupNota }) {
  if (!transaksi) return null;

  const handleCetak = () => {
    // Jalankan perintah print browser
    window.print();
    
    // Otomatis tutup nota setelah dialog cetak dipanggil agar kasir tidak repot klik manual
    onTutupNota();
  };

  return (
    <>
      {/* CSS Khusus Thermal 58mm agar tidak kertas kosong terus */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #area-struk-thermal, #area-struk-thermal * {
            visibility: visible;
          }
          #area-struk-thermal {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            margin: 0;
            padding: 4mm;
            background: white;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
          
          {/* Header Nota */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">🖨️ Struk Transaksi Selesai</h3>
            <button
              type="button"
              onClick={onTutupNota}
              className="text-gray-400 hover:text-gray-700 font-bold text-sm w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Area Struk yang akan dicetak */}
          <div id="area-struk-thermal" className="p-6 overflow-y-auto font-mono text-xs space-y-3 bg-white text-gray-800 flex-1">
            <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-gray-300">
              <h2 className="font-bold text-sm uppercase">WARUNG HAERUDIN</h2>
              <p className="text-[10px] text-gray-500">Serang, Banten</p>
              <p className="text-[10px] text-gray-500">{new Date(transaksi.tanggal).toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-gray-600 font-bold mt-1">No: {transaksi.noStruk}</p>
            </div>

            {/* Daftar Item */}
            <div className="space-y-2 pb-3 border-b border-dashed border-gray-300">
              {transaksi.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold">{item.namaProduk}</div>
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>{item.qty} {item.namaSatuan} x Rp{item.hargaJualSatuan.toLocaleString('id-ID')}</span>
                    <span className="font-bold text-gray-800">Rp{item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Total */}
            <div className="space-y-1 pb-3 border-b border-dashed border-gray-300 text-[11px]">
              <div className="flex justify-between">
                <span>Total Item:</span>
                <span className="font-bold">{transaksi.totalQtyItems} Pcs</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span>TOTAL BAYAR:</span>
                <span className="text-blue-600">Rp{transaksi.totalBayar.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode ({transaksi.metodePembayaran}):</span>
                <span>Rp{transaksi.jumlahUangDiterima.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Kembalian:</span>
                <span>Rp{transaksi.kembalian.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-500 pt-1 space-y-0.5">
              <p>Terima kasih sudah berbelanja!</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
            </div>
          </div>

          {/* Tombol Footer Nota */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={handleCetak}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>🖨️</span> Cetak Struk
            </button>
            <button
              type="button"
              onClick={onTutupNota}
              className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              Lewati / Tutup
            </button>
          </div>

        </div>
      </div>
    </>
  );
}