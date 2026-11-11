import React, { useState, useEffect } from 'react';
import RingkasanStatistik from './components/RingkasanStatistik';
import RekapPembayaran from './components/RekapPembayaran';
import ProdukTerlaris from './components/ProdukTerlaris';
import { ambilShiftTertutup, KUNCI_STORAGE_SHIFT } from './utils/shiftStorage';

const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';
const KUNCI_STORAGE_SHRINKAGE = 'pos_warung_shrinkage_logs';

export default function LaporanPage({ role }) {
  const [daftarTransaksi] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_TRANSAKSI);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Gagal memuat data transaksi untuk laporan:', error);
      return [];
    }
  });
  const [daftarKerugian, setDaftarKerugian] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_SHRINKAGE);
      const hasil = data ? JSON.parse(data) : [];
      if (!Array.isArray(hasil)) throw new Error('Format log kerugian tidak valid.');
      return hasil;
    } catch (error) {
      console.error('Gagal memuat log kerugian untuk laporan:', error);
      return [];
    }
  });
  const [dataShiftLaporan, setDataShiftLaporan] = useState(() => {
    if (role !== 'admin') return { daftarShift: [], pesanError: '' };
    try {
      return { daftarShift: ambilShiftTertutup(), pesanError: '' };
    } catch (error) {
      console.error('Gagal memuat rekap shift untuk laporan admin:', error);
      return {
        daftarShift: [],
        pesanError: 'Rekap shift gagal dimuat. Periksa data penyimpanan.'
      };
    }
  });
  const { daftarShift, pesanError: pesanErrorShift } = dataShiftLaporan;
  const [periode, setPeriode] = useState('SEMUA'); // 'HARI_INI' | 'BULAN_INI' | 'SEMUA'

  useEffect(() => {
    if (role !== 'admin') return undefined;
    const muatShiftTertutup = (event) => {
      if (event?.key && event.key !== KUNCI_STORAGE_SHIFT) return;
      try {
        setDataShiftLaporan({ daftarShift: ambilShiftTertutup(), pesanError: '' });
      } catch (error) {
        console.error('Gagal memuat rekap shift untuk laporan admin:', error);
        setDataShiftLaporan({
          daftarShift: [],
          pesanError: 'Rekap shift gagal dimuat. Periksa data penyimpanan.'
        });
      }
    };
    window.addEventListener('storage', muatShiftTertutup);
    return () => window.removeEventListener('storage', muatShiftTertutup);
  }, [role]);

  useEffect(() => {
    const muatKerugian = (event) => {
      if (event?.key && event.key !== KUNCI_STORAGE_SHRINKAGE) return;
      try {
        const data = localStorage.getItem(KUNCI_STORAGE_SHRINKAGE);
        const hasil = data ? JSON.parse(data) : [];
        if (!Array.isArray(hasil)) throw new Error('Format log kerugian tidak valid.');
        setDaftarKerugian(hasil);
      } catch (error) {
        console.error('Gagal memuat log kerugian untuk laporan:', error);
      }
    };
    window.addEventListener('storage', muatKerugian);
    window.addEventListener('pos-warung-shrinkage-updated', muatKerugian);
    return () => {
      window.removeEventListener('storage', muatKerugian);
      window.removeEventListener('pos-warung-shrinkage-updated', muatKerugian);
    };
  }, []);

  // Filter transaksi berdasarkan periode pilihan
  const transaksiTersaring = daftarTransaksi.filter((trx) => {
    const tglTrx = new Date(trx.tanggal);
    const sekarang = new Date();

    if (periode === 'HARI_INI') {
      return (
        tglTrx.getDate() === sekarang.getDate() &&
        tglTrx.getMonth() === sekarang.getMonth() &&
        tglTrx.getFullYear() === sekarang.getFullYear()
      );
    }

    if (periode === 'BULAN_INI') {
      return (
        tglTrx.getMonth() === sekarang.getMonth() &&
        tglTrx.getFullYear() === sekarang.getFullYear()
      );
    }

    return true; // SEMUA
  });

  const shiftTersaring = daftarShift.filter((shift) => {
    const tanggalTutup = new Date(shift.waktuTutup);
    const sekarang = new Date();
    if (periode === 'HARI_INI') {
      return tanggalTutup.toDateString() === sekarang.toDateString();
    }
    if (periode === 'BULAN_INI') {
      return tanggalTutup.getMonth() === sekarang.getMonth() &&
        tanggalTutup.getFullYear() === sekarang.getFullYear();
    }
    return true;
  });
  const kerugianTersaring = daftarKerugian.filter((log) => {
    const tanggal = new Date(log.tanggal);
    if (Number.isNaN(tanggal.getTime())) return false;
    const sekarang = new Date();
    if (periode === 'HARI_INI') return tanggal.toDateString() === sekarang.toDateString();
    if (periode === 'BULAN_INI') {
      return tanggal.getMonth() === sekarang.getMonth() &&
        tanggal.getFullYear() === sekarang.getFullYear();
    }
    return true;
  });
  const totalBebanKerugian = kerugianTersaring.reduce(
    (total, log) => total + (Number(log.totalKerugian) || 0),
    0
  );

  if (role !== 'admin') {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Laporan hanya dapat diakses oleh Admin.
      </p>
    );
  }

  // --- Perhitungan Kalkulasi Otomatis ---
  let totalOmzet = 0;
  let totalModal = 0;
  let totalTunaiMasuk = 0;
  let totalKasKeluar = 0;
  let totalNonTunai = 0;
  const petaProduk = {};

  transaksiTersaring.forEach((trx) => {
    totalOmzet += trx.totalBayar || 0;

    // Rekap Jalur Pembayaran
    if (trx.tipeTransaksi === 'RETUR_TUKAR') {
      totalTunaiMasuk += trx.arusKasMasuk || 0;
      totalKasKeluar += trx.arusKasKeluar || 0;
      totalNonTunai += trx.arusKasMasukNonTunai || 0;
    } else if (trx.metodePembayaran === 'CASH') {
      totalTunaiMasuk += trx.totalBayar || 0;
    } else {
      totalNonTunai += trx.totalBayar || 0;
    }

    // Rekap Barang Terjual & Margin
    if (trx.items && Array.isArray(trx.items)) {
      trx.items.forEach((item) => {
        const idProduk = item.idProduk || item.namaProduk;
        const modalSatuan = item.hargaBeliSatuan || 0; // Jika ada simpanan modal di data transaksi
        const tanda = item.arah === 'MASUK' ? -1 : 1;
        const qtyBertanda = (item.qty || 0) * tanda;
        const subtotalModal = qtyBertanda * modalSatuan;

        totalModal += subtotalModal;

        if (!petaProduk[idProduk]) {
          petaProduk[idProduk] = {
            namaProduk: item.namaProduk,
            totalQty: 0,
            totalOmzet: 0,
            totalModal: 0
          };
        }

        petaProduk[idProduk].totalQty += qtyBertanda;
        petaProduk[idProduk].totalOmzet += (item.subtotal || 0) * tanda;
        petaProduk[idProduk].totalModal += subtotalModal;
      });
    }
  });

  const totalLabaBersih = totalOmzet - totalModal - totalBebanKerugian;

  // Mengubah Peta Produk menjadi Array & Mengurutkan Berdasarkan Terlaris
  const daftarProdukTerlaris = Object.values(petaProduk)
    .map((p) => ({
      ...p,
      estimasiLaba: p.totalOmzet - p.totalModal
    }))
    .sort((a, b) => b.totalQty - a.totalQty);

  return (
    <div className="space-y-6">
      {/* Header & Filter Periode Ringkas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Laporan Keuangan & Penjualan</h2>
          <p className="text-xs text-gray-500">
            Analisis arus kas, pemisahan modal vs untung bersih, dan performa barang terlaris.
          </p>
        </div>

        {/* Tombol Pilihan Periode Cepat */}
        <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium border">
          <button
            onClick={() => setPeriode('HARI_INI')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periode === 'HARI_INI'
                ? 'bg-white font-bold text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriode('BULAN_INI')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periode === 'BULAN_INI'
                ? 'bg-white font-bold text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriode('SEMUA')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periode === 'SEMUA'
                ? 'bg-white font-bold text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* 1. Kartu Ringkasan Statistik Utama */}
      <RingkasanStatistik
        omzetKotor={totalOmzet}
        totalModal={totalModal}
        bebanKerugian={totalBebanKerugian}
        labaBersih={totalLabaBersih}
      />

      {/* 2. Grid Dua Kolom: Rekap Arus Kas & Produk Terlaris */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RekapPembayaran
            totalTunaiMasuk={totalTunaiMasuk}
            totalKasKeluar={totalKasKeluar}
            totalNonTunai={totalNonTunai}
            transaksiCount={transaksiTersaring.length}
          />
        </div>

        <div className="lg:col-span-2">
          <ProdukTerlaris produkList={daftarProdukTerlaris} />
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-red-800">Beban Kerugian / Barang Rusak</h3>
            <p className="text-xs text-gray-500">Nilai modal dari koreksi barang eceran pada periode terpilih.</p>
          </div>
          <span className="text-sm font-bold text-red-700">{formatRupiah(totalBebanKerugian)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-xs">
            <thead className="border-b bg-red-50 text-gray-600">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Produk</th>
                <th className="px-3 py-2">Alasan</th>
                <th className="px-3 py-2 text-right">Qty Rusak</th>
                <th className="px-3 py-2 text-right">Beban Kerugian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kerugianTersaring.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-3 py-2">
                    {new Date(log.tanggal).toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-2">{log.namaProdukGrosir || log.namaProduk}</td>
                  <td className="px-3 py-2">{log.alasan}</td>
                  <td className="px-3 py-2 text-right">{log.qtyPcs} pcs</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-700">
                    {formatRupiah(log.totalKerugian)}
                  </td>
                </tr>
              ))}
              {kerugianTersaring.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                    Belum ada catatan kerugian pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-gray-800">Rekonsiliasi Tutup Shift</h3>
          <p className="text-xs text-gray-500">Rincian kas fisik dan selisih hanya tersedia untuk Admin.</p>
        </div>
        {pesanErrorShift && <p role="alert" className="text-sm text-red-700">{pesanErrorShift}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2">Waktu Tutup</th>
                <th className="px-3 py-2">Nama Kasir</th>
                <th className="px-3 py-2 text-right">Cash Start</th>
                <th className="px-3 py-2 text-right">Tunai Masuk</th>
                <th className="px-3 py-2 text-right">Kas Keluar</th>
                <th className="px-3 py-2 text-right">Cash Expected</th>
                <th className="px-3 py-2 text-right">Cash Actual</th>
                <th className="px-3 py-2 text-right">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shiftTersaring.map((shift) => (
                <tr key={shift.idShift}>
                  <td className="whitespace-nowrap px-3 py-2">{new Date(shift.waktuTutup).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">{shift.namaKasir}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(shift.cashStart)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(shift.totalTunaiMasuk)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(shift.kasKeluar)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(shift.cashExpected)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(shift.cashActual)}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${shift.selisih < 0 ? 'text-red-700' : shift.selisih > 0 ? 'text-green-700' : 'text-gray-700'}`}>
                    {formatRupiah(shift.selisih)}
                  </td>
                </tr>
              ))}
              {shiftTersaring.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-gray-500">
                    Belum ada data shift yang ditutup pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(angka) || 0);
}