import { useEffect, useMemo, useState } from 'react';
import {
  bacaTombolCepat,
  EVENT_QUICK_BUTTONS_UPDATED,
  EVENT_UNPACK_DIPERBARUI,
  cocokkanKategoriUnpack,
} from '../utils/unpackItems';

function bacaDaftar(key) {
  const data = localStorage.getItem(key);
  if (!data) return [];
  const hasil = JSON.parse(data);
  if (!Array.isArray(hasil)) {
    throw new Error(`Data ${key} harus berupa daftar.`);
  }
  return hasil;
}

export default function QuickButtonEceran({ daftarProduk, onTambah }) {
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [daftarTombol, setDaftarTombol] = useState(() => {
    try {
      return bacaTombolCepat();
    } catch (error) {
      console.error('Gagal memuat konfigurasi tombol cepat:', error);
      return [];
    }
  });
  const [unpackItems, setUnpackItems] = useState(() => {
    try {
      return bacaDaftar('active_unpack_items');
    } catch (error) {
      console.error('Gagal memuat kuota eceran untuk tombol cepat:', error);
      return [];
    }
  });

  useEffect(() => {
    const muatTombol = () => {
      try {
        setDaftarTombol(bacaTombolCepat());
      } catch (error) {
        console.error('Gagal memuat konfigurasi tombol cepat yang diperbarui:', error);
      }
    };
    const muatUnpack = () => {
      try {
        setUnpackItems(bacaDaftar('active_unpack_items'));
      } catch (error) {
        console.error('Gagal memuat kuota eceran yang diperbarui:', error);
      }
    };
    const tanganiStorage = (event) => {
      if (event.key === 'active_unpack_items') muatUnpack();
      if (event.key === 'pos_warung_quick_buttons') muatTombol();
    };

    window.addEventListener('storage', tanganiStorage);
    window.addEventListener(EVENT_UNPACK_DIPERBARUI, muatUnpack);
    window.addEventListener(EVENT_QUICK_BUTTONS_UPDATED, muatTombol);
    return () => {
      window.removeEventListener('storage', tanganiStorage);
      window.removeEventListener(EVENT_UNPACK_DIPERBARUI, muatUnpack);
      window.removeEventListener(EVENT_QUICK_BUTTONS_UPDATED, muatTombol);
    };
  }, []);

  const statusTombol = useMemo(() => daftarTombol.map((tombol) => {
    const cocok = unpackItems.filter((item) =>
      cocokkanKategoriUnpack(item, tombol, daftarProduk)
    );
    const jumlahTersedia = cocok.reduce(
      (total, item) => total + Math.max(0, Number(item.sisaQtyEceran) || 0),
      0
    );
    return {
      ...tombol,
      jumlahTersedia,
      adaItem: cocok.length > 0,
      adaKuotaHampirHabis: cocok.some((item) =>
        Number(item.sisaQtyEceran) > 0 && Number(item.sisaQtyEceran) < 5
      ),
      adaKuotaHabis: cocok.some((item) => Number(item.sisaQtyEceran) <= 0)
    };
  }), [daftarTombol, unpackItems, daftarProduk]);

  const adaStokMenipis = statusTombol.some((tombol) =>
    tombol.adaKuotaHampirHabis || tombol.adaKuotaHabis
  );
  const adaStokHabis = statusTombol.some((tombol) => tombol.adaKuotaHabis);

  const tambahKeKeranjang = (tombol) => {
    if (onTambah(tombol.id, tombol.harga)) {
      setModalTerbuka(false);
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setModalTerbuka(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          aria-haspopup="dialog"
          aria-expanded={modalTerbuka}
        >
          <span aria-hidden="true">⚡</span>
          Pilih Eceran Cepat
        </button>
        {adaStokMenipis && (
          <span
            role="status"
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              adaStokHabis
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            ⚠️ {adaStokHabis ? 'Ada stok eceran habis' : 'Stok eceran menipis'}
          </span>
        )}
      </div>

      {modalTerbuka && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalTerbuka(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-eceran-title"
            className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-gray-100 p-4">
              <div>
                <h2 id="quick-eceran-title" className="text-base font-bold text-gray-900">
                  ⚡ Pilih Eceran Cepat
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Pilih tombol untuk menambahkan 1 pcs ke keranjang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTerbuka(false)}
                aria-label="Tutup pilihan eceran"
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </header>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {statusTombol.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
                  Belum ada tombol cepat yang aktif. Hubungi admin untuk mengaturnya.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {statusTombol.map((tombol) => {
                    const habis = tombol.jumlahTersedia <= 0;
                    const hampirHabis = !habis && tombol.adaKuotaHampirHabis;
                    return (
                      <button
                        key={tombol.id}
                        type="button"
                        disabled={habis}
                        onClick={() => tambahKeKeranjang(tombol)}
                        className={`flex min-h-28 flex-col justify-between rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed ${
                          habis
                            ? 'border-red-200 bg-red-50 text-red-800'
                            : hampirHabis
                              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                              : 'border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 hover:bg-blue-100'
                        }`}
                      >
                        <span className="text-sm font-bold">{tombol.label}</span>
                        <span className="text-xs font-semibold">
                          Rp{Number(tombol.harga).toLocaleString('id-ID')}
                        </span>
                        {habis ? (
                          <span className="text-[11px] font-semibold">
                            ⚠️ Stok habis · perlu buka dus
                          </span>
                        ) : (
                          <span className="text-[11px]">
                            {hampirHabis && '⚠️ '}
                            Sisa {tombol.jumlahTersedia} pcs
                            {hampirHabis && ' · hampir habis'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}