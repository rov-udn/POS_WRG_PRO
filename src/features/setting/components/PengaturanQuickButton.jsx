import { useEffect, useState } from 'react';
import {
  bacaTombolCepat,
  EVENT_QUICK_BUTTONS_UPDATED,
  KUNCI_STORAGE_QUICK_BUTTONS,
  simpanTombolCepat
} from '../../kasir/utils/unpackItems';

function buatIdTombol() {
  return `quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PengaturanQuickButton() {
  const [daftarTombol, setDaftarTombol] = useState(() => {
    try {
      return bacaTombolCepat();
    } catch (error) {
      console.error('Gagal memuat pengaturan tombol cepat:', error);
      return [];
    }
  });
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [label, setLabel] = useState('');
  const [harga, setHarga] = useState('');
  const [kategori, setKategori] = useState('');
  const [pesan, setPesan] = useState('');
  const [jenisPesan, setJenisPesan] = useState('error');

  useEffect(() => {
    const muatTombol = (event) => {
      if (event?.key && event.key !== KUNCI_STORAGE_QUICK_BUTTONS) return;
      try {
        setDaftarTombol(bacaTombolCepat());
        setPesan('');
      } catch (error) {
        console.error('Gagal memuat ulang pengaturan tombol cepat:', error);
        setPesan('Data tombol cepat tidak dapat dibaca. Periksa penyimpanan lokal.');
        setJenisPesan('error');
      }
    };

    window.addEventListener('storage', muatTombol);
    window.addEventListener(EVENT_QUICK_BUTTONS_UPDATED, muatTombol);
    return () => {
      window.removeEventListener('storage', muatTombol);
      window.removeEventListener(EVENT_QUICK_BUTTONS_UPDATED, muatTombol);
    };
  }, []);

  const simpanDaftar = (daftarBaru, pesanSukses) => {
    try {
      simpanTombolCepat(daftarBaru);
      setDaftarTombol(daftarBaru);
      setPesan(pesanSukses);
      setJenisPesan('success');
      return true;
    } catch (error) {
      console.error('Gagal menyimpan pengaturan tombol cepat:', error);
      setPesan('Perubahan gagal disimpan. Periksa kapasitas penyimpanan lalu coba lagi.');
      setJenisPesan('error');
      return false;
    }
  };

  const tambahTombol = (event) => {
    event.preventDefault();
    const hargaAngka = Number(harga);
    if (!label.trim() || !kategori.trim() || !Number.isFinite(hargaAngka) || hargaAngka <= 0) {
      setPesan('Nama, target kategori, dan harga positif wajib diisi.');
      setJenisPesan('error');
      return;
    }

    const tombolBaru = {
      id: buatIdTombol(),
      label: label.trim(),
      harga: hargaAngka,
      kategori: kategori.trim()
    };
    if (simpanDaftar([...daftarTombol, tombolBaru], 'Tombol cepat berhasil ditambahkan.')) {
      setLabel('');
      setHarga('');
      setKategori('');
      setFormTerbuka(false);
    }
  };

  const hapusTombol = (id) => {
    const tombol = daftarTombol.find((item) => item.id === id);
    if (!tombol) return;
    if (daftarTombol.length === 1) {
      setPesan('Minimal harus ada satu tombol cepat aktif.');
      setJenisPesan('error');
      return;
    }
    if (!window.confirm(`Hapus tombol cepat "${tombol.label}"?`)) return;
    simpanDaftar(
      daftarTombol.filter((item) => item.id !== id),
      `Tombol "${tombol.label}" berhasil dihapus.`
    );
  };

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">Daftar Tombol Cepat Eceran</h2>
          <p className="mt-1 text-xs text-gray-500">
            Tombol ini tersedia untuk penautan stok eceran dan transaksi di halaman Kasir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPesan('');
            setFormTerbuka((terbuka) => !terbuka);
          }}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {formTerbuka ? 'Batal' : '+ Tambah Tombol Baru'}
        </button>
      </header>

      {pesan && (
        <p
          role={jenisPesan === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm ${
            jenisPesan === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {pesan}
        </p>
      )}

      {formTerbuka && (
        <form
          onSubmit={tambahTombol}
          className="grid grid-cols-1 gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 md:grid-cols-3"
        >
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-gray-700">Nama Tombol</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Contoh: Es Teh"
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-gray-700">Harga Jual (Rp)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={harga}
              onChange={(event) => setHarga(event.target.value)}
              placeholder="1000"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-gray-700">Kategori / Target</span>
            <input
              value={kategori}
              onChange={(event) => setKategori(event.target.value)}
              placeholder="Contoh: minuman"
              maxLength={50}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Simpan Tombol
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Nama Tombol</th>
              <th className="px-3 py-2 text-right">Harga</th>
              <th className="px-3 py-2">Kategori / Target</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {daftarTombol.map((tombol) => (
              <tr key={tombol.id}>
                <td className="px-3 py-3 font-semibold text-gray-800">{tombol.label}</td>
                <td className="px-3 py-3 text-right">
                  Rp{Number(tombol.harga).toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-3 text-gray-600">{tombol.kategori}</td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => hapusTombol(tombol.id)}
                    disabled={daftarTombol.length === 1}
                    title={daftarTombol.length === 1 ? 'Minimal satu tombol harus tersedia' : 'Hapus tombol'}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {daftarTombol.length === 0 && (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                  Belum ada tombol cepat. Tambahkan tombol baru untuk mulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
