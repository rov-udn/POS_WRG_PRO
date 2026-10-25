import React, { useState } from 'react';

export default function DaftarProdukKasir({
  daftarProduk,
  kataKunci,
  onPilihProduk
}) {
  // Simpan pilihan satuan aktif untuk produk tertentu { [idProduk]: idSatuan }
  const [satuanTerpilih, setSatuanTerpilih] = useState({});

  const produkTersaring = daftarProduk.filter((produk) => {
    const q = kataKunci.toLowerCase();
    const cocokNama = produk.namaProduk?.toLowerCase().includes(q);
    const cocokBarcode = produk.listSatuan?.some((s) =>
      s.barcode?.toLowerCase().includes(q)
    );
    return cocokNama || cocokBarcode;
  });

  if (produkTersaring.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <span className="text-4xl mb-2">🔍</span>
        <p className="font-semibold text-sm">Produk tidak ditemukan</p>
        <p className="text-xs text-gray-400 mt-1">Coba kata kunci atau barcode lain</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2.5 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
      {produkTersaring.map((produk) => {
        const stok = Number(produk.stokUtama) || 0;
        const apakahHabis = stok <= 0;
        const apakahSedikit = stok > 0 && stok <= 10;

        const listSatuan = produk.listSatuan || [];
        const satuanBase = listSatuan.find((s) => s.isBase) || listSatuan[0] || {};

        // Tentukan satuan mana yang sedang dipilih untuk produk ini
        const idSatuanAktif = satuanTerpilih[produk.idProduk] || satuanBase.idSatuan;
        const satuanAktif = listSatuan.find((s) => s.idSatuan === idSatuanAktif) || satuanBase;

        const handlePilihSatuan = (idSatuan) => {
          setSatuanTerpilih((prev) => ({ ...prev, [produk.idProduk]: idSatuan }));
        };

        return (
          <div
            key={produk.idProduk}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 ${
              apakahHabis
                ? 'bg-gray-100 border-gray-200 opacity-60'
                : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md'
            }`}
          >
            {/* Kiri: Nama Produk, Badge Stok, & Chip Satuan */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="font-bold text-gray-800 text-base md:text-lg truncate">
                  {produk.namaProduk}
                </h3>

                {/* Badge Stok Lebih Besar */}
                {apakahHabis ? (
                  <span className="shrink-0 px-2.5 py-0.5 text-xs font-black text-red-700 bg-red-100 rounded-lg">
                    Habis
                  </span>
                ) : apakahSedikit ? (
                  <span className="shrink-0 px-2.5 py-0.5 text-xs font-black text-amber-800 bg-amber-100 rounded-lg">
                    Sisa {stok} {satuanBase.namaSatuan || 'Pcs'}
                  </span>
                ) : (
                  <span className="shrink-0 px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 rounded-lg">
                    Stok {stok}
                  </span>
                )}
              </div>

              {/* Pilihan Chip Satuan (Lebih Besar & Nyaman Di-tap) */}
              {listSatuan.length > 1 && !apakahHabis && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-gray-400 font-medium mr-1">Satuan:</span>
                  {listSatuan.map((s) => {
                    const isSelected = s.idSatuan === idSatuanAktif;
                    return (
                      <button
                        key={s.idSatuan}
                        type="button"
                        onClick={() => handlePilihSatuan(s.idSatuan)}
                        className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm scale-105'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {s.namaSatuan}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Kanan: Harga & Tombol Tambah Cepat (Besar) */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-blue-700 font-black text-lg md:text-xl">
                  Rp{(Number(satuanAktif.hargaJual) || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  per {satuanAktif.namaSatuan || 'Pcs'}
                </div>
              </div>

              <button
                type="button"
                disabled={apakahHabis}
                onClick={() => onPilihProduk(produk, satuanAktif)}
                className={`w-11 h-11 rounded-xl font-black text-xl flex items-center justify-center transition-all ${
                  apakahHabis
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-90'
                }`}
                title="Tambah ke keranjang"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}