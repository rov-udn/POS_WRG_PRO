import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../constants/firebaseConfig';
import {
  buatIdProduk,
  buatIdSatuan,
  normalisasiVarianProduk
} from './produkUtils';

const angkaAman = (nilai, defaultValue = 0) => {
  if (nilai === null || nilai === undefined || nilai === '') return defaultValue;
  const angka = Number(nilai);
  return Number.isFinite(angka) ? angka : defaultValue;
};

const idAman = (id) => {
  const nilai = String(id ?? '').trim();
  return nilai && !nilai.includes('/') ? nilai : buatIdProduk();
};

export function transformProdukLama(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new TypeError('Data produk harus berupa objek.');
  }

  const satuanJual = typeof item.satuanJual === 'string' ? item.satuanJual : '';
  const listSatuan = [
    {
      idSatuan: buatIdSatuan(),
      namaSatuan: satuanJual,
      barcode: '',
      hargaBeli: angkaAman(item.modal),
      hargaJual: angkaAman(item.jual),
      rasio: 1,
      isBase: true
    }
  ];

  if (item.bisaGrosir) {
    const rasioGrosir = angkaAman(item.isiKeEceran);
    if (rasioGrosir > 0) {
      listSatuan.unshift({
        idSatuan: buatIdSatuan(),
        namaSatuan: typeof item.satuanGrosirNama === 'string' ? item.satuanGrosirNama : '',
        barcode: '',
        hargaBeli: angkaAman(item.modalGrosirTotal, angkaAman(item.modal) * rasioGrosir),
        hargaJual: angkaAman(item.jualGrosirTotal),
        rasio: rasioGrosir,
        isBase: false
      });
    } else {
      console.warn('Rasio grosir tidak valid; satuan grosir dilewati.', item);
    }
  }

  const varian = normalisasiVarianProduk(item.varian);
  const punyaVarian = typeof item.punyaVarian === 'boolean'
    ? item.punyaVarian
    : item.punyaVarian === 'true'
      ? true
      : item.punyaVarian === 'false'
        ? false
        : varian.length > 0;

  return {
    idProduk: idAman(item.id),
    namaProduk: typeof item.nama === 'string' ? item.nama : '',
    kategori: typeof item.kategori === 'string' ? item.kategori : '',
    stokUtama: angkaAman(item.stok),
    satuanTerkecil: satuanJual,
    punyaVarian,
    varian,
    listSatuan
  };
}

export async function importProdukJson(dataProduk) {
  if (!Array.isArray(dataProduk)) {
    throw new TypeError('File JSON harus berisi array produk.');
  }

  const hasil = { berhasil: 0, gagal: 0 };

  for (let awal = 0; awal < dataProduk.length; awal += 500) {
    const batch = writeBatch(db);
    let jumlahDalamBatch = 0;

    dataProduk.slice(awal, awal + 500).forEach((item, indeks) => {
      try {
        const produk = transformProdukLama(item);
        batch.set(doc(db, 'products', produk.idProduk), produk, { merge: true });
        jumlahDalamBatch += 1;
      } catch (error) {
        hasil.gagal += 1;
        console.error(`Gagal memetakan produk JSON pada indeks ${awal + indeks}.`, error);
      }
    });

    if (jumlahDalamBatch === 0) continue;

    try {
      await batch.commit();
      hasil.berhasil += jumlahDalamBatch;
    } catch (error) {
      hasil.gagal += jumlahDalamBatch;
      console.error(`Gagal menyimpan batch produk mulai indeks ${awal}.`, error);
    }
  }

  return hasil;
}
