import * as XLSX from 'xlsx';
import {
  buatIdProduk,
  buatIdSatuan
} from './produkUtils';
import { buatKunciStorageProduk } from './produkStorage';
import { normalisasiKategoriProduk } from './kategoriReferensi';
import { antrikanDanSinkronkanProduk } from '../../../lib/services/produkSyncService';

const angkaAman = (nilai, defaultValue = 0) => {
  if (nilai === null || nilai === undefined || nilai === '') return defaultValue;
  if (typeof nilai === 'number') {
    return Number.isFinite(nilai) ? nilai : defaultValue;
  }
  const dibersihkan = String(nilai).replace(/[^0-9.-]/g, '');
  const angka = Number(dibersihkan);
  return Number.isFinite(angka) ? angka : defaultValue;
};

const tebakKategoriDariNama = (namaProduk) => {
  const teks = String(namaProduk || '').toLowerCase();

  if (/(beras|gula|telur|minyak|sasa|royco|masako|garam|tepung|terigu|mie|indomie|sedap|sukses|saos|kecap|sambal|fermipan|agar)/.test(teks)) {
    return 'groceries';
  }
  if (/(aqua|le minerale|susu|kopi|good day|teh|larutan|adem sari|ultra|indomil|jahe|sirup|marjan|nutrisari|energen)/.test(teks)) {
    return 'beverages';
  }
  if (/(rokok|samsu|mild|sampoerna|surya|gudang garam|djarum|korek|filter|kretek|esse|dunhill)/.test(teks)) {
    return 'tobacco';
  }
  if (/(sabun|molto|pepsodent|sunlight|mama lemon|rinso|daia|soklin|zinc|clear|lifebuoy|nuvo|charm|mamy poko|pampers|baygon|wipol)/.test(teks)) {
    return 'household';
  }
  if (/(bodrex|antimo|paramex|oskadon|promag|tolak angin|antangin|betadine|hansaplast|paracetamol|mixagrip|komix)/.test(teks)) {
    return 'medical';
  }
  if (/(plastik|kresek|cup|gelas|sedotan|mika|sterofoam|karet|tali|lakban)/.test(teks)) {
    return 'packaging';
  }
  if (/(snack|biskuit|roti|nabati|ciki|chiki|chitato|taro|oreo|roma|tango|wafello|chocho|permen|coklat|jelly|es krim|superstar|rosben)/.test(teks)) {
    return 'snacks';
  }

  return 'miscellaneous';
};

const adalahBarisRingkasan = (baris) => {
  const nama = String(baris?.Produk ?? '').trim();
  if (!nama) return true;
  if (/^(stok|total stok)/i.test(nama)) return true;
  if (baris['Harga Pokok'] === undefined && baris['Harga Jual'] === undefined && baris.Satuan === undefined) {
    return true;
  }
  return false;
};

export function transformBarisExcel(baris) {
  if (!baris || typeof baris !== 'object' || Array.isArray(baris)) {
    throw new TypeError('Baris data Excel harus berupa objek.');
  }

  const namaProduk = String(baris.Produk ?? '').trim();
  if (!namaProduk) {
    throw new Error('Nama produk kosong.');
  }

  const satuanTerkecil = String(baris.Satuan ?? 'pcs').trim() || 'pcs';
  const hargaBeli = angkaAman(baris['Harga Pokok'], 0);
  const hargaJual = angkaAman(baris['Harga Jual'], 0);
  const stokUtama = angkaAman(baris.Stok, 0);

  return {
    idProduk: buatIdProduk(),
    namaProduk,
    kategori: normalisasiKategoriProduk(
      String(baris.Kategori ?? '').trim() || tebakKategoriDariNama(namaProduk)
    ),
    stokUtama,
    satuanTerkecil,
    listSatuan: [
      {
        idSatuan: buatIdSatuan(),
        namaSatuan: satuanTerkecil,
        barcode: '',
        hargaBeli,
        hargaJual,
        rasio: 1,
        isBase: true
      }
    ]
  };
}

export async function importProdukExcel(fileExcel, storeId) {
  const kunciStorage = buatKunciStorageProduk(storeId);
  if (!kunciStorage) {
    throw new Error('ID toko aktif tidak tersedia. Produk tidak dapat diimpor.');
  }

  const buffer = await fileExcel.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const namaSheetPertama = workbook.SheetNames[0];
  if (!namaSheetPertama) {
    throw new Error('File Excel tidak memiliki sheet data.');
  }

  const sheet = workbook.Sheets[namaSheetPertama];
  const daftarBaris = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const hasil = { berhasil: 0, gagal: 0, dilewati: 0 };
  const produkImpor = [];

  daftarBaris.forEach((baris, indeks) => {
    if (adalahBarisRingkasan(baris)) {
      hasil.dilewati += 1;
      return;
    }

    try {
      produkImpor.push(transformBarisExcel(baris));
    } catch (error) {
      hasil.gagal += 1;
      console.error(`Gagal memetakan baris Excel pada indeks ${indeks}.`, error);
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

    const indeksNama = new Map(
      produkTersimpan.map((produk, indeks) => [String(produk.namaProduk || '').trim().toLowerCase(), indeks])
    );

    const produkUntukSinkronisasi = [];
    produkImpor.forEach((produk) => {
      const kunciNama = produk.namaProduk.toLowerCase();
      const indeks = indeksNama.get(kunciNama);
      if (indeks === undefined) {
        indeksNama.set(kunciNama, produkTersimpan.length);
        produkTersimpan.push(produk);
        produkUntukSinkronisasi.push(produk);
      } else {
        const produkDiperbarui = {
          ...produkTersimpan[indeks],
          kategori: produk.kategori,
          stokUtama: produk.stokUtama,
          satuanTerkecil: produk.satuanTerkecil,
          listSatuan: produk.listSatuan
        };
        produkTersimpan[indeks] = produkDiperbarui;
        produkUntukSinkronisasi.push(produkDiperbarui);
      }
    });

    try {
      localStorage.setItem(kunciStorage, JSON.stringify(produkTersimpan));
    } catch (error) {
      console.error('Gagal menyimpan hasil impor Excel ke toko aktif.', error);
      throw new Error('Hasil impor tidak dapat disimpan ke penyimpanan toko.', { cause: error });
    }

    hasil.berhasil = produkImpor.length;
    hasil.daftarProduk = produkTersimpan;
    hasil.sinkronisasi = await antrikanDanSinkronkanProduk(storeId, produkUntukSinkronisasi);
  }

  return hasil;
}