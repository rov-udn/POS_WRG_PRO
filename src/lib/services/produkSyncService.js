import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { buatKunciStorageProduk } from '../../features/produk/utils/produkStorage';

const AKHIRAN_KUNCI_ANTREAN = ':sinkronisasi-tertunda';
const sinkronisasiAktif = new Map();

const buatKunciAntrean = (storeId) => {
  const kunciProduk = buatKunciStorageProduk(storeId);
  return kunciProduk ? `${kunciProduk}${AKHIRAN_KUNCI_ANTREAN}` : null;
};

const bacaArrayStorage = (kunci, label) => {
  let data;
  try {
    const tersimpan = localStorage.getItem(kunci);
    data = tersimpan ? JSON.parse(tersimpan) : [];
  } catch (error) {
    throw new Error(`${label} tidak dapat dibaca dari penyimpanan lokal.`, { cause: error });
  }
  if (!Array.isArray(data)) {
    throw new TypeError(`${label} tersimpan dalam format yang tidak valid.`);
  }
  return data;
};

const bacaProdukLokal = (storeId) => {
  const kunciProduk = buatKunciStorageProduk(storeId);
  if (!kunciProduk) throw new Error('ID toko aktif tidak tersedia.');
  return bacaArrayStorage(kunciProduk, 'Daftar produk');
};

export function antrikanProdukUntukSinkronisasi(storeId, daftarProduk) {
  const kunciAntrean = buatKunciAntrean(storeId);
  if (!kunciAntrean) throw new Error('ID toko aktif tidak tersedia.');
  const antrean = bacaArrayStorage(kunciAntrean, 'Antrean sinkronisasi produk');
  const idAntrean = new Set(antrean);

  daftarProduk.forEach((produk) => {
    const idProduk = typeof produk === 'string' ? produk : produk?.idProduk;
    if (idProduk) idAntrean.add(idProduk);
  });

  try {
    localStorage.setItem(kunciAntrean, JSON.stringify([...idAntrean]));
  } catch (error) {
    throw new Error('Antrean sinkronisasi produk tidak dapat disimpan.', { cause: error });
  }
}

async function prosesSinkronisasiProduk(storeId) {
  const kunciAntrean = buatKunciAntrean(storeId);
  if (!kunciAntrean) throw new Error('ID toko aktif tidak tersedia.');

  let berhasil = 0;
  while (true) {
    const antrean = bacaArrayStorage(kunciAntrean, 'Antrean sinkronisasi produk');
    if (antrean.length === 0) return { status: 'synced', berhasil };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { status: 'offline', berhasil, tertunda: antrean.length };
    }

    const produkDiLokal = bacaProdukLokal(storeId);
    const produkPerId = new Map(
      produkDiLokal.map((produk) => [produk.idProduk, produk])
    );
    for (let awal = 0; awal < antrean.length; awal += 500) {
      const batch = writeBatch(db);
      antrean.slice(awal, awal + 500).forEach((idProduk) => {
        const produk = produkPerId.get(idProduk);
        const referensiProduk = doc(db, 'stores', storeId, 'products', idProduk);
        if (produk) {
          batch.set(referensiProduk, produk, { merge: true });
        } else {
          batch.delete(referensiProduk);
        }
      });
      await batch.commit();
    }

    const produkTerbaruDiLokal = bacaProdukLokal(storeId);
    const produkTerbaruPerId = new Map(
      produkTerbaruDiLokal.map((produk) => [produk.idProduk, produk])
    );
    const idSelesai = new Set(
      antrean.filter((idProduk) => {
        const produk = produkPerId.get(idProduk);
        const produkTerbaru = produkTerbaruPerId.get(idProduk);
        return produk
          ? Boolean(produkTerbaru) && JSON.stringify(produkTerbaru) === JSON.stringify(produk)
          : !produkTerbaru;
      })
    );
    const antreanTerbaru = bacaArrayStorage(kunciAntrean, 'Antrean sinkronisasi produk');
    const antreanTersisa = antreanTerbaru.filter((idProduk) => !idSelesai.has(idProduk));

    try {
      localStorage.setItem(kunciAntrean, JSON.stringify(antreanTersisa));
    } catch (error) {
      throw new Error('Antrean sinkronisasi produk tidak dapat diperbarui.', { cause: error });
    }

    berhasil += idSelesai.size;
  }
}

export function sinkronkanProdukPending(storeId) {
  if (!storeId) return Promise.reject(new Error('ID toko aktif tidak tersedia.'));
  if (sinkronisasiAktif.has(storeId)) return sinkronisasiAktif.get(storeId);

  const janjiSinkronisasi = Promise.resolve()
    .then(() => prosesSinkronisasiProduk(storeId))
    .finally(() => sinkronisasiAktif.delete(storeId));
  sinkronisasiAktif.set(storeId, janjiSinkronisasi);
  return janjiSinkronisasi;
}

export async function antrikanDanSinkronkanProduk(storeId, daftarProduk) {
  try {
    antrikanProdukUntukSinkronisasi(storeId, daftarProduk);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        status: 'offline',
        pesan: 'Tersimpan lokal; sinkronisasi menunggu koneksi online.'
      };
    }
    const hasil = await sinkronkanProdukPending(storeId);
    if (hasil.status === 'offline') {
      return {
        ...hasil,
        pesan: 'Tersimpan lokal; sinkronisasi menunggu koneksi online.'
      };
    }
    if (hasil.status === 'pending') {
      return {
        ...hasil,
        pesan: `${hasil.tertunda} produk masih menunggu sinkronisasi.`
      };
    }
    return hasil;
  } catch (error) {
    console.error('Sinkronisasi produk ke Firestore gagal; data tetap tersimpan lokal.', error);
    return {
      status: 'failed',
      pesan: `Tersimpan lokal, tetapi sinkronisasi tertunda: ${error.message}`
    };
  }
}

export async function antrikanPerubahanProdukDanSinkronkan(
  storeId,
  produkSebelumnya,
  produkTerbaru
) {
  const produkLamaPerId = new Map(
    (Array.isArray(produkSebelumnya) ? produkSebelumnya : [])
      .filter((produk) => produk?.idProduk)
      .map((produk) => [produk.idProduk, produk])
  );
  const produkBaruPerId = new Map(
    (Array.isArray(produkTerbaru) ? produkTerbaru : [])
      .filter((produk) => produk?.idProduk)
      .map((produk) => [produk.idProduk, produk])
  );
  const idProdukBerubah = new Set([
    ...produkLamaPerId.keys(),
    ...produkBaruPerId.keys()
  ]);
  const daftarIdProdukBerubah = [...idProdukBerubah].filter(
    (idProduk) =>
      JSON.stringify(produkLamaPerId.get(idProduk)) !==
      JSON.stringify(produkBaruPerId.get(idProduk))
  );

  if (daftarIdProdukBerubah.length === 0) {
    return { status: 'synced', berhasil: 0 };
  }

  return antrikanDanSinkronkanProduk(storeId, daftarIdProdukBerubah);
}
