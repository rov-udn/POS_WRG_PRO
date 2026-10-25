import React, { useState, useEffect, useRef } from 'react';

const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';

export default function RiwayatPenjualan({ onPilihTransaksi }) {
  const [daftarTransaksi, setDaftarTransaksi] = useState([]);
  const [kataKunci, setKataKunci] = useState('');
  
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
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
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
                <td className="p-3 text-xs text-gray-500">
                  {new Date(trx.tanggal).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </td>
                <td className="p-3 font-semibold text-gray-800">{trx.noStruk}</td>
                <td className="p-3 text-gray-700">{trx.namaKasir}</td>
                <td className="p-3 text-gray-600">{trx.totalQtyItems} pcs</td>
                <td className="p-3 font-bold text-green-600">{formatRupiah(trx.totalBayar)}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    trx.metodePembayaran === 'CASH'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {trx.metodePembayaran}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onPilihTransaksi(trx)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                  >
                    Detail Struk
                  </button>
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
  );
}