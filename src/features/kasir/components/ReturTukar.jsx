import React, { useMemo, useState } from 'react';
import { calculateSubtotal } from '../../../utils/formatQuantity';
import { useAppMode } from '../../../hooks/useAppMode';
import { formatStokUtama } from '../../produk/utils/produkUtils';

const formatRupiah = (nominal) => `Rp${Number(nominal || 0).toLocaleString('id-ID')}`;

const buatBarisKosong = () => ({
  id: `${Date.now()}-${Math.random()}`,
  idProduk: '',
  idSatuan: '',
  qty: '1'
});

function PencarianProdukRetur({ produk, daftarProduk, tampilkanStok, onPilih }) {
  const [kataKunci, setKataKunci] = useState('');
  const [terbuka, setTerbuka] = useState(false);
  const nilaiInput = kataKunci || produk?.namaProduk || '';
  const produkTersaring = daftarProduk.filter((item) => {
    const cocokNama = item.namaProduk?.toLowerCase().includes(kataKunci.trim().toLowerCase());
    const cocokBarcode = item.listSatuan?.some((satuan) =>
      satuan.barcode?.toLowerCase().includes(kataKunci.trim().toLowerCase())
    );
    return cocokNama || cocokBarcode;
  }).slice(0, 8);

  const pilihProduk = (item) => {
    onPilih(item);
    setKataKunci('');
    setTerbuka(false);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || !kataKunci.trim()) return;
    event.preventDefault();
    const kode = kataKunci.trim().toLowerCase();
    const cocokBarcode = daftarProduk.find((item) =>
      item.listSatuan?.some((satuan) => satuan.barcode?.toLowerCase() === kode)
    );
    if (cocokBarcode) pilihProduk(cocokBarcode);
    else if (produkTersaring.length === 1) pilihProduk(produkTersaring[0]);
  };

  return (
    <div className="relative">
      <input
        type="search"
        value={nilaiInput}
        onChange={(event) => {
          setKataKunci(event.target.value);
          setTerbuka(true);
        }}
        onFocus={(event) => {
          event.target.select();
          setTerbuka(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ketik nama produk atau scan barcode..."
        aria-label="Cari produk atau scan barcode"
        aria-autocomplete="list"
        aria-expanded={terbuka && Boolean(kataKunci.trim())}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {terbuka && kataKunci.trim() && (
        <div
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
        >
          {produkTersaring.length > 0 ? produkTersaring.map((item) => {
            const satuan = item.listSatuan || [];
            const satuanDasar = satuan.find((s) => s.isBase) || satuan[0];
            return (
              <button
                key={item.idProduk}
                type="button"
                role="option"
                aria-selected={produk?.idProduk === item.idProduk}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pilihProduk(item)}
                className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-gray-800">{item.namaProduk}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Satuan: {satuan.map((entry) => entry.namaSatuan).filter(Boolean).join(', ') || '-'}
                  </span>
                </span>
                {tampilkanStok && (
                  <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    Stok {formatStokUtama(item.stokUtama, satuanDasar?.namaSatuan || item.satuanTerkecil || '')}
                  </span>
                )}
              </button>
            );
          }) : (
            <p className="px-3 py-3 text-sm text-gray-500">Produk tidak ditemukan.</p>
          )}
        </div>
      )}
    </div>
  );
}

function DaftarBarang({ judul, arah, daftarProduk, tampilkanStok, items, onUbah, onTambah, onHapus }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">{judul}</h3>
          <p className="text-xs text-gray-500">
            {arah === 'MASUK' ? 'Stok akan bertambah ke gudang.' : 'Stok akan berkurang dari gudang.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onTambah}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${
            arah === 'MASUK'
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          + Tambah
        </button>
      </div>

      {items.map((item) => {
        const produk = daftarProduk.find((p) => p.idProduk === item.idProduk);
        const satuan = produk?.listSatuan?.find((s) => s.idSatuan === item.idSatuan);
        return (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-12">
            <label className="sm:col-span-5">
              <span className="mb-1 block text-[11px] font-semibold text-gray-500">Produk</span>
              <PencarianProdukRetur
                produk={produk}
                daftarProduk={daftarProduk}
                tampilkanStok={tampilkanStok}
                onPilih={(produkDipilih) => onUbah(item.id, 'idProduk', produkDipilih.idProduk)}
              />
            </label>
            <label className="sm:col-span-3">
              <span className="mb-1 block text-[11px] font-semibold text-gray-500">Satuan</span>
              <select
                value={item.idSatuan}
                disabled={!produk}
                onChange={(event) => onUbah(item.id, 'idSatuan', event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Pilih satuan</option>
                {(produk?.listSatuan || []).map((s) => (
                  <option key={s.idSatuan} value={s.idSatuan}>{s.namaSatuan}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold text-gray-500">Jumlah</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={item.qty}
                onChange={(event) => onUbah(item.id, 'qty', event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end justify-between gap-2 sm:col-span-2 sm:flex-col sm:items-end">
              <span className="pb-2 text-xs font-bold text-gray-700">
                {formatRupiah(calculateSubtotal(satuan?.hargaJual, item.qty))}
              </span>
              <button
                type="button"
                onClick={() => onHapus(item.id)}
                aria-label={`Hapus ${produk?.namaProduk || 'barang'}`}
                className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default function ReturTukar({ daftarProduk, onProses }) {
  const { fitur } = useAppMode();
  const [barangKembali, setBarangKembali] = useState([buatBarisKosong()]);
  const [barangPengganti, setBarangPengganti] = useState([]);
  const [metodePembayaran, setMetodePembayaran] = useState('CASH');
  const [jumlahDiterima, setJumlahDiterima] = useState('');
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [pesanSukses, setPesanSukses] = useState('');

  const hitungTotal = (items) => items.reduce((total, item) => {
    const produk = daftarProduk.find((p) => p.idProduk === item.idProduk);
    const satuan = produk?.listSatuan?.find((s) => s.idSatuan === item.idSatuan);
    return total + calculateSubtotal(satuan?.hargaJual, item.qty);
  }, 0);
  const totalKembali = hitungTotal(barangKembali);
  const totalPengganti = hitungTotal(barangPengganti);
  const selisih = totalPengganti - totalKembali;
  const nominalDiterima = Number(jumlahDiterima) || 0;
  const kembalian = Math.max(0, nominalDiterima - selisih);

  const daftarValid = useMemo(() => [...barangKembali, ...barangPengganti].every((item) => {
    const produk = daftarProduk.find((p) => p.idProduk === item.idProduk);
    const satuan = produk?.listSatuan?.find((s) => s.idSatuan === item.idSatuan);
    return Boolean(
      produk &&
      satuan &&
      Number.isFinite(Number(item.qty)) &&
      Number(item.qty) > 0 &&
      Number.isFinite(Number(satuan.rasio)) &&
      Number(satuan.rasio) > 0
    );
  }), [barangKembali, barangPengganti, daftarProduk]);

  const ubahBaris = (setter) => (id, field, value) => {
    setter((items) => items.map((item) => {
      if (item.id !== id) return item;
      if (field === 'idProduk') {
        const produk = daftarProduk.find((p) => p.idProduk === value);
        return { ...item, idProduk: value, idSatuan: produk?.listSatuan?.[0]?.idSatuan || '' };
      }
      return { ...item, [field]: value };
    }));
  };

  const proses = () => {
    if (barangKembali.length === 0) {
      alert('Pilih minimal satu barang yang dikembalikan.');
      return;
    }
    if (!daftarValid) {
      alert('Lengkapi produk, satuan, dan jumlah dengan benar.');
      return;
    }
    if (selisih > 0 && metodePembayaran === 'CASH' && nominalDiterima < selisih) {
      alert('Uang yang diterima kurang dari kekurangan pembayaran.');
      return;
    }
    setSedangMenyimpan(true);
    try {
      const berhasil = onProses({
        barangKembali,
        barangPengganti,
        metodePembayaran,
        jumlahDiterima: selisih > 0 && metodePembayaran === 'CASH' ? nominalDiterima : Math.max(0, selisih)
      });
      if (berhasil) {
        setPesanSukses(
          selisih > 0
            ? `Retur/tukar tercatat. Uang masuk ${formatRupiah(selisih)}.`
            : selisih < 0
              ? `Retur/tukar tercatat. Refund kas keluar ${formatRupiah(Math.abs(selisih))}.`
              : 'Retur/tukar tercatat tanpa selisih pembayaran.'
        );
        setBarangKembali([buatBarisKosong()]);
        setBarangPengganti([]);
        setJumlahDiterima('');
      }
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-extrabold text-amber-900">Retur & Tukar Barang</h2>
        <p className="mt-1 text-sm text-amber-800">
          Tidak perlu nomor nota. Pilih barang yang diterima kembali dan, bila ada, barang penggantinya.
        </p>
      </div>
      {pesanSukses && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          {pesanSukses}
        </p>
      )}

      <DaftarBarang
        judul="Barang dikembalikan pelanggan"
        arah="MASUK"
        daftarProduk={daftarProduk}
        tampilkanStok={fitur.lihatStok}
        items={barangKembali}
        onUbah={ubahBaris(setBarangKembali)}
        onTambah={() => setBarangKembali((items) => [...items, buatBarisKosong()])}
        onHapus={(id) => setBarangKembali((items) => items.filter((item) => item.id !== id))}
      />
      <DaftarBarang
        judul="Barang pengganti (opsional)"
        arah="KELUAR"
        daftarProduk={daftarProduk}
        tampilkanStok={fitur.lihatStok}
        items={barangPengganti}
        onUbah={ubahBaris(setBarangPengganti)}
        onTambah={() => setBarangPengganti((items) => [...items, buatBarisKosong()])}
        onHapus={(id) => setBarangPengganti((items) => items.filter((item) => item.id !== id))}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Nilai barang kembali</p>
            <p className="font-bold text-gray-800">{formatRupiah(totalKembali)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Nilai barang pengganti</p>
            <p className="font-bold text-gray-800">{formatRupiah(totalPengganti)}</p>
          </div>
          <div className={`rounded-xl p-3 ${selisih > 0 ? 'bg-blue-50' : 'bg-emerald-50'}`}>
            <p className="text-xs text-gray-500">{selisih > 0 ? 'Dibayar pelanggan' : 'Refund ke pelanggan'}</p>
            <p className={`font-extrabold ${selisih > 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
              {formatRupiah(Math.abs(selisih))}
            </p>
          </div>
        </div>

        {selisih > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-bold text-gray-600">Metode pembayaran kekurangan</span>
              <select
                value={metodePembayaran}
                onChange={(event) => setMetodePembayaran(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="CASH">Tunai (masuk ke laci)</option>
                <option value="QRIS">QRIS / Transfer</option>
              </select>
            </label>
            {metodePembayaran === 'CASH' && (
              <label>
                <span className="mb-1 block text-xs font-bold text-gray-600">Uang diterima (Rp)</span>
                <input
                  type="number"
                  min={selisih}
                  value={jumlahDiterima}
                  onChange={(event) => setJumlahDiterima(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {nominalDiterima >= selisih && (
                  <span className="mt-1 block text-xs text-gray-500">Kembalian: {formatRupiah(kembalian)}</span>
                )}
              </label>
            )}
          </div>
        )}

        {selisih < 0 && (
          <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
            Refund {formatRupiah(Math.abs(selisih))} akan dicatat sebagai kas keluar.
          </p>
        )}

        <button
          type="button"
          disabled={sedangMenyimpan || daftarProduk.length === 0}
          onClick={proses}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sedangMenyimpan ? 'Menyimpan...' : 'Proses Retur / Tukar'}
        </button>
      </section>
    </div>
  );
}
