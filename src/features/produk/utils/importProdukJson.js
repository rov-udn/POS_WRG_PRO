import {
  buatIdProduk,
  buatIdSatuan
} from './produkUtils';
import { buatKunciStorageProduk } from './produkStorage';
import { normalisasiKategoriProduk } from './kategoriReferensi';
import { antrikanDanSinkronkanProduk } from '../../../lib/services/produkSyncService';

const angkaAman = (nilai, defaultValue = 0) => {
  if (nilai === null || nilai === undefined || nilai === '') return defaultValue;
  const angka = Number(nilai);
  return Number.isFinite(angka) ? angka : defaultValue;
};

export function transformProdukLama(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new TypeError('Data produk harus berupa objek.');
  }

  const satuanTerkecil = String(item.satuanJual || 'Pcs').trim() || 'Pcs';
  const modalEceran = angkaAman(item.modalEceran ?? item.modal, 0);
  const jualEceran = angkaAman(item.hargaEceran ?? item.jual, 0);

  const listSatuan = [];

  // 1. Satuan Dasar (Eceran) - Selalu di-generate sebagai base (rasio: 1)
  listSatuan.push({
    idSatuan: buatIdSatuan(),
    namaSatuan: satuanTerkecil,
    barcode: item.barcode || '',
    hargaBeli: modalEceran,
    hargaJual: jualEceran,
    rasio: 1,
    isBase: true
  });

  // 2. Satuan Grosir / Menengah (Jika ada)
  if (item.bisaGrosir) {
    const rasioGrosir = angkaAman(item.isiKeEceran || item.isiPerSatuan || item.isiSatuan, 0);
    if (rasioGrosir > 1) {
      const namaSatuanGrosir = String(item.satuanGrosirNama || 'Grosir').trim();
      if (namaSatuanGrosir.toLowerCase() !== satuanTerkecil.toLowerCase()) {
        const modalGrosirTotal = angkaAman(item.modalGrosirTotal, modalEceran * rasioGrosir);
        const jualGrosirTotal = angkaAman(item.jualGrosirTotal || item.hargaEceran * rasioGrosir, jualEceran * rasioGrosir);

        listSatuan.push({
          idSatuan: buatIdSatuan(),
          namaSatuan: namaSatuanGrosir,
          barcode: '',
          hargaBeli: modalGrosirTotal,
          hargaJual: jualGrosirTotal,
          rasio: rasioGrosir,
          isBase: false
        });
      }
    }
  }

  // 3. Satuan Grosir Besar / Terbesar (Jika ada)
  if (item.bisaGrosirBesar) {
    const rasioBesar = angkaAman(item.isiGrosirBesar, 0);
    if (rasioBesar > 1) {
      const namaSatuanBesar = String(item.satuanGrosirBesarNama || item.satuanTerbesar || item.satuanBeli || 'Dus').trim();

      const sudahAda = listSatuan.some(s => s.namaSatuan.toLowerCase() === namaSatuanBesar.toLowerCase());
      if (!sudahAda) {
        const modalBesarTotal = angkaAman(item.hargaModalAgen || item.jualGrosirBesarTotal, modalEceran * rasioBesar);
        const jualBesarTotal = angkaAman(
          item.jualGrosirBesarPerPcs > 0
            ? item.jualGrosirBesarPerPcs * rasioBesar
            : (item.hargaAgen || jualEceran * rasioBesar),
          jualEceran * rasioBesar
        );

        listSatuan.push({
          idSatuan: buatIdSatuan(),
          namaSatuan: namaSatuanBesar,
          barcode: '',
          hargaBeli: modalBesarTotal,
          hargaJual: jualBesarTotal,
          rasio: rasioBesar,
          isBase: false
        });
      }
    }
  }

  // Menangani atribut varian sesuai skema baru
  const rawVarian = Array.isArray(item.varian) ? item.varian.filter(v => typeof v === 'string' && v.trim() !== '') : [];
  const punyaVarian = rawVarian.length > 0;

  return {
    idProduk: buatIdProduk(), // Selalu buat ID baru otomatis dari sistem, mengabaikan ID lama
    namaProduk: typeof item.nama === 'string' ? item.nama : '',
    kategori: normalisasiKategoriProduk(item.kategori),
    punyaVarian,
    varian: rawVarian,
    stokUtama: angkaAman(item.stok),
    satuanTerkecil,
    listSatuan
  };
}

export async function importProdukJson(dataProduk, storeId) {
  if (!Array.isArray(dataProduk)) {
    throw new TypeError('File JSON harus berisi array produk.');
  }
  const kunciStorage = buatKunciStorageProduk(storeId);
  if (!kunciStorage) {
    throw new Error('ID toko aktif tidak tersedia. Produk tidak dapat diimpor.');
  }

  const hasil = { berhasil: 0, gagal: 0 };
  const produkImpor = [];

  dataProduk.forEach((item, indeks) => {
    try {
      produkImpor.push(transformProdukLama(item));
    } catch (error) {
      hasil.gagal += 1;
      console.error(`Gagal memetakan produk JSON pada indeks ${indeks}.`, error);
    }
  });

  if (produkImpor.length > 0) {
    let produkTersimpan;
    try {
      const dataTersimpan = localStorage.getItem(kunciStorage);
      produkTersimpan = dataTersimpan ? JSON.parse(dataTersimpan) : [];
      if (!Array.isArray(produkTersimpan)) {
        throw new TypeError('Daftar produk tersimpan bukan array.');
      }
    } catch (error) {
      console.error('Gagal membaca daftar produk toko sebelum impor.', error);
      throw new Error('Daftar produk toko tidak dapat dibaca; impor dibatalkan.', { cause: error });
    }

    // Karena menggunakan ID baru otomatis untuk setiap item impor,
    // kita langsung tambahkan (push) produk-produk baru ini ke dalam daftar penyimpanan lokal.
    produkImpor.forEach((produkBaru) => {
      produkTersimpan.push(produkBaru);
    });

    try {
      localStorage.setItem(kunciStorage, JSON.stringify(produkTersimpan));
    } catch (error) {
      console.error('Gagal menyimpan hasil impor produk ke toko aktif.', error);
      throw new Error('Hasil impor tidak dapat disimpan ke penyimpanan toko.', { cause: error });
    }

    hasil.berhasil = produkImpor.length;
    hasil.daftarProduk = produkTersimpan;
    
    // Antrekan produk yang baru diimpor untuk sinkronisasi ke Firestore
    hasil.sinkronisasi = await antrikanDanSinkronkanProduk(storeId, produkImpor);
  }

  return hasil;
}