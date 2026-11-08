import React from 'react';
import { formatQuantity } from '../../../utils/formatQuantity';

export default function NotaAgen({ draf, profilToko, onTutup }) {
  if (!draf) return null;

  const daftarItem = Array.isArray(draf.items) ? draf.items : [];
  const namaAgen = draf.namaAgen || 'Agen Grosir / Toko';
  const tanggalDraf = draf.tanggal ? new Date(draf.tanggal) : new Date();
  const kelompokKategori = daftarItem.reduce((kelompok, item) => {
    const kategori = item.kategori || 'Lainnya';
    if (!kelompok[kategori]) {
      kelompok[kategori] = [];
    }
    kelompok[kategori].push(item);
    return kelompok;
  }, {});

  const cetakNota = () => {
    window.print();
  };

  const kirimKeWhatsApp = () => {
    let teksKategori = '';

    Object.entries(kelompokKategori).forEach(([kategori, daftarItemKategori], indeks) => {
      teksKategori += `*--- ${kategori.toUpperCase()} ---*\n`;
      daftarItemKategori.forEach((item) => {
        const jumlah = item.qtyReal ?? item.qty ?? 0;
        const satuan = item.namaSatuan || '';
        const statusKosong = item.isKosongDiAgen ? ' - KOSONG' : '';
        teksKategori += `• ${item.namaProduk || 'Produk'} - ${formatQuantity(jumlah)} ${satuan}${statusKosong}\n`;
      });
      if (indeks < Object.keys(kelompokKategori).length - 1) {
        teksKategori += '\n';
      }
    });

    const pesan = `*NOTA BELANJA STOK: ${namaAgen.toUpperCase()}*\n` +
      `Dari: ${profilToko?.namaToko || 'Warung'}\n` +
      `Tanggal: ${tanggalDraf.toLocaleDateString('id-ID')}\n\n` +
      teksKategori +
      `\n_Mohon disiapkan ya, terima kasih!_`;

    const tautanWhatsApp = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(tautanWhatsApp, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <style>{`
        @page {
          margin: 12mm;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          #area-nota-agen,
          #area-nota-agen * {
            visibility: visible !important;
          }

          #area-nota-agen {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            padding: 0;
            background: white;
            color: black;
          }

          #area-nota-agen .nota-kategori {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
          
          {/* Header Modal */}
          <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm">📄 Pratinjau Nota Belanja Agen (Per Kategori)</h3>
            <button
              type="button"
              onClick={onTutup}
              className="text-white hover:opacity-80 font-bold text-sm w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Area Nota yang bisa dicetak */}
          <div id="area-nota-agen" className="flex-1 space-y-4 overflow-y-auto bg-white p-6 font-sans text-sm text-gray-800">
            
            {/* Kop Nota */}
            <div className="text-center border-b-2 border-gray-800 pb-3 space-y-1">
              <h2 className="font-black text-lg uppercase">{profilToko?.namaToko || 'WARUNG'}</h2>
              <p className="text-xs text-gray-600">{profilToko?.alamat || 'Alamat Warung'}</p>
              <p className="text-xs text-gray-600">Telp: {profilToko?.noTelp || '-'}</p>
            
              <p className="text-[11px] text-gray-500">Tanggal: {tanggalDraf.toLocaleString('id-ID')}</p>
            </div>

            {/* Daftar Item Terkelompok Kategori (Hanya Nama, Qty, dan Satuan) */}
            <div className="space-y-4">
              {Object.entries(kelompokKategori).map(([kategori, daftarItemKategori]) => (
                <div key={kategori} className="nota-kategori space-y-1.5">
                  <div className="bg-gray-200 text-gray-800 font-extrabold text-xs px-2.5 py-1 rounded uppercase tracking-wider">
                    📁 {kategori}
                  </div>
                  <div className="pl-2 space-y-1">
                    {daftarItemKategori.map((item, indeks) => (
                      <div 
                        key={indeks} 
                        className={`flex justify-between items-center text-xs py-1 border-b border-dashed border-gray-100 ${
                          item.isKosongDiAgen ? 'line-through text-gray-400 opacity-60' : ''
                        }`}
                      >
                        <span className="font-semibold">{item.namaProduk}</span>
                        <span className="font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {item.isKosongDiAgen ? 'KOSONG' : `${formatQuantity(item.qtyReal ?? item.qty ?? 0)} ${item.namaSatuan || ''}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-[10px] text-gray-400 pt-4 border-t border-dashed">
              Nota Pesanan Kulakan Internal Warung
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={kirimKeWhatsApp}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>📲</span> Kirim / Salin ke WA
            </button>
            <button
              type="button"
              onClick={cetakNota}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>🖨️</span> Cetak Nota
            </button>
            <button
              type="button"
              onClick={onTutup}
              className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </>
  );
}