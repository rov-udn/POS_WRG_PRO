import React, { useState } from 'react';
import { useBelanjaAgen } from './hooks/useBelanjaAgen';
import DaftarProdukBelanja from './components/DaftarProdukBelanja';
import KeranjangBelanja from './components/KeranjangBelanja';
import DrafBelanjaModal from './components/DrafBelanjaModal';
import RiwayatKulakanTab from './components/RiwayatKulakanTab';

export default function BelanjaPage() {
  const [tabAktif, setTabAktif] = useState('BELANJA'); // 'BELANJA' atau 'RIWAYAT'

  const {
    daftarProduk,
    keranjangBelanja,
    namaAgen,
    setNamaAgen,
    daftarDraf,
    daftarRiwayatKulakan,
    totalEstimasiModal,
    totalQtyItems,
    tambahKeKeranjang,
    ubahQtyItem,
    hapusItemKeranjang,
    simpanKeDraf,
    toggleStatusKosongDraf,
    ubahQtyRealDraf,
    prosesSelesaiBelanja,
    hapusDraf
  } = useBelanjaAgen();

  const [kataKunci, setKataKunci] = useState('');
  const [tampilModalDraf, setTampilModalDraf] = useState(false);

 return (
    <div className="p-6 space-y-6">
      {/* 1. NAVIGASI TAB UTAMA DI AREA ATAS */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setTabAktif('BELANJA')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            tabAktif === 'BELANJA'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🛒 Perencana & Belanja Agen
        </button>
        <button
          type="button"
          onClick={() => setTabAktif('RIWAYAT')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            tabAktif === 'RIWAYAT'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📜 Riwayat Kulakan ({daftarRiwayatKulakan.length})
        </button>
      </div>

      {/* 2. KONTEN UTAMA BERDASARKAN TAB */}
      {tabAktif === 'BELANJA' ? (
        /* --- TAB 1: PERENCANA & BELANJA --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri / Tengah: Daftar Produk Belanja */}
          <div className="lg:col-span-2">
            <DaftarProdukBelanja
              daftarProduk={daftarProduk}
              kataKunci={kataKunci}
              onPilihProduk={tambahKeKeranjang}
            />
          </div>

          {/* Kolom Kanan: Keranjang Belanja */}
          <div className="lg:col-span-1">
            <KeranjangBelanja
              keranjangBelanja={keranjangBelanja}
              totalQtyItems={totalQtyItems}
              totalEstimasiModal={totalEstimasiModal}
              namaAgen={namaAgen}
              jumlahDraf={daftarDraf.length}
              onUbahNamaAgen={setNamaAgen}
              onUbahQty={ubahQtyItem}
              onHapusItem={hapusItemKeranjang}
              onResetKeranjang={() => {
                // panggil fungsi reset keranjang jika ada
              }}
              onSimpanDraf={simpanKeDraf}
              onBukaDraf={() => setTampilModalDraf(true)}
            />
          </div>
        </div>
      ) : (
        /* --- TAB 2: KHUSUS RIWAYAT KULAKAN --- */
        <RiwayatKulakanTab daftarRiwayat={daftarRiwayatKulakan} />
      )}

      {/* 3. MODAL DRAF BELANJA (Di-render terpisah di luar grid) */}
      <DrafBelanjaModal
        isOpen={tampilModalDraf}
        onClose={() => setTampilModalDraf(false)}
        daftarDraf={daftarDraf}
        onToggleKosong={toggleStatusKosongDraf}
        onUbahQtyReal={ubahQtyRealDraf}
        onKirimKeGudang={prosesSelesaiBelanja}
        onHapusDraf={hapusDraf}
      />
    </div>
  );
}