import React, { useState, useEffect, useRef } from 'react';
import { calculateSubtotal, formatQuantity } from '../../../utils/formatQuantity';
import { bagikanTeks } from '../../../utils/bagikanTeks';

const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';

export default function RiwayatPenjualan({ onPilihTransaksi }) {
  const [daftarTransaksi, setDaftarTransaksi] = useState([]);
  const [kataKunci, setKataKunci] = useState('');
  const [transaksiUntukDicetak, setTransaksiUntukDicetak] = useState(null);
  
  // State Filter Ringkas
  const [metodeFilter, setMetodeFilter] = useState('ALL'); // ALL | CASH | QRIS / TRANSFER
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [bukaMenuFilter, setBukaMenuFilter] = useState(false);

  const menuFilterRef = useRef(null);

  // Ambil data transaksi dari localStorage
  useEffect(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_TRANSAKSI);
      if (data) {
        setDaftarTransaksi(JSON.parse(data));
      }
    } catch (e) {
      console.error("Gagal memuat data riwayat penjualan:", e);
    }
  }, []);

  // Tutup menu filter saat klik di luar area
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuFilterRef.current && !menuFilterRef.current.contains(e.target)) {
        setBukaMenuFilter(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!transaksiUntukDicetak) return undefined;

    const resetCetak = () => setTransaksiUntukDicetak(null);
    window.addEventListener('afterprint', resetCetak);
    window.print();
    return () => window.removeEventListener('afterprint', resetCetak);
  }, [transaksiUntukDicetak]);

  // Filter gabungan
  const transaksiTersaring = daftarTransaksi.filter((trx) => {
    const cocokKataKunci =
      trx.noStruk.toLowerCase().includes(kataKunci.toLowerCase()) ||
      trx.namaKasir.toLowerCase().includes(kataKunci.toLowerCase());

    const cocokMetode =
      metodeFilter === 'ALL' || trx.metodePembayaran === metodeFilter;

    const tglTransaksi = new Date(trx.tanggal);
    let cocokTanggal = true;

    if (tanggalMulai) {
      const tglAwal = new Date(tanggalMulai);
      tglAwal.setHours(0, 0, 0, 0);
      cocokTanggal = cocokTanggal && tglTransaksi >= tglAwal;
    }

    if (tanggalSelesai) {
      const tglAkhir = new Date(tanggalSelesai);
      tglAkhir.setHours(23, 59, 59, 999);
      cocokTanggal = cocokTanggal && tglTransaksi <= tglAkhir;
    }

    return cocokKataKunci && cocokMetode && cocokTanggal;
  });

  const resetFilter = () => {
    setMetodeFilter('ALL');
    setTanggalMulai('');
    setTanggalSelesai('');
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const buatTeksBagikan = (trx) => {
    const isRetur = trx.tipeTransaksi === 'RETUR_TUKAR';
    const daftarItem = Array.isArray(trx.items) ? trx.items : [];
    const barisItem = daftarItem.map((item) => {
      const arah = item.arah === 'MASUK'
        ? 'Dikembalikan: '
        : item.arah === 'KELUAR'
          ? 'Pengganti: '
          : '';
      return `• ${arah}${item.namaProduk || 'Produk'} — ${formatQuantity(item.qty)} ${item.namaSatuan || ''} × ${formatRupiah(item.hargaJualSatuan)} = ${formatRupiah(item.subtotal ?? calculateSubtotal(item.hargaJualSatuan, item.qty))}`;
    });
    const ringkasanPembayaran = isRetur
      ? trx.arusKasKeluar > 0
        ? `Refund: ${formatRupiah(trx.arusKasKeluar)}`
        : `Pembayaran tambahan: ${formatRupiah((trx.arusKasMasuk || 0) + (trx.arusKasMasukNonTunai || 0))}`
      : `Total: ${formatRupiah(trx.totalBayar)}\nMetode: ${trx.metodePembayaran || '-'}`;

    return `*${isRetur ? 'RIWAYAT RETUR / TUKAR' : 'NOTA PENJUALAN'}*\nNo. Struk: ${trx.noStruk}\nTanggal: ${new Date(trx.tanggal).toLocaleString('id-ID')}\nKasir: ${trx.namaKasir || '-'}\n\n*Rincian:*\n${barisItem.length ? barisItem.join('\n') : 'Tidak ada rincian barang.'}\n\n${ringkasanPembayaran}${!isRetur && trx.metodePembayaran === 'CASH' ? `\nUang diterima: ${formatRupiah(trx.jumlahUangDiterima)}\nKembalian: ${formatRupiah(trx.kembalian)}` : ''}`;
  };

  const handleShare = async (trx) => {
    try {
      const hasil = await bagikanTeks(buatTeksBagikan(trx));
      if (hasil === 'disalin') {
        alert('Rincian transaksi berhasil disalin.');
      }
    } catch (error) {
      console.error('Gagal membagikan riwayat transaksi:', error);
      alert('Rincian transaksi gagal dibagikan atau disalin.');
    }
  };

  const totalFilterAktif = (metodeFilter !== 'ALL' ? 1 : 0) + (tanggalMulai ? 1 : 0) + (tanggalSelesai ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Baris Pencarian & Tombol Filter Ringkas */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
        {/* Input Cari Cepat */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari No. Struk atau Kasir..."
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Tombol Toggle Filter */}
        <div className="relative" ref={menuFilterRef}>
          <button
            onClick={() => setBukaMenuFilter(!bukaMenuFilter)}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-colors ${
              totalFilterAktif > 0 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>Filter Lanjutan</span>
            {totalFilterAktif > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.2 text-[10px]">
                {totalFilterAktif}
              </span>
            )}
          </button>

          {/* Kotak Pop-up Filter Ringkas */}
          {bukaMenuFilter && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3.5 z-20 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gray-800">Opsi Filter</span>
                {totalFilterAktif > 0 && (
                  <button
                    onClick={resetFilter}
                    className="text-red-600 hover:underline font-medium"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Pilihan Metode Bayar */}
              <div className="space-y-1.5">
                <label className="block text-gray-600 font-medium">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-1">
                  {['ALL', 'CASH', 'QRIS'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodeFilter(m)}
                      className={`py-1 px-2 rounded border text-center font-medium transition-colors ${
                        metodeFilter === m 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m === 'ALL' ? 'Semua' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rentang Tanggal */}
              <div className="space-y-2 pt-1 border-t">
                <label className="block text-gray-600 font-medium">Rentang Tanggal</label>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[10px] text-gray-400">Dari:</span>
                    <input
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400">Sampai:</span>
                    <input
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Daftar Transaksi */}
      <div className="w-full min-w-0 rounded-lg border bg-white shadow-sm">
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="p-3">Waktu & Tanggal</th>
                <th className="p-3">No. Struk</th>
                <th className="p-3">Kasir</th>
                <th className="p-3">Total Item</th>
                <th className="p-3">Total Bayar</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {transaksiTersaring.map((trx) => (
                <tr key={trx.noStruk} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap p-3 text-xs text-gray-500">
                    {new Date(trx.tanggal).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="whitespace-nowrap p-3 font-semibold text-gray-800">{trx.noStruk}</td>
                  <td className="whitespace-nowrap p-3 text-gray-700">{trx.namaKasir}</td>
                  <td className="whitespace-nowrap p-3 text-gray-600">
                    {trx.tipeTransaksi === 'RETUR_TUKAR'
                      ? `Retur / Tukar (${trx.totalQtyItems} pcs)`
                      : `${trx.totalQtyItems} pcs`}
                  </td>
                  <td className={`whitespace-nowrap p-3 font-bold ${
                    trx.tipeTransaksi === 'RETUR_TUKAR' && trx.arusKasKeluar > 0
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {trx.tipeTransaksi === 'RETUR_TUKAR' && trx.arusKasKeluar > 0
                      ? `Refund ${formatRupiah(trx.arusKasKeluar)}`
                      : trx.tipeTransaksi === 'RETUR_TUKAR'
                        ? `Masuk ${formatRupiah(trx.arusKasMasuk + trx.arusKasMasukNonTunai)}`
                        : formatRupiah(trx.totalBayar)}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      trx.metodePembayaran === 'CASH'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {trx.metodePembayaran}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPilihTransaksi(trx)}
                        className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        {trx.tipeTransaksi === 'RETUR_TUKAR' ? 'Detail Retur' : 'Detail Struk'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransaksiUntukDicetak(trx)}
                        aria-label={`Cetak ulang transaksi ${trx.noStruk}`}
                        className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        🖨️ Cetak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(trx)}
                        aria-label={`Bagikan transaksi ${trx.noStruk}`}
                        className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        📤 Bagikan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transaksiTersaring.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-400 text-sm">
                    Tidak ada data transaksi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {transaksiUntukDicetak && (
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

              #area-riwayat-transaksi-thermal,
              #area-riwayat-transaksi-thermal * {
                visibility: visible !important;
              }

              #area-riwayat-transaksi-thermal {
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
            id="area-riwayat-transaksi-thermal"
            className="fixed -left-[10000px] top-0 space-y-3"
          >
            {(() => {
              const trx = transaksiUntukDicetak;
              const isRetur = trx.tipeTransaksi === 'RETUR_TUKAR';
              const daftarItem = Array.isArray(trx.items) ? trx.items : [];
              return (
                <>
                  <div className="space-y-1 border-b border-dashed border-gray-500 pb-2 text-center">
                    <h2 className="font-bold uppercase">POS WRG PRO</h2>
                    <p>{isRetur ? 'NOTA RETUR / TUKAR' : 'NOTA PENJUALAN'}</p>
                    <p>{new Date(trx.tanggal).toLocaleString('id-ID')}</p>
                    <p>No: {trx.noStruk}</p>
                    <p>Kasir: {trx.namaKasir || '-'}</p>
                  </div>
                  <div className="space-y-2 border-b border-dashed border-gray-500 py-2">
                    {daftarItem.map((item, idx) => (
                      <div key={`${item.idProduk || item.namaProduk}-${idx}`} className="space-y-0.5">
                        <p>
                          {item.arah === 'MASUK' ? 'Dikembalikan: ' : item.arah === 'KELUAR' ? 'Pengganti: ' : ''}
                          {item.namaProduk || 'Produk'}
                        </p>
                        <div className="flex justify-between gap-2">
                          <span>{formatQuantity(item.qty)} {item.namaSatuan || ''} × {formatRupiah(item.hargaJualSatuan)}</span>
                          <span>{formatRupiah(item.subtotal ?? calculateSubtotal(item.hargaJualSatuan, item.qty))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {isRetur ? (
                      <div className="flex justify-between gap-2 font-bold">
                        <span>{trx.arusKasKeluar > 0 ? 'Refund:' : 'Pembayaran tambahan:'}</span>
                        <span>{formatRupiah(trx.arusKasKeluar || (trx.arusKasMasuk || 0) + (trx.arusKasMasukNonTunai || 0))}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between gap-2 font-bold">
                          <span>TOTAL BAYAR:</span>
                          <span>{formatRupiah(trx.totalBayar)}</span>
                        </div>
                        <p>Metode: {trx.metodePembayaran || '-'}</p>
                        {trx.metodePembayaran === 'CASH' && (
                          <>
                            <p>Uang diterima: {formatRupiah(trx.jumlahUangDiterima)}</p>
                            <p>Kembalian: {formatRupiah(trx.kembalian)}</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}