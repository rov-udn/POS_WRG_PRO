import React, { useState } from 'react';
import { useKasir } from './hooks/useKasir';
import PencarianProduk from './components/PencarianProduk';
import DaftarProdukKasir from './components/DaftarProdukKasir';
import KeranjangKasir from './components/KeranjangKasir';
import Pembayaran from './components/Pembayaran';
import Nota from './components/Nota';

export default function KasirPage() {
  const {
    daftarProduk,
    keranjang,
    metodePembayaran,
    setMetodePembayaran,
    jumlahUangDiterima,
    setJumlahUangDiterima,
    totalBayar,
    totalQtyItems,
    kembalian,
    transaksiSelesai,
    dapatkanNominalCepat,
    pilihNominalCepat,
    tambahKeKeranjang,
    ubahQtyItem,
    hapusItemKeranjang,
    prosesBayar,
    resetTransaksiSelesai,
    resetKeranjang,
    daftarDraf,
    tahanTransaksi,
    panggilDraf,
    hapusDraf,
  } = useKasir();

  const [kataKunci, setKataKunci] = useState('');
  const [tampilModalPembayaran, setTampilModalPembayaran] = useState(false);

  // Penanganan scanner barcode
  const handleScanBarcode = (kode) => {
    let ditemukan = false;

    for (const produk of daftarProduk) {
      const satuanCocok = produk.listSatuan?.find(
        (s) => s.barcode?.toLowerCase() === kode.toLowerCase()
      );

      if (satuanCocok) {
        tambahKeKeranjang(produk, satuanCocok);
        ditemukan = true;
        setKataKunci('');
        break;
      }
    }

    if (!ditemukan) {
      alert(`Barcode "${kode}" tidak ditemukan di master produk!`);
    }
  };

  const handleProsesPembayaran = () => {
    const sukses = prosesBayar();
    if (sukses) {
      setTampilModalPembayaran(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen pb-24 md:pb-6">
      
      {/* Title / Header Menu */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            🏪 Menu Kasir Warung
          </h1>
          <p className="text-xs text-gray-500">
            Pilih atau scan produk untuk mulai menambahkan ke keranjang
          </p>
        </div>
      </div>

      {/* Grid Utama Layout Kasir */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Kolom Kiri (Lg: 7-8 Cols): Pencarian & Katalog Produk */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <PencarianProduk
            kataKunci={kataKunci}
            onUbahKataKunci={setKataKunci}
            onScanBarcode={handleScanBarcode}
          />

          <DaftarProdukKasir
            daftarProduk={daftarProduk}
            kataKunci={kataKunci}
            onPilihProduk={tambahKeKeranjang}
          />
        </div>

        {/* Kolom Kanan (Lg: 4-5 Cols): Keranjang Belanja */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
          <KeranjangKasir
            keranjang={keranjang}
            totalQtyItems={totalQtyItems}
            totalBayar={totalBayar}
            daftarDraf={daftarDraf}
            onTahanTransaksi={tahanTransaksi}
            onPanggilDraf={panggilDraf}
            onHapusDraf={hapusDraf}
            onUbahQty={ubahQtyItem}
            onHapusItem={hapusItemKeranjang}
            onResetKeranjang={resetKeranjang}
            onLanjutPembayaran={() => setTampilModalPembayaran(true)}
          />
        </div>

      </div>

      {/* Modal Pembayaran (Dengan Quick Amount Chips) */}
      {tampilModalPembayaran && (
        <Pembayaran
          totalBayar={totalBayar}
          metodePembayaran={metodePembayaran}
          onUbahMetodePembayaran={setMetodePembayaran}
          jumlahUangDiterima={jumlahUangDiterima}
          onUbahUangDiterima={setJumlahUangDiterima}
          dapatkanNominalCepat={dapatkanNominalCepat}
          pilihNominalCepat={pilihNominalCepat}
          kembalian={kembalian}
          onProsesBayar={handleProsesPembayaran}
          onBatal={() => setTampilModalPembayaran(false)}
        />
      )}

      {/* Modal Nota Struk (Muncul Setelah Transaksi Selesai) */}
      {transaksiSelesai && (
        <Nota
          transaksi={transaksiSelesai}
          onTutupNota={resetTransaksiSelesai}
        />
      )}

    </div>
  );
}