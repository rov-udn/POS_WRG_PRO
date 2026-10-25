import React from 'react';
import { useProduk } from './hooks/useProduk';
import CariProduk from './components/CariProduk';
import ProdukDetail from './components/ProdukDetail';
import ProdukForm from './components/ProdukForm';

export default function ProdukPage() {
  const {
    daftarProduk, // Ini sudah berupa array hasil filter dari hook
    daftarProdukAsli,
    kataKunci,
    setKataKunci,
    produkDipilih,
    produkEdit,
    tampilkanForm,
    bukaFormTambah,
    bukaFormEdit,
    tutupForm,
    simpanProduk,
    hapusProduk,
    pilihProduk,
    tutupDetail
  } = useProduk();

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Header Halaman */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Master Produk</h1>
        <button
          onClick={bukaFormTambah}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Pencarian (Memanggil state dan setter dari hook) */}
      <CariProduk kataKunci={kataKunci} onUbahKataKunci={setKataKunci} />

      {/* Area Form Modal (Jika Tampil) */}
      {tampilkanForm && (
        <ProdukForm
          isOpen={tampilkanForm}
          onClose={tutupForm}
          dataAwal={produkEdit}
          onSubmit={simpanProduk}
        />
      )}

      {/* Layout Utama: Daftar Produk dan Detail Produk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom Kiri: Daftar Produk */}
        <div className="border rounded-lg p-3 bg-white shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-gray-700 border-b pb-2">
            Daftar Barang ({daftarProduk.length})
          </h2>

          <div className="divide-y divide-gray-100">
            {daftarProduk.map((item) => (
              <div
                key={item.idProduk}
                className={`flex justify-between items-center py-2.5 px-2 rounded cursor-pointer transition-colors ${
                  produkDipilih?.idProduk === item.idProduk
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => pilihProduk(item)}
              >
                <div>
                  <p className="font-medium text-sm text-gray-800">{item.namaProduk}</p>
                  <p className="text-xs text-gray-500">{item.kategori}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      bukaFormEdit(item);
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus produk "${item.namaProduk}"?`)) {
                        hapusProduk(item.idProduk);
                      }
                    }}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}

            {daftarProduk.length === 0 && (
              <p className="text-gray-500 text-sm py-6 text-center">
                {daftarProdukAsli.length === 0
                  ? 'Belum ada produk tersimpan.'
                  : 'Produk tidak ditemukan.'}
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail Produk */}
        <div>
          {produkDipilih ? (
            <ProdukDetail produk={produkDipilih} onTutup={tutupDetail} />
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-400 bg-gray-50 text-sm">
              Pilih salah satu produk untuk melihat rincian satuan, stok, dan marginnya.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}