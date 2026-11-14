import React, { useRef, useState } from 'react';
import { useKasir } from './hooks/useKasir';
import PencarianProduk from './components/PencarianProduk';
import DaftarProdukKasir from './components/DaftarProdukKasir';
import FilterKategori from '../../components/ui/FilterKategori';
import KeranjangKasir from './components/KeranjangKasir';
import Pembayaran from './components/Pembayaran';
import Nota from './components/Nota';
import ReturTukar from './components/ReturTukar';
import QuickButtonEceran from './components/QuickButtonEceran';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';

export default function KasirPage({ profil, pengguna }) {
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
    tambahEceranCepat,
    ubahQtyItem,
    hapusItemKeranjang,
    prosesBayar,
    prosesReturTukar,
    resetTransaksiSelesai,
    resetKeranjang,
    daftarDraf,
    tahanTransaksi,
    panggilDraf,
    hapusDraf,
    produkKeranjangBerubah,
  } = useKasir({
    storeId: profil?.store_id,
    idKasir: pengguna?.uid,
    namaKasir: profil?.nama || profil?.email
  });

  const [kataKunci, setKataKunci] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('');
  const [modeKasir, setModeKasir] = useState('PENJUALAN');
  const [tabMobile, setTabMobile] = useState('DAFTAR');
  const [tampilModalPembayaran, setTampilModalPembayaran] = useState(false);
  const [tampilModalDraf, setTampilModalDraf] = useState(false);
  const searchInputRef = useRef(null);

  const bukaPembayaran = () => {
    if (!transaksiSelesai && !tampilModalDraf && keranjang.length > 0) {
      setTampilModalPembayaran(true);
    }
  };

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

  useKeyboardShortcuts({
    onFocusSearch: () => {
      if (modeKasir === 'PENJUALAN' && !transaksiSelesai && !tampilModalPembayaran && !tampilModalDraf) {
        searchInputRef.current?.focus();
      }
    },
    isPaymentOpen: () => tampilModalPembayaran,
    onCheckout: () => {
      if (modeKasir !== 'PENJUALAN') return;
      if (tampilModalPembayaran) {
        handleProsesPembayaran();
      } else {
        bukaPembayaran();
      }
    },
    onConfirmPayment: () => {
      if (modeKasir !== 'PENJUALAN' || !tampilModalPembayaran) return false;
      handleProsesPembayaran();
      return true;
    },
    onClearCart: () => {
      if (
        transaksiSelesai ||
        modeKasir !== 'PENJUALAN' ||
        tampilModalPembayaran ||
        tampilModalDraf ||
        keranjang.length === 0
      ) {
        return;
      }
      if (window.confirm('Yakin ingin mengosongkan seluruh keranjang belanja?')) {
        resetKeranjang();
      }
    },
    onEscape: () => {
      if (transaksiSelesai) {
        resetTransaksiSelesai();
        return true;
      }
      if (tampilModalPembayaran) {
        setTampilModalPembayaran(false);
        return true;
      }
      if (tampilModalDraf) {
        setTampilModalDraf(false);
        return true;
      }
      return false;
    }
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen pb-36 lg:pb-6">
      
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

      <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setModeKasir('PENJUALAN')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            modeKasir === 'PENJUALAN' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Penjualan
        </button>
        <button
          type="button"
          onClick={() => setModeKasir('RETUR_TUKAR')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            modeKasir === 'RETUR_TUKAR' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Retur & Tukar
        </button>
      </div>

      {modeKasir === 'RETUR_TUKAR' ? (
        <div className="mt-4">
          <ReturTukar daftarProduk={daftarProduk} onProses={prosesReturTukar} />
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-100 p-1 lg:hidden">
            <button
              type="button"
              aria-pressed={tabMobile === 'DAFTAR'}
              onClick={() => setTabMobile('DAFTAR')}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                tabMobile === 'DAFTAR' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Daftar Barang
            </button>
            <button
              type="button"
              aria-pressed={tabMobile === 'KERANJANG'}
              onClick={() => setTabMobile('KERANJANG')}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                tabMobile === 'KERANJANG' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Keranjang Saya ({keranjang.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className={`lg:col-span-7 xl:col-span-8 space-y-4 ${
              tabMobile === 'DAFTAR' ? 'block' : 'hidden'
            } lg:block`}>
              <QuickButtonEceran
                daftarProduk={daftarProduk}
                onTambah={tambahEceranCepat}
              />
              <PencarianProduk
                kataKunci={kataKunci}
                onUbahKataKunci={setKataKunci}
                onScanBarcode={handleScanBarcode}
                searchInputRef={searchInputRef}
              />
              <FilterKategori
                daftarProduk={daftarProduk}
                kategoriAktif={kategoriAktif}
                onUbahKategori={setKategoriAktif}
              />
              <DaftarProdukKasir
                daftarProduk={daftarProduk}
                kataKunci={kataKunci}
                kategoriAktif={kategoriAktif}
                onPilihProduk={tambahKeKeranjang}
                keranjang={keranjang}
              />
            </div>
            <div className={`h-[calc(100dvh-280px)] min-h-[280px] lg:col-span-5 xl:col-span-4 lg:h-auto lg:min-h-0 lg:sticky lg:top-4 ${
              tabMobile === 'KERANJANG' ? 'block' : 'hidden'
            } lg:block`}>
              <KeranjangKasir
                keranjang={keranjang}
                totalQtyItems={totalQtyItems}
                totalBayar={totalBayar}
                daftarDraf={daftarDraf}
                tampilModalDraf={tampilModalDraf}
                produkBerubah={produkKeranjangBerubah}
                onTahanTransaksi={tahanTransaksi}
                onPanggilDraf={panggilDraf}
                onHapusDraf={hapusDraf}
                onBukaModalDraf={() => setTampilModalDraf(true)}
                onTutupModalDraf={() => setTampilModalDraf(false)}
                onUbahQty={ubahQtyItem}
                onHapusItem={hapusItemKeranjang}
                onResetKeranjang={resetKeranjang}
                onLanjutPembayaran={bukaPembayaran}
              />
            </div>
          </div>

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

          {transaksiSelesai && (
            <Nota
              transaksi={transaksiSelesai}
              onTutupNota={resetTransaksiSelesai}
            />
          )}
        </>
      )}

    </div>
  );
}