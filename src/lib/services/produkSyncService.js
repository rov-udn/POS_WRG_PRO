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
    if (produk?.idProduk) idAntrean.add(produk.idProduk);
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
    const produkUntukDikirim = antrean
      .map((idProduk) => produkPerId.get(idProduk))
      .filter(Boolean);

    for (let awal = 0; awal < produkUntukDikirim.length; awal += 500) {
      const batch = writeBatch(db);
      produkUntukDikirim.slice(awal, awal + 500).forEach((produk) => {
        batch.set(
          doc(db, 'stores', storeId, 'products', produk.idProduk),
          produk,
          { merge: true }
        );
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
        return !produk || JSON.stringify(produkTerbaru) === JSON.stringify(produk);
      })
    );
    const antreanTerbaru = bacaArrayStorage(kunciAntrean, 'Antrean sinkronisasi produk');
    const antreanTersisa = antreanTerbaru.filter((idProduk) => !idSelesai.has(idProduk));

    try {
      localStorage.setItem(kunciAntrean, JSON.stringify(antreanTersisa));
    } catch (error) {
      throw new Error('Antrean sinkronisasi produk tidak dapat diperbarui.', { cause: error });
    }

    berhasil += produkUntukDikirim.filter((produk) => idSelesai.has(produk.idProduk)).length;
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
