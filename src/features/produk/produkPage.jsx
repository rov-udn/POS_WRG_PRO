import { useEffect, useRef, useState } from 'react';
import { useProduk } from './hooks/useProduk';
import CariProduk from './components/CariProduk';
import ProdukDetail from './components/ProdukDetail';
import ProdukForm from './components/ProdukForm';
import ImportProdukJson from './components/ImportProdukJson';
import { filterProdukKurangLengkap, filterProdukRugi } from './utils/cekRugi';

export default function ProdukPage() {
  const daftarRef = useRef(null);
  const detailRef = useRef(null);
  const [filterAktif, setFilterAktif] = useState(null);
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
  const daftarProdukRugi = filterProdukRugi(daftarProdukAsli);
  const daftarProdukKurangLengkap = filterProdukKurangLengkap(daftarProdukAsli);
  const daftarProdukTampil = filterAktif === 'rugi'
    ? filterProdukRugi(daftarProduk)
    : filterAktif === 'kurangLengkap'
      ? filterProdukKurangLengkap(daftarProduk)
      : daftarProduk;
  const idProdukDipilih = produkDipilih?.idProduk;

  useEffect(() => {
    if (idProdukDipilih) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [idProdukDipilih]);

  useEffect(() => {
    const tutupJikaKlikDiLuar = (event) => {
      if (daftarRef.current && !daftarRef.current.contains(event.target)) {
        tutupDetail();
      }
    };

    document.addEventListener('pointerdown', tutupJikaKlikDiLuar);
    return () => document.removeEventListener('pointerdown', tutupJikaKlikDiLuar);
  }, [tutupDetail]);

  const pilihAtauTutupProduk = (item) => {
    if (produkDipilih?.idProduk === item.idProduk) {
      tutupDetail();
      return;
    }
    pilihProduk(item);
  };

  return (
    <div className="w-full p-4 space-y-4">
      {/* Header Halaman */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">Master Produk</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ImportProdukJson />
          <button
            onClick={bukaFormTambah}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            + Tambah Produk
          </button>
        </div>
      </div>

      {daftarProdukRugi.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-semibold">Peringatan potensi rugi</p>
          <p className="mt-1">
            Ada {daftarProdukRugi.length} produk dengan harga jual di bawah atau sama dengan harga modal.
          </p>
        </div>
      )}

      {daftarProdukKurangLengkap.length > 0 && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          <p>
            <span className="font-semibold">Data produk belum lengkap:</span>{' '}
            {daftarProdukKurangLengkap.length} produk memiliki kategori atau harga satuan yang belum diisi.
          </p>
          <button
            type="button"
            onClick={() => {
              setKataKunci('');
              setFilterAktif('kurangLengkap');
            }}
            className="whitespace-nowrap rounded-md bg-amber-100 px-2.5 py-1 font-semibold text-amber-900 transition-colors hover:bg-amber-200"
          >
            Tampilkan produk
          </button>
        </div>
      )}

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

      <div ref={daftarRef} className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-700">
            Daftar Barang <span className="ml-1 text-gray-400">({daftarProdukTampil.length})</span>
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              aria-pressed={filterAktif === 'rugi'}
              onClick={() => setFilterAktif((aktif) => aktif === 'rugi' ? null : 'rugi')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterAktif === 'rugi'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterAktif === 'rugi' ? 'Tampilkan Semua Produk' : 'Produk Berpotensi Rugi'}
            </button>
            <button
              type="button"
              aria-pressed={filterAktif === 'kurangLengkap'}
              onClick={() => setFilterAktif((aktif) => aktif === 'kurangLengkap' ? null : 'kurangLengkap')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterAktif === 'kurangLengkap'
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterAktif === 'kurangLengkap' ? 'Tampilkan Semua Produk' : 'Data Belum Lengkap'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {daftarProdukTampil.map((item) => {
            const detailTerbuka = produkDipilih?.idProduk === item.idProduk;
            const idDetail = `detail-produk-${item.idProduk}`;

            return (
              <div key={item.idProduk} className="transition-colors">
                <div className={`flex items-center gap-3 px-3 py-3 transition-colors sm:px-4 ${
                  detailTerbuka ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                }`}>
                  <button
                    type="button"
                    aria-expanded={detailTerbuka}
                    aria-controls={idDetail}
                    onClick={() => pilihAtauTutupProduk(item)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      detailTerbuka ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.namaProduk?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">
                        {item.namaProduk || 'Produk tanpa nama'}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {item.kategori || 'Tanpa kategori'}
                        {item.satuanTerkecil ? ` · ${item.satuanTerkecil}` : ''}
                      </span>
                    </span>
                    <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
                      detailTerbuka ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {detailTerbuka ? 'Detail terbuka' : 'Lihat detail'}
                    </span>
                    <span aria-hidden="true" className={`text-gray-400 transition-transform duration-300 ${
                      detailTerbuka ? 'rotate-180' : ''
                    }`}>
                      ▾
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-3 border-l border-gray-200 pl-3">
                    <button
                      type="button"
                      onClick={() => bukaFormEdit(item)}
                      className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus produk "${item.namaProduk}"?`)) {
                          hapusProduk(item.idProduk);
                        }
                      }}
                      className="text-xs font-semibold text-red-600 transition-colors hover:text-red-800"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div
                  id={idDetail}
                  ref={detailTerbuka ? detailRef : null}
                  aria-hidden={!detailTerbuka}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    detailTerbuka ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-3 sm:p-5">
                      <ProdukDetail
                        produk={detailTerbuka ? produkDipilih : null}
                        onTutup={tutupDetail}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {daftarProdukTampil.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">
              {daftarProdukAsli.length === 0
                ? 'Belum ada produk tersimpan.'
                : filterAktif === 'rugi'
                  ? 'Tidak ada produk yang berpotensi rugi.'
                  : filterAktif === 'kurangLengkap'
                    ? 'Tidak ada produk dengan data yang belum lengkap.'
                    : 'Produk tidak ditemukan.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}