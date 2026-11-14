import React, { useEffect, useState } from 'react';
import { calculateSubtotal, formatQuantity } from '../../../utils/formatQuantity';
import BaseModal from '../../../components/ui/BaseModal';
import { bagikanTeks } from '../../../utils/bagikanTeks';

export default function RiwayatKulakanTab({ daftarRiwayat = [] }) {
  const [filterPencarian, setFilterPencarian] = useState('');
  const [riwayatDipilih, setRiwayatDipilih] = useState(null);
  const [riwayatUntukDicetak, setRiwayatUntukDicetak] = useState(null);

  useEffect(() => {
    if (!riwayatUntukDicetak) return undefined;

    const resetCetak = () => setRiwayatUntukDicetak(null);
    window.addEventListener('afterprint', resetCetak);
    window.print();
    return () => window.removeEventListener('afterprint', resetCetak);
  }, [riwayatUntukDicetak]);

  // Filter berdasarkan nama agen atau nama produk
  const riwayatTersaring = daftarRiwayat.filter((item) => {
    const kataKunci = filterPencarian.toLowerCase();
    const cocokAgen = item.namaAgen?.toLowerCase().includes(kataKunci);
    const cocokProduk = item.items?.some((p) =>
      p.namaProduk?.toLowerCase().includes(kataKunci)
    );
    return cocokAgen || cocokProduk;
  });

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);

  const buatTeksBagikan = (riwayat) => {
    const daftarItem = Array.isArray(riwayat.items) ? riwayat.items : [];
    const barisItem = daftarItem.map((item) => {
      const jumlah = item.qtyReal !== undefined ? item.qtyReal : item.qty;
      if (item.isKosongDiAgen) {
        return `• ${item.namaProduk || 'Produk'} — KOSONG DI AGEN`;
      }
      return `• ${item.namaProduk || 'Produk'} — ${formatQuantity(jumlah)} ${item.namaSatuan || ''} — ${formatRupiah(calculateSubtotal(item.hargaBeliSatuan, jumlah))}`;
    });

    return `*REKAP KULAKAN SELESAI*\nAgen/Toko: ${riwayat.namaAgen || 'Agen Grosir'}\nTanggal: ${new Date(riwayat.tanggalSelesai || riwayat.tanggal).toLocaleString('id-ID')}\n\n*Daftar Barang:*\n${barisItem.length ? barisItem.join('\n') : 'Tidak ada rincian barang.'}\n\n*TOTAL MODAL: ${formatRupiah(riwayat.totalEstimasiModal)}*`;
  };

  const handleShare = async (riwayat) => {
    try {
      const hasil = await bagikanTeks(buatTeksBagikan(riwayat));
      if (hasil === 'disalin') {
        alert('Rekap kulakan berhasil disalin.');
      }
    } catch (error) {
      console.error('Gagal membagikan riwayat kulakan:', error);
      alert('Rekap kulakan gagal dibagikan atau disalin.');
    }
  };

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
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
            >
              {/* Header Kartu Riwayat */}
              <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setRiwayatDipilih(riwayat)}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {riwayatDipilih && (
        <BaseModal
          isOpen={Boolean(riwayatDipilih)}
          onClose={() => setRiwayatDipilih(null)}
          title={`Detail Kulakan - ${riwayatDipilih.namaAgen || 'Agen Grosir'}`}
          subtitle={`Selesai: ${new Date(
            riwayatDipilih.tanggalSelesai || riwayatDipilih.tanggal
          ).toLocaleString('id-ID')}`}
          size="md"
        >
          <div className="space-y-3">
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {riwayatDipilih.items?.length ? (
                riwayatDipilih.items.map((item, idx) => {
                  const qtyAkhir = item.qtyReal !== undefined ? item.qtyReal : item.qty;
                  return (
                    <div
                      key={`${item.idProduk || item.namaProduk}-${item.idSatuan || idx}`}
                      className={`flex flex-col gap-2 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between ${
                        item.isKosongDiAgen
                          ? 'border-gray-200 bg-gray-100 text-gray-400'
                          : 'border-gray-100 bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className={`min-w-0 font-bold break-words ${item.isKosongDiAgen ? 'line-through' : ''}`}>
                        {item.namaProduk}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        {item.isKosongDiAgen ? (
                          <span className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                            KOSONG DI AGEN
                          </span>
                        ) : (
                          <>
                            <span className="rounded border bg-white px-2 py-1 font-semibold text-gray-600">
                              {formatQuantity(qtyAkhir)} {item.namaSatuan}
                            </span>
                            <span className="font-bold text-emerald-700">
                              Rp{calculateSubtotal(item.hargaBeliSatuan, qtyAkhir).toLocaleString('id-ID')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">
                  Tidak ada rincian barang.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setTransaksiUntukDicetak(riwayatDipilih)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                🖨️ Cetak
              </button>
              <button
                type="button"
                onClick={() => handleShare(riwayatDipilih)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                📤 Bagikan
              </button>
              <button
                type="button"
                onClick={() => setRiwayatDipilih(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </BaseModal>
      )}
      {riwayatUntukDicetak && (
        <>
          <style>{`
            @page {
              size: 58mm auto;
              margin: 0;
            }

            @media print {
              body * {
                visibility: hidden !important;
              }

              #area-riwayat-kulakan-thermal,
              #area-riwayat-kulakan-thermal * {
                visibility: visible !important;
              }

              #area-riwayat-kulakan-thermal {
                position: fixed;
                left: 0;
                top: 0;
                width: 58mm;
                padding: 4mm;
                background: white;
                color: black;
                font-family: monospace;
                font-size: 10px;
              }
            }
          `}</style>
          <div
            id="area-riwayat-kulakan-thermal"
            className="fixed -left-[10000px] top-0 space-y-3"
          >
            <div className="space-y-1 border-b border-dashed border-gray-500 pb-2 text-center">
              <h2 className="font-bold uppercase">POS WRG PRO</h2>
              <p>REKAP KULAKAN SELESAI</p>
              <p>{new Date(riwayatUntukDicetak.tanggalSelesai || riwayatUntukDicetak.tanggal).toLocaleString('id-ID')}</p>
              <p>Agen/Toko: {riwayatUntukDicetak.namaAgen || 'Agen Grosir'}</p>
            </div>
            <div className="space-y-2 border-b border-dashed border-gray-500 py-2">
              {(Array.isArray(riwayatUntukDicetak.items) ? riwayatUntukDicetak.items : []).map((item, idx) => {
                const jumlah = item.qtyReal !== undefined ? item.qtyReal : item.qty;
                return (
                  <div key={`${item.idProduk || item.namaProduk}-${item.idSatuan || idx}`} className="space-y-0.5">
                    <p>{item.namaProduk || 'Produk'}{item.isKosongDiAgen ? ' — KOSONG' : ''}</p>
                    {!item.isKosongDiAgen && (
                      <div className="flex justify-between gap-2">
                        <span>{formatQuantity(jumlah)} {item.namaSatuan || ''}</span>
                        <span>{formatRupiah(calculateSubtotal(item.hargaBeliSatuan, jumlah))}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between gap-2 font-bold">
              <span>TOTAL MODAL:</span>
              <span>{formatRupiah(riwayatUntukDicetak.totalEstimasiModal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}