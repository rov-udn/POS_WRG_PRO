import { useCallback, useEffect, useState } from 'react';
import { EVENT_PRODUK_DIPERBARUI } from '../features/produk/utils/produkUtils';
import { EVENT_MENU_NOTIFICATIONS_DIPERBARUI } from '../utils/menuNotifications';
import { buatKunciStorageProduk } from '../features/produk/utils/produkStorage';
const KUNCI_STORAGE_DRAF_BELANJA = 'pos_warung_draf_belanja';
const KUNCI_STORAGE_KERANJANG_RESTOCK = 'pos_warung_keranjang_restock';
const KUNCI_STORAGE_ANTREAN_RESTOCK = 'pos_warung_antrean_restock';
const KUNCI_STORAGE_SETTINGS = 'pos_wrg_settings';

function bacaDataStorage(kunci, defaultValue) {
  if (!kunci) return defaultValue;
  try {
    const data = localStorage.getItem(kunci);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Gagal membaca ${kunci} untuk indikator menu:`, error);
    return defaultValue;
  }
}

function hitungProdukPerluPerhatian(daftarProduk) {
  if (!Array.isArray(daftarProduk)) return 0;

  return daftarProduk.reduce((jumlah, produk) => {
    const kategoriKosong = typeof produk?.kategori !== 'string'
      || produk.kategori.trim() === '';
    const daftarSatuan = Array.isArray(produk?.listSatuan) ? produk.listSatuan : [];
    const hargaPerluPerhatian = daftarSatuan.some((satuan) => {
      const hargaBeli = Number(satuan?.hargaBeli);
      const hargaJual = Number(satuan?.hargaJual);
      return !Number.isFinite(hargaBeli)
        || hargaBeli <= 0
        || !Number.isFinite(hargaJual)
        || hargaJual <= 0
        || hargaJual <= hargaBeli;
    });

    return jumlah + (
      kategoriKosong || daftarSatuan.length === 0 || hargaPerluPerhatian ? 1 : 0
    );
  }, 0);
}

function hitungItemRestock(keranjang, antrean) {
  const jumlahKeranjang = Array.isArray(keranjang) ? keranjang.length : 0;
  const jumlahAntrean = Array.isArray(antrean)
    ? antrean.reduce(
        (jumlah, kiriman) => jumlah + (Array.isArray(kiriman?.items) ? kiriman.items.length : 0),
        0
      )
    : 0;
  return jumlahKeranjang + jumlahAntrean;
}

function bacaIndikatorMenu(jumlahProdukPerluPerhatian, kunciStorageProduk) {
  const drafBelanja = bacaDataStorage(KUNCI_STORAGE_DRAF_BELANJA, []);
  const keranjangRestock = bacaDataStorage(KUNCI_STORAGE_KERANJANG_RESTOCK, []);
  const antreanRestock = bacaDataStorage(KUNCI_STORAGE_ANTREAN_RESTOCK, []);
  const settings = bacaDataStorage(KUNCI_STORAGE_SETTINGS, {});
  const jumlahProduk = Number.isFinite(jumlahProdukPerluPerhatian)
    ? jumlahProdukPerluPerhatian
    : hitungProdukPerluPerhatian(
        bacaDataStorage(kunciStorageProduk, [])
      );
  const profil = settings?.profil || {};
  const profilBelumLengkap = ['namaToko', 'alamat', 'noTelp'].some(
    (field) => typeof profil[field] !== 'string' || profil[field].trim() === ''
  );

  return {
    belanja: Array.isArray(drafBelanja) ? drafBelanja.length : 0,
    gudang: hitungItemRestock(keranjangRestock, antreanRestock)
      + jumlahProduk,
    produk: jumlahProduk,
    setting: profilBelumLengkap
  };
}

export default function useMenuNotifications(storeId) {
  const kunciStorageProduk = buatKunciStorageProduk(storeId);
  const [indikator, setIndikator] = useState(() => bacaIndikatorMenu(undefined, kunciStorageProduk));

  const perbaruiIndikator = useCallback((event) => {
    setIndikator((sebelumnya) => {
      const produkBerubah = event?.type === EVENT_PRODUK_DIPERBARUI
        || (kunciStorageProduk && event?.type === 'storage' && event.key === kunciStorageProduk);
      const jumlahProdukPerluPerhatian = produkBerubah
        ? hitungProdukPerluPerhatian(
            bacaDataStorage(kunciStorageProduk, [])
          )
        : sebelumnya.produk;
      return bacaIndikatorMenu(jumlahProdukPerluPerhatian, kunciStorageProduk);
    });
  }, [kunciStorageProduk]);

  useEffect(() => {
    const kunciDipantau = new Set([
      ...(kunciStorageProduk ? [kunciStorageProduk] : []),
      KUNCI_STORAGE_DRAF_BELANJA,
      KUNCI_STORAGE_KERANJANG_RESTOCK,
      KUNCI_STORAGE_ANTREAN_RESTOCK,
      KUNCI_STORAGE_SETTINGS
    ]);
    const tanganiStorage = (event) => {
      if (kunciDipantau.has(event.key)) perbaruiIndikator();
    };

    window.addEventListener('storage', tanganiStorage);
    window.addEventListener(EVENT_PRODUK_DIPERBARUI, perbaruiIndikator);
    window.addEventListener(EVENT_MENU_NOTIFICATIONS_DIPERBARUI, perbaruiIndikator);
    return () => {
      window.removeEventListener('storage', tanganiStorage);
      window.removeEventListener(EVENT_PRODUK_DIPERBARUI, perbaruiIndikator);
      window.removeEventListener(EVENT_MENU_NOTIFICATIONS_DIPERBARUI, perbaruiIndikator);
    };
  }, [perbaruiIndikator, kunciStorageProduk]);

  return indikator;
}
