import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../constants/firebaseConfig';
import { buatKunciStorageProduk } from './produkStorage';

const KOLEKSI_PRODUK = ['products', 'produks'];
const UKURAN_BATCH = 500;
const AKHIRAN_KUNCI_ANTREAN = ':sinkronisasi-tertunda';

export async function resetDataProduk(storeId) {
  const kunciStorageProduk = buatKunciStorageProduk(storeId);
  if (!kunciStorageProduk) {
    throw new Error('ID toko aktif tidak tersedia. Data produk tidak dihapus.');
  }

  try {
    for (const namaKoleksi of KOLEKSI_PRODUK) {
      const referensiKoleksi = collection(db, 'stores', storeId, namaKoleksi);
      const snapshotProduk = await getDocs(referensiKoleksi);

      for (let awal = 0; awal < snapshotProduk.docs.length; awal += UKURAN_BATCH) {
        const batch = writeBatch(db);
        snapshotProduk.docs
          .slice(awal, awal + UKURAN_BATCH)
          .forEach((dokumen) => batch.delete(dokumen.ref));
        await batch.commit();
      }
    }

    localStorage.removeItem(kunciStorageProduk);
    localStorage.removeItem(`${kunciStorageProduk}${AKHIRAN_KUNCI_ANTREAN}`);
  } catch (error) {
    console.error('Gagal menghapus data produk toko aktif.', error);
    throw new Error('Data produk tidak berhasil dibersihkan seluruhnya.', { cause: error });
  }
}
