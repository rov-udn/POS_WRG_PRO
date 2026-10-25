import React, { useState } from 'react';

export default function RiwayatKulakanTab({ daftarRiwayat = [] }) {
  const [filterPencarian, setFilterPencarian] = useState('');

  // Filter berdasarkan nama agen atau nama produk
  const riwayatTersaring = daftarRiwayat.filter((item) => {
    const kataKunci = filterPencarian.toLowerCase();
    const cocokAgen = item.namaAgen?.toLowerCase().includes(kataKunci);
    const cocokProduk = item.items?.some((p) =>
      p.namaProduk?.toLowerCase().includes(kataKunci)
    );
    return cocokAgen || cocokProduk;
  });

  return (
    <div className="space-y-4">
      {/* Bar Pencarian Riwayat */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="🔍 Cari berdasarkan nama agen atau produk..."
          value={filterPencarian}
          onChange={(e) => setFilterPencarian(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
          Total: {riwayatTersaring.length} Sesi Kulakan
        </span>
      </div>

      {/* Daftar Kartu Riwayat */}
      {riwayatTersaring.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-5xl mb-3 block">📜</span>
          <h4 className="font-bold text-gray-700 text-base">Belum Ada Riwayat Kulakan</h4>
          <p className="text-xs text-gray-400 mt-1">
            Riwayat belanjaan yang sudah selesai diproses akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riwayatTersaring.map((riwayat) => (
            <div
              key={riwayat.idDraf || riwayat.tanggalSelesai}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3 relative overflow-hidden"
            >
              {/* Header Kartu Riwayat */}
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full inline-block mb-1">
                    ✓ SELESAI KULAKAN
                  </span>
                  <h4 className="font-extrabold text-gray-800 text-base">
                    {riwayat.namaAgen || 'Agen Grosir'}
                  </h4>
                  <span className="text-[11px] text-gray-400 font-medium block">
                    📅 {new Date(riwayat.tanggalSelesai || riwayat.tanggal).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Modal:</span>
                  <span className="text-lg font-black text-emerald-700">
                    Rp{(riwayat.totalEstimasiModal || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Rincian Produk Belanjaan */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {riwayat.items?.map((item, idx) => {
                  const qtyAkhir = item.qtyReal !== undefined ? item.qtyReal : item.qty;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                        item.isKosongDiAgen
                          ? 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                          : 'bg-gray-50 border-gray-100 text-gray-800'
                      }`}
                    >
                      <span className="font-bold truncate pr-2">{item.namaProduk}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        {item.isKosongDiAgen ? (
                          <span className="text-[10px] text-red-600 font-bold no-underline bg-red-50 px-2 py-0.5 rounded">
                            KOSONG DI AGEN
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold text-gray-600 bg-white px-2 py-0.5 rounded border">
                              {qtyAkhir} {item.namaSatuan}
                            </span>
                            <span className="font-bold text-emerald-700">
                              Rp{(qtyAkhir * item.hargaBeliSatuan).toLocaleString('id-ID')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}