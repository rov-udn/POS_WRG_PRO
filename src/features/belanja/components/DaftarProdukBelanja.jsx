import React, { useState } from 'react';

export default function DaftarProdukBelanja({
  daftarProduk,
  kataKunci,
  onPilihProduk
}) {
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
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <span className="text-3xl mb-1">🔍</span>
        <p className="font-medium text-xs">Produk tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
      {produkTersaring.map((produk) => {
        const stok = Number(produk.stokUtama) || 0;
        const apakahSedikit = stok <= 10;

        const listSatuan = produk.listSatuan || [];
        const satuanBase = listSatuan.find((s) => s.isBase) || listSatuan[0] || {};

        const idSatuanAktif = satuanTerpilih[produk.idProduk] || satuanBase.idSatuan;
        const satuanAktif = listSatuan.find((s) => s.idSatuan === idSatuanAktif) || satuanBase;

        const handlePilihSatuan = (idSatuan) => {
          setSatuanTerpilih((prev) => ({ ...prev, [produk.idProduk]: idSatuan }));
        };

        return (
          <div
            key={produk.idProduk}
            className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-xs transition-all"
          >
            {/* Kiri: Nama Produk & Stok Saat Ini */}
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-800 text-sm md:text-base truncate">
                  {produk.namaProduk}
                </h3>
                {apakahSedikit ? (
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 bg-amber-100 rounded-md">
                    Stok Sisa {stok}
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 rounded-md">
                    Stok {stok}
                  </span>
                )}
              </div>

              {/* Chip Pilihan Satuan Kulakan (Dus / Grosir / Pcs) */}
              {listSatuan.length > 1 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-gray-400 font-medium">Beli Satuan:</span>
                  {listSatuan.map((s) => {
                    const isSelected = s.idSatuan === idSatuanAktif;
                    return (
                      <button
                        key={s.idSatuan}
                        type="button"
                        onClick={() => handlePilihSatuan(s.idSatuan)}
                        className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
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

            {/* Kanan: Harga Modal/Beli & Tombol Tambah */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-emerald-700 font-black text-base md:text-lg">
                  Rp{(Number(satuanAktif.hargaBeli) || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">
                  Harga Modal / {satuanAktif.namaSatuan || 'Pcs'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPilihProduk(produk, satuanAktif)}
                className="w-10 h-10 rounded-xl font-black text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-90 transition-all flex items-center justify-center"
                title="Tambah ke daftar belanja agen"
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