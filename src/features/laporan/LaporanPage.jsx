import React, { useState, useEffect } from 'react';
import RingkasanStatistik from './components/RingkasanStatistik';
import RekapPembayaran from './components/RekapPembayaran';
import ProdukTerlaris from './components/ProdukTerlaris';

const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';

export default function LaporanPage() {
  const [daftarTransaksi, setDaftarTransaksi] = useState([]);
  const [periode, setPeriode] = useState('SEMUA'); // 'HARI_INI' | 'BULAN_INI' | 'SEMUA'

  // Mengambil data transaksi dari localStorage saat halaman dimuat
  useEffect(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_TRANSAKSI);
      if (data) {
        setDaftarTransaksi(JSON.parse(data));
      }
    } catch (e) {
      console.error("Gagal memuat data transaksi untuk laporan:", e);
    }
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

  // --- Perhitungan Kalkulasi Otomatis ---
  let totalOmzet = 0;
  let totalModal = 0;
  let totalTunai = 0;
  let totalNonTunai = 0;
  const petaProduk = {};

  transaksiTersaring.forEach((trx) => {
    totalOmzet += trx.totalBayar || 0;

    // Rekap Jalur Pembayaran
    if (trx.metodePembayaran === 'CASH') {
      totalTunai += trx.totalBayar || 0;
    } else {
      totalNonTunai += trx.totalBayar || 0;
    }

    // Rekap Barang Terjual & Margin
    if (trx.items && Array.isArray(trx.items)) {
      trx.items.forEach((item) => {
        const idProduk = item.idProduk || item.namaProduk;
        const modalSatuan = item.hargaBeliSatuan || 0; // Jika ada simpanan modal di data transaksi
        const subtotalModal = (item.qty || 0) * modalSatuan;

        totalModal += subtotalModal;

        if (!petaProduk[idProduk]) {
          petaProduk[idProduk] = {
            namaProduk: item.namaProduk,
            totalQty: 0,
            totalOmzet: 0,
            totalModal: 0
          };
        }

        petaProduk[idProduk].totalQty += item.qty || 0;
        petaProduk[idProduk].totalOmzet += item.subtotal || 0;
        petaProduk[idProduk].totalModal += subtotalModal;
      });
    }
  });

  const totalLabaBersih = totalOmzet - totalModal;

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
        labaBersih={totalLabaBersih}
      />

      {/* 2. Grid Dua Kolom: Rekap Arus Kas & Produk Terlaris */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RekapPembayaran
            totalTunai={totalTunai}
            totalNonTunai={totalNonTunai}
            transaksiCount={transaksiTersaring.length}
          />
        </div>

        <div className="lg:col-span-2">
          <ProdukTerlaris produkList={daftarProdukTerlaris} />
        </div>
      </div>
    </div>
  );
}