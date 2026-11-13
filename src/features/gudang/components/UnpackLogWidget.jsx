import { useEffect, useMemo, useState } from 'react';
import {
  beriTahuProdukDiperbarui,
  EVENT_PRODUK_DIPERBARUI
} from '../../produk/utils/produkUtils';
import {
  bacaTombolCepat,
  EVENT_QUICK_BUTTONS_UPDATED,
  KUNCI_STORAGE_QUICK_BUTTONS
} from '../../kasir/utils/unpackItems';
import { buatKunciStorageProduk } from '../../produk/utils/produkStorage';

const KUNCI_STORAGE_UNPACK = 'active_unpack_items';
const KUNCI_STORAGE_SHRINKAGE = 'pos_warung_shrinkage_logs';
const EVENT_UNPACK_DIPERBARUI = 'active-unpack-items-updated';
const ALASAN_RUSAK = [
  'Pecah/Bocor',
  'Kadaluarsa',
  'Hilang/Selisih',
  'Konsumsi Sendiri'
];

function buatIdUnpack() {
  return `UNPACK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function bacaDaftarProduk(kunciStorageProduk) {
  if (!kunciStorageProduk) return [];
  const data = localStorage.getItem(kunciStorageProduk);
  if (!data) return [];

  const hasil = JSON.parse(data);
  if (!Array.isArray(hasil)) {
    throw new Error('Data produk harus berupa daftar.');
  }
  return hasil;
}

function bacaItemAktif() {
  const data = localStorage.getItem(KUNCI_STORAGE_UNPACK);
  if (!data) return [];

  const hasil = JSON.parse(data);
  if (!Array.isArray(hasil)) {
    throw new Error('Data barang eceran aktif harus berupa daftar.');
  }
  return hasil;
}

function dapatkanKemasanGrosir(produk) {
  return (produk.listSatuan || []).filter((satuan) => {
    const rasio = Number(satuan.rasio);
    return !satuan.isBase && Number.isFinite(rasio) && rasio > 1;
  });
}

function formatTanggal(tanggal) {
  const nilaiTanggal = new Date(tanggal);
  return Number.isNaN(nilaiTanggal.getTime())
    ? '-'
    : new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(nilaiTanggal);
}

export default function UnpackLogWidget({ storeId }) {
  const KUNCI_STORAGE_PRODUK = buatKunciStorageProduk(storeId);
  const [itemAktif, setItemAktif] = useState(() => {
    try {
      return bacaItemAktif();
    } catch (error) {
      console.error('Gagal memuat barang eceran aktif:', error);
      return [];
    }
  });
  const [daftarProduk, setDaftarProduk] = useState(() => {
    try {
      return bacaDaftarProduk(KUNCI_STORAGE_PRODUK);
    } catch (error) {
      console.error('Gagal memuat produk untuk dibuka:', error);
      return [];
    }
  });
  const [daftarTombolCepat, setDaftarTombolCepat] = useState(() => {
    try {
      return bacaTombolCepat();
    } catch (error) {
      console.error('Gagal memuat daftar tombol cepat:', error);
      return [];
    }
  });
  const [tahapModalBuka, setTahapModalBuka] = useState(0);
  const [produkDipilih, setProdukDipilih] = useState(null);
  const [idSatuanDipilih, setIdSatuanDipilih] = useState('');
  const [idTombolCepat, setIdTombolCepat] = useState('');
  const [itemUntukKoreksi, setItemUntukKoreksi] = useState(null);
  const [qtyRusak, setQtyRusak] = useState('1');
  const [alasanRusak, setAlasanRusak] = useState(ALASAN_RUSAK[0]);
  const [kataKunci, setKataKunci] = useState('');
  const [pesanError, setPesanError] = useState('');

  const produkTersaring = useMemo(() => {
    const kata = kataKunci.trim().toLocaleLowerCase('id-ID');
    return daftarProduk.filter((produk) => {
      const bisaDibuka = dapatkanKemasanGrosir(produk).length > 0;
      return bisaDibuka &&
        (!kata || String(produk.namaProduk || '').toLocaleLowerCase('id-ID').includes(kata));
    });
  }, [daftarProduk, kataKunci]);
  const kemasanProdukDipilih = produkDipilih ? dapatkanKemasanGrosir(produkDipilih) : [];

  useEffect(() => {
    const muatProduk = () => {
      try {
        setDaftarProduk(bacaDaftarProduk(KUNCI_STORAGE_PRODUK));
      } catch (error) {
        console.error('Gagal memuat produk yang diperbarui:', error);
        setPesanError('Data produk tidak dapat dibaca. Periksa penyimpanan produk.');
      }
    };
    const muatItemAktif = () => {
      try {
        setItemAktif(bacaItemAktif());
      } catch (error) {
        console.error('Gagal memuat barang eceran aktif yang diperbarui:', error);
      }
    };
    const muatTombolCepat = () => {
      try {
        setDaftarTombolCepat(bacaTombolCepat());
      } catch (error) {
        console.error('Gagal memuat daftar tombol cepat yang diperbarui:', error);
        setPesanError('Daftar tombol cepat tidak dapat dibaca.');
      }
    };
    const tanganiStorage = (event) => {
      if (
        event.key === KUNCI_STORAGE_PRODUK
      ) muatProduk();
      if (event.key === KUNCI_STORAGE_UNPACK) muatItemAktif();
      if (event.key === KUNCI_STORAGE_QUICK_BUTTONS) muatTombolCepat();
    };

    window.addEventListener('storage', tanganiStorage);
    window.addEventListener(EVENT_PRODUK_DIPERBARUI, muatProduk);
    window.addEventListener(EVENT_UNPACK_DIPERBARUI, muatItemAktif);
    window.addEventListener(EVENT_QUICK_BUTTONS_UPDATED, muatTombolCepat);
    return () => {
      window.removeEventListener('storage', tanganiStorage);
      window.removeEventListener(EVENT_PRODUK_DIPERBARUI, muatProduk);
      window.removeEventListener(EVENT_UNPACK_DIPERBARUI, muatItemAktif);
      window.removeEventListener(EVENT_QUICK_BUTTONS_UPDATED, muatTombolCepat);
    };
  }, [KUNCI_STORAGE_PRODUK]);

  const bukaKemasan = (produk, satuan, tombolCepat) => {
    setPesanError('');
    let dataProdukSebelumnya;
    let dataUnpackSebelumnya;

    try {
      if (!KUNCI_STORAGE_PRODUK) {
        throw new Error('ID toko aktif tidak tersedia.');
      }
      const kunciProduk = KUNCI_STORAGE_PRODUK;
      dataProdukSebelumnya = localStorage.getItem(kunciProduk);
      dataUnpackSebelumnya = localStorage.getItem(KUNCI_STORAGE_UNPACK);

      const produkTerkini = bacaDaftarProduk(KUNCI_STORAGE_PRODUK);
      const target = produkTerkini.find((item) => item.idProduk === produk.idProduk);
      if (!target) {
        setPesanError('Produk tidak ditemukan. Muat ulang daftar produk lalu coba lagi.');
        return;
      }

      const satuanTerkini = (target.listSatuan || []).find(
        (item) => item.idSatuan === satuan.idSatuan
      );
      const rasio = Number(satuanTerkini?.rasio);
      const stok = Number(target.stokUtama);
      if (!Number.isFinite(rasio) || rasio <= 1 || !Number.isFinite(stok)) {
        setPesanError('Rasio kemasan atau stok produk tidak valid.');
        return;
      }
      if (stok < rasio) {
        setPesanError(
          `Stok ${target.namaProduk} tidak cukup untuk membuka 1 ${satuanTerkini.namaSatuan}.`
        );
        return;
      }

      const stokBaru = Number((stok - rasio).toPrecision(12));
      const daftarProdukBaru = produkTerkini.map((item) =>
        item.idProduk === target.idProduk
          ? { ...item, stokUtama: stokBaru }
          : item
      );
      const satuanDasar = (target.listSatuan || []).find((item) => item.isBase) ||
        (target.listSatuan || []).find((item) => Number(item.rasio) === 1);
      const daftarUnpackBaru = [
        {
          id: buatIdUnpack(),
          namaProdukGrosir: `${target.namaProduk} - ${satuanTerkini.namaSatuan}`,
          idProduk: target.idProduk,
          namaProduk: target.namaProduk,
          kategori: target.kategori || '',
          idTombolCepat: tombolCepat.id,
          labelTombolCepat: tombolCepat.label,
          kategoriTombolCepat: tombolCepat.kategori,
          namaSatuanEceran: target.satuanTerkecil || 'Pcs',
          hargaModalEceran: Number(satuanDasar?.hargaBeli) || 0,
          sisaQtyEceran: rasio,
          totalSisaPcs: rasio,
          tanggalBuka: new Date().toISOString()
        },
        ...bacaItemAktif()
      ];

      localStorage.setItem(kunciProduk, JSON.stringify(daftarProdukBaru));
      localStorage.setItem(KUNCI_STORAGE_UNPACK, JSON.stringify(daftarUnpackBaru));
      setDaftarProduk(daftarProdukBaru);
      setItemAktif(daftarUnpackBaru);
      setTahapModalBuka(0);
      setProdukDipilih(null);
      setIdSatuanDipilih('');
      setIdTombolCepat('');
      setKataKunci('');
      window.dispatchEvent(new Event(EVENT_UNPACK_DIPERBARUI));
      beriTahuProdukDiperbarui();
    } catch (error) {
      console.error('Gagal membuka kemasan grosir:', error);
      try {
        if (dataProdukSebelumnya === null) {
          if (KUNCI_STORAGE_PRODUK) localStorage.removeItem(KUNCI_STORAGE_PRODUK);
        } else if (dataProdukSebelumnya !== undefined) {
          if (KUNCI_STORAGE_PRODUK) {
            localStorage.setItem(KUNCI_STORAGE_PRODUK, dataProdukSebelumnya);
          }
        }
        if (dataUnpackSebelumnya === null) {
          localStorage.removeItem(KUNCI_STORAGE_UNPACK);
        } else if (dataUnpackSebelumnya !== undefined) {
          localStorage.setItem(KUNCI_STORAGE_UNPACK, dataUnpackSebelumnya);
        }
      } catch (restoreError) {
        console.error('Gagal memulihkan data setelah pembukaan kemasan gagal:', restoreError);
      }
      setPesanError('Gagal menyimpan pembukaan kemasan. Periksa kapasitas penyimpanan lalu coba lagi.');
    }
  };

  const koreksiBarangRusak = (event) => {
    event.preventDefault();
    setPesanError('');
    const jumlahRusak = Number(qtyRusak);
    const stokSaatIni = Number(itemUntukKoreksi?.sisaQtyEceran);
    if (
      !itemUntukKoreksi ||
      !Number.isInteger(jumlahRusak) ||
      jumlahRusak <= 0 ||
      jumlahRusak > stokSaatIni
    ) {
      setPesanError('Masukkan jumlah rusak berupa bilangan bulat lebih dari 0 dan tidak melebihi sisa stok.');
      return;
    }

    let dataUnpackSebelumnya;
    let dataLogSebelumnya;
    try {
      dataUnpackSebelumnya = localStorage.getItem(KUNCI_STORAGE_UNPACK);
      dataLogSebelumnya = localStorage.getItem(KUNCI_STORAGE_SHRINKAGE);
      const daftarUnpack = bacaItemAktif();
      const target = daftarUnpack.find((item) => item.id === itemUntukKoreksi.id);
      if (!target || Number(target.sisaQtyEceran) < jumlahRusak) {
        setPesanError('Sisa stok berubah atau tidak cukup. Muat ulang lalu coba kembali.');
        setItemAktif(daftarUnpack);
        return;
      }

      const produk = daftarProduk.find((item) =>
        (target.idProduk && item.idProduk === target.idProduk) ||
        (target.namaProdukGrosir && target.namaProdukGrosir.startsWith(item.namaProduk))
      );
      const satuanDasar = (produk?.listSatuan || []).find((item) => item.isBase) ||
        (produk?.listSatuan || []).find((item) => Number(item.rasio) === 1);
      const hargaModalEceran = Number(target.hargaModalEceran) ||
        Number(satuanDasar?.hargaBeli) ||
        0;
      const waktuKoreksi = new Date().toISOString();
      const logBaru = {
        id: `SHRINK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        idUnpack: target.id,
        idProduk: target.idProduk || produk?.idProduk || '',
        namaProduk: target.namaProduk || produk?.namaProduk || target.namaProdukGrosir,
        namaProdukGrosir: target.namaProdukGrosir,
        tanggal: waktuKoreksi,
        qtyPcs: jumlahRusak,
        alasan: alasanRusak,
        hargaModalEceran,
        totalKerugian: jumlahRusak * hargaModalEceran
      };
      const dataLog = dataLogSebelumnya ? JSON.parse(dataLogSebelumnya) : [];
      if (!Array.isArray(dataLog)) {
        throw new Error('Data log kerugian harus berupa daftar.');
      }
      const daftarUnpackBaru = daftarUnpack.map((item) =>
        item.id === target.id
          ? {
              ...item,
              sisaQtyEceran: Math.max(0, Number(item.sisaQtyEceran) - jumlahRusak)
            }
          : item
      );

      localStorage.setItem(KUNCI_STORAGE_UNPACK, JSON.stringify(daftarUnpackBaru));
      localStorage.setItem(KUNCI_STORAGE_SHRINKAGE, JSON.stringify([logBaru, ...dataLog]));
      setItemAktif(daftarUnpackBaru);
      setItemUntukKoreksi(null);
      setQtyRusak('1');
      window.dispatchEvent(new Event(EVENT_UNPACK_DIPERBARUI));
      window.dispatchEvent(new Event('pos-warung-shrinkage-updated'));
    } catch (error) {
      console.error('Gagal mencatat koreksi barang rusak:', error);
      try {
        if (dataUnpackSebelumnya === null) {
          localStorage.removeItem(KUNCI_STORAGE_UNPACK);
        } else if (dataUnpackSebelumnya !== undefined) {
          localStorage.setItem(KUNCI_STORAGE_UNPACK, dataUnpackSebelumnya);
        }
        if (dataLogSebelumnya === null) {
          localStorage.removeItem(KUNCI_STORAGE_SHRINKAGE);
        } else if (dataLogSebelumnya !== undefined) {
          localStorage.setItem(KUNCI_STORAGE_SHRINKAGE, dataLogSebelumnya);
        }
      } catch (restoreError) {
        console.error('Gagal memulihkan data koreksi barang rusak:', restoreError);
      }
      setPesanError('Gagal menyimpan koreksi. Stok eceran tidak dikurangi.');
    }
  };

  const tandaiKemasanSelesai = (item) => {
    try {
      const daftarTerbaru = bacaItemAktif();
      const target = daftarTerbaru.find((aktif) => aktif.id === item.id);
      if (!target) {
        setItemAktif(daftarTerbaru);
        setPesanError('Kemasan tidak ditemukan atau sudah ditutup.');
        return;
      }
      if (Number(target.sisaQtyEceran) > 0) {
        setPesanError('Kemasan hanya dapat diselesaikan setelah kuota eceran habis.');
        setItemAktif(daftarTerbaru);
        return;
      }

      const daftarBaru = daftarTerbaru.filter((aktif) => aktif.id !== item.id);
      localStorage.setItem(KUNCI_STORAGE_UNPACK, JSON.stringify(daftarBaru));
      setItemAktif(daftarBaru);
      setPesanError('');
      window.dispatchEvent(new Event(EVENT_UNPACK_DIPERBARUI));
    } catch (error) {
      console.error('Gagal menyelesaikan kemasan eceran:', error);
      setPesanError('Gagal menghapus kemasan yang sudah habis. Data belum diubah.');
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Buka Dus &amp; Stok Eceran Aktif</h2>
          <p className="text-xs text-gray-500">Stok kemasan yang sudah dibuka</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPesanError('');
            setProdukDipilih(null);
            setIdSatuanDipilih('');
            setIdTombolCepat('');
            setTahapModalBuka(1);
          }}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          + Buka Dus / Pack Baru
        </button>
      </header>

      {pesanError && tahapModalBuka === 0 && !itemUntukKoreksi && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {pesanError}
        </p>
      )}

      {itemAktif.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
          Belum ada barang grosir yang dibuka.
        </p>
      ) : (
        <ul className="space-y-2">
          {itemAktif.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {item.namaProdukGrosir}
                </p>
                <p className="text-[11px] text-gray-500">{formatTanggal(item.tanggalBuka)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  Number(item.sisaQtyEceran) <= 0
                    ? 'bg-red-100 text-red-800'
                    : Number(item.sisaQtyEceran) < 5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {item.sisaQtyEceran} / {item.totalSisaPcs} pcs
                </span>
                {Number(item.sisaQtyEceran) <= 0 ? (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
                    ⚠️ Stok eceran habis
                  </span>
                ) : Number(item.sisaQtyEceran) < 5 ? (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                    ⚠️ Stok eceran menipis
                  </span>
                ) : null}
                <button
                  type="button"
                  title="Koreksi / Barang Rusak"
                  aria-label={`Koreksi atau catat barang rusak: ${item.namaProdukGrosir}`}
                  onClick={() => {
                    setPesanError('');
                    setItemUntukKoreksi(item);
                    setQtyRusak('1');
                    setAlasanRusak(ALASAN_RUSAK[0]);
                  }}
                  disabled={Number(item.sisaQtyEceran) <= 0}
                  className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ⚠ Koreksi/Rusak
                </button>
                {Number(item.sisaQtyEceran) <= 0 && (
                  <button
                    type="button"
                    onClick={() => tandaiKemasanSelesai(item)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Selesai / Hapus
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tahapModalBuka === 1 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setTahapModalBuka(0)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="unpack-modal-title"
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-gray-100 p-4">
              <div>
                <h3 id="unpack-modal-title" className="text-base font-bold text-gray-900">
                  Buka Dus/Pack Baru
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Pilih produk grosir yang akan dibuka.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTahapModalBuka(0)}
                aria-label="Tutup"
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </header>
            <div className="space-y-3 p-4">
              <input
                type="search"
                value={kataKunci}
                onChange={(event) => setKataKunci(event.target.value)}
                placeholder="Cari nama produk..."
                aria-label="Cari produk grosir"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {pesanError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {pesanError}
                </p>
              )}
              {produkTersaring.length === 0 ? (
                <p className="py-5 text-center text-sm text-gray-500">
                  Produk dengan kemasan grosir tidak ditemukan.
                </p>
              ) : (
                <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {produkTersaring.map((produk) => (
                    <li key={produk.idProduk}>
                      <button
                        type="button"
                        onClick={() => {
                          setProdukDipilih(produk);
                          setIdSatuanDipilih('');
                          setIdTombolCepat(daftarTombolCepat[0]?.id || '');
                          setPesanError('');
                          setTahapModalBuka(2);
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-gray-50"
                      >
                        <span className="block text-sm font-semibold text-gray-800">
                          {produk.namaProduk}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          Stok utama: {produk.stokUtama} {produk.satuanTerkecil || 'pcs'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
      {tahapModalBuka === 2 && produkDipilih && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setTahapModalBuka(0)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="unpack-config-title"
            className="w-full max-w-lg rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-gray-100 p-4">
              <div>
                <h3 id="unpack-config-title" className="text-base font-bold text-gray-900">
                  Pilih Kemasan &amp; Tombol Cepat
                </h3>
                <p className="mt-1 text-xs text-gray-500">{produkDipilih.namaProduk}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTahapModalBuka(0);
                  setProdukDipilih(null);
                }}
                aria-label="Tutup"
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </header>
            <div className="space-y-4 p-4">
              {pesanError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {pesanError}
                </p>
              )}
                <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      Pilih kemasan: {produkDipilih.namaProduk}
                    </h4>
                    <p className="text-xs text-gray-500">Pilih satu kemasan grosir untuk dibuka.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kemasanProdukDipilih.map((satuan) => (
                      <button
                        key={satuan.idSatuan}
                        type="button"
                        onClick={() => setIdSatuanDipilih(satuan.idSatuan)}
                        aria-pressed={idSatuanDipilih === satuan.idSatuan}
                        className={`rounded-lg border px-3 py-2 text-left text-xs ${
                          idSatuanDipilih === satuan.idSatuan
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'
                        }`}
                      >
                        <span className="block font-semibold">Buka 1 {satuan.namaSatuan}</span>
                        <span className="block">
                          Isi {satuan.rasio} {produkDipilih.satuanTerkecil || 'pcs'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">
                      Tautkan ke tombol cepat kasir
                    </span>
                    <select
                      value={idTombolCepat}
                      onChange={(event) => setIdTombolCepat(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      {daftarTombolCepat.map((tombol) => (
                        <option key={tombol.id} value={tombol.id}>{tombol.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              <footer className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTahapModalBuka(1);
                    setPesanError('');
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={!idSatuanDipilih || !daftarTombolCepat.some((tombol) => tombol.id === idTombolCepat)}
                  onClick={() => {
                    const satuan = kemasanProdukDipilih.find(
                      (item) => item.idSatuan === idSatuanDipilih
                    );
                    const tombol = daftarTombolCepat.find((item) => item.id === idTombolCepat);
                    if (satuan && tombol) bukaKemasan(produkDipilih, satuan, tombol);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Simpan &amp; Buka Kemasan
                </button>
              </footer>
            </div>
          </section>
        </div>
      )}
      {itemUntukKoreksi && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setItemUntukKoreksi(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="shrinkage-modal-title"
            className="w-full max-w-md rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="border-b border-gray-100 p-4">
              <h3 id="shrinkage-modal-title" className="text-base font-bold text-gray-900">
                Koreksi / Barang Rusak
              </h3>
              <p className="mt-1 text-xs text-gray-500">{itemUntukKoreksi.namaProdukGrosir}</p>
            </header>
            <form className="space-y-4 p-4" onSubmit={koreksiBarangRusak}>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Jumlah Rusak (Qty Pcs)</span>
                <input
                  type="number"
                  min="1"
                  max={Number(itemUntukKoreksi.sisaQtyEceran) || 0}
                  step="1"
                  required
                  value={qtyRusak}
                  onChange={(event) => setQtyRusak(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
                <span className="text-xs text-gray-500">
                  Sisa saat ini: {itemUntukKoreksi.sisaQtyEceran} pcs
                </span>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Alasan</span>
                <select
                  value={alasanRusak}
                  onChange={(event) => setAlasanRusak(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                >
                  {ALASAN_RUSAK.map((alasan) => (
                    <option key={alasan} value={alasan}>{alasan}</option>
                  ))}
                </select>
              </label>
              {pesanError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {pesanError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemUntukKoreksi(null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
