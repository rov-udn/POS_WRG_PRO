import React, { useState } from 'react';

export default function DrafBelanjaModal({
  isOpen,
  onClose,
  daftarDraf,
  daftarRiwayatKulakan = [],
  onToggleKosong,
  onUbahQtyReal,
  onKirimKeGudang,
  onHapusDraf
}) {
  const [tabAktifModal, setTabAktifModal] = useState('DRAF'); // 'DRAF' atau 'RIWAYAT'

  if (!isOpen) return null;

  const handlePrintDraf = (draf) => {
    window.print();
  };

  const handleShareDraf = (draf) => {
    const teksItems = draf.items
      .map((item) => {
        const status = item.isKosongDiAgen ? ' (KOSONG DI AGEN)' : '';
        const qtyInfo = item.qtyReal !== undefined ? `${item.qtyReal}` : item.qty;
        return `- ${item.namaProduk} (${qtyInfo} ${item.namaSatuan})${status}`;
      })
      .join('\n');

    const pesan = `*DAFTAR BELANJA AGEN: ${draf.namaAgen.toUpperCase()}*\nTanggal: ${new Date(draf.tanggal).toLocaleDateString('id-ID')}\n\n${teksItems}\n\n*Estimasi Modal: Rp${draf.totalEstimasiModal.toLocaleString('id-ID')}*`;

    if (navigator.share) {
      navigator.share({
        title: `Draf Belanja - ${draf.namaAgen}`,
        text: pesan
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(pesan);
      alert('📋 Daftar belanja berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-white">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            📂 Manajer Draf & Riwayat Kulakan
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:opacity-80 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigasi Modal */}
        <div className="flex border-b bg-gray-50 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setTabAktifModal('DRAF')}
            className={`pb-2 text-xs font-extrabold border-b-2 transition-colors ${
              tabAktifModal === 'DRAF'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Draf Aktif ({daftarDraf.length})
          </button>
          <button
            type="button"
            onClick={() => setTabAktifModal('RIWAYAT')}
            className={`pb-2 text-xs font-extrabold border-b-2 transition-colors ${
              tabAktifModal === 'RIWAYAT'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📜 Riwayat Kulakan Selesai ({daftarRiwayatKulakan.length})
          </button>
        </div>

        {/* Konten Berdasarkan Tab */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {tabAktifModal === 'DRAF' ? (
            /* TAB DRAF AKTIF */
            daftarDraf.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="font-bold text-sm">Belum ada draf belanjaan tersimpan</p>
              </div>
            ) : (
              daftarDraf.map((draf) => (
                <div key={draf.idDraf} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div>
                      <h4 className="font-extrabold text-gray-800 text-sm">{draf.namaAgen}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(draf.tanggal).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-500 uppercase block">Estimasi Modal:</span>
                      <span className="text-base font-black text-emerald-700">
                        Rp{draf.totalEstimasiModal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                    💡 <b>Info Realisasi:</b> Ubah angka Qty di bawah jika di agen jumlahnya kurang/nambah, atau klik nama item jika barang <b>kosong di agen</b>.
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {draf.items.map((item) => (
                      <div
                        key={`${item.idProduk}-${item.idSatuan}`}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          item.isKosongDiAgen
                            ? 'bg-gray-200/70 border-gray-300 text-gray-400 opacity-70'
                            : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        {/* Klik Nama untuk Toggle Kosong */}
                        <div
                          onClick={() => onToggleKosong && onToggleKosong(draf.idDraf, item.idProduk, item.idSatuan)}
                          className="flex items-center gap-2 min-w-0 pr-2 cursor-pointer flex-1"
                          title="Klik untuk tandai kosong di agen"
                        >
                          <span className={`font-bold truncate ${item.isKosongDiAgen ? 'line-through text-gray-400' : ''}`}>
                            {item.namaProduk}
                          </span>
                        </div>

                        {/* Input Real Qty */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.isKosongDiAgen ? (
                            <span className="text-[10px] text-red-600 font-extrabold">[KOSONG]</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={item.qtyReal !== undefined ? item.qtyReal : item.qty}
                                onChange={(e) => onUbahQtyReal && onUbahQtyReal(draf.idDraf, item.idProduk, item.idSatuan, e.target.value)}
                                className="w-16 px-2 py-1 text-center border rounded-lg font-bold text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-amber-500"
                              />
                              <span className="text-[11px] font-semibold text-gray-500">{item.namaSatuan}</span>
                            </div>
                          )}
                          <span className="font-bold text-gray-700 w-20 text-right">
                            Rp{(!item.isKosongDiAgen ? (item.qtyReal ?? item.qty) * item.hargaBeliSatuan : 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Aksi Draf */}
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleShareDraf(draf)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                      >
                        📲 Share
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintDraf(draf)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors"
                      >
                        🖨️ Print
                      </button>
                      <button
                        type="button"
                        onClick={() => onHapusDraf(draf.idDraf)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Arsip ke riwayat kulakan & kirim item valid ke Gudang sekarang?')) {
                          onKirimKeGudang(draf);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      🚀 Selesai & Kirim ke Gudang
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* TAB RIWAYAT KULAKAN */
            daftarRiwayatKulakan.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl mb-2 block">📜</span>
                <p className="font-bold text-sm">Belum ada riwayat kulakan selesai</p>
                <p className="text-xs mt-1">Draf yang selesai dikirim akan tersimpan rapi di sini</p>
              </div>
            ) : (
              daftarRiwayatKulakan.map((riwayat) => (
                <div key={riwayat.idDraf} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                        SELESAI
                      </span>
                      <h4 className="font-extrabold text-gray-800 text-sm mt-1">{riwayat.namaAgen}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Selesai: {new Date(riwayat.tanggalSelesai || riwayat.tanggal).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-500 uppercase block">Total Belanja:</span>
                      <span className="text-base font-black text-emerald-700">
                        Rp{riwayat.totalEstimasiModal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {riwayat.items.map((item) => (
                      <div
                        key={`${item.idProduk}-${item.idSatuan}`}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                          item.isKosongDiAgen ? 'bg-gray-200/50 text-gray-400 line-through' : 'bg-white text-gray-800'
                        }`}
                      >
                        <span className="font-bold truncate">{item.namaProduk}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                            {item.isKosongDiAgen ? 'KOSONG' : `${item.qtyReal ?? item.qty} ${item.namaSatuan}`}
                          </span>
                          <span className="font-bold">
                            Rp{(!item.isKosongDiAgen ? (item.qtyReal ?? item.qty) * item.hargaBeliSatuan : 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}