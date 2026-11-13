import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../constants/firebaseConfig';

function formatRupiah(nominal) {
  return `Rp${Number(nominal || 0).toLocaleString('id-ID')}`;
}

function formatWaktu(retur) {
  const tanggal = retur.createdAt?.toDate
    ? retur.createdAt.toDate()
    : new Date(retur.timestamp || retur.createdAt);
  return Number.isNaN(tanggal.getTime())
    ? '-'
    : tanggal.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function dapatkanWaktu(retur) {
  if (retur.createdAt?.toMillis) return retur.createdAt.toMillis();
  const waktu = new Date(retur.timestamp || retur.createdAt).getTime();
  return Number.isNaN(waktu) ? 0 : waktu;
}

function DaftarBarang({ judul, items, kosong }) {
  return (
    <section className="rounded-lg border border-gray-200 p-3">
      <h3 className="text-xs font-bold uppercase text-gray-600">{judul}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.idProduk}-${item.idSatuan}-${index}`}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm"
            >
              <span className="text-gray-800">
                {item.namaProduk} — {item.qty} {item.namaSatuan}
              </span>
              <span className="font-medium text-gray-600">{formatRupiah(item.subtotal)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{kosong}</p>
      )}
    </section>
  );
}

function RingkasanKeuangan({ retur }) {
  if (retur.statusKeuangan === 'BAYAR_TAMBAHAN') {
    return (
      <p className="font-bold text-blue-700">
        Dibayar Pelanggan +{formatRupiah(retur.selisih)}
      </p>
    );
  }
  if (retur.statusKeuangan === 'REFUND_KAS') {
    return (
      <p className="font-bold text-orange-700">
        Refund Kas Keluar -{formatRupiah(Math.abs(Number(retur.selisih) || 0))}
      </p>
    );
  }
  return <p className="font-bold text-emerald-700">Tukar Impas Rp0</p>;
}

export default function RiwayatRetur({ storeId, pengguna }) {
  const [hasilMuat, setHasilMuat] = useState(null);

  useEffect(() => {
    let masihAktif = true;

    if (!storeId) return () => {
      masihAktif = false;
    };

    const muatRiwayatRetur = async () => {
      try {
        const referensiRetur = query(
          collection(db, 'retur_logs'),
          where('store_id', '==', storeId)
        );
        const hasil = await getDocs(referensiRetur);
        if (!masihAktif) return;
        setHasilMuat({
          storeId,
          daftarRetur: hasil.docs
            .map((dokumen) => ({ id: dokumen.id, ...dokumen.data() }))
            .sort((a, b) => dapatkanWaktu(b) - dapatkanWaktu(a)),
          pesanError: ''
        });
      } catch (error) {
        const detailError = error instanceof Error ? error.message : String(error);
        console.error(`Gagal memuat riwayat retur: ${detailError}`, error);
        if (masihAktif) {
          setHasilMuat({
            storeId,
            daftarRetur: [],
            pesanError: `Riwayat retur gagal dimuat: ${detailError}`
          });
        }
      }
    };

    muatRiwayatRetur();
    return () => {
      masihAktif = false;
    };
  }, [storeId]);

  if (!storeId) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        ID toko tidak tersedia. Riwayat retur tidak dapat dimuat.
      </p>
    );
  }

  const muatanSaatIni = hasilMuat?.storeId === storeId ? hasilMuat : null;
  if (!muatanSaatIni) {
    return <p role="status" className="text-sm text-gray-500">Memuat riwayat retur...</p>;
  }
  if (muatanSaatIni.pesanError) {
    return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{muatanSaatIni.pesanError}</p>;
  }
  if (muatanSaatIni.daftarRetur.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        Belum ada riwayat retur atau tukar barang.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {muatanSaatIni.daftarRetur.map((retur) => (
        <article key={retur.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <header className="flex flex-wrap justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <p className="font-semibold text-gray-900">{formatWaktu(retur)}</p>
              <p className="text-sm text-gray-500">Kasir: {retur.kasir || pengguna?.email || 'Pengguna'}</p>
            </div>
            <span className="self-start rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Retur & Tukar
            </span>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            <DaftarBarang
              judul="Barang dikembalikan (masuk)"
              items={retur.barangKembali || []}
              kosong="Tidak ada barang yang tercatat."
            />
            <DaftarBarang
              judul="Barang pengganti (keluar)"
              items={retur.barangPengganti || []}
              kosong="Hanya Retur / Tanpa Pengganti"
            />
          </div>

          <footer className="flex flex-wrap items-end justify-between gap-2 border-t border-gray-100 pt-3">
            <div className="text-xs text-gray-500">
              Nilai kembali {formatRupiah(retur.totalKembali)} · Pengganti {formatRupiah(retur.totalPengganti)}
            </div>
            <RingkasanKeuangan retur={retur} />
          </footer>
        </article>
      ))}
    </div>
  );
}
