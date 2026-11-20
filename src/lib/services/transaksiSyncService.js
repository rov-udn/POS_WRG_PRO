import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import {
  bacaArrayStorageKasir,
  buatKunciStorageKasir,
  simpanArrayStorageKasir
} from '../../features/kasir/utils/kasirStorage';

const sinkronisasiAktif = new Map();
const sinkronisasiDimintaUlang = new Set();

const normalisasiStoreId = (storeId) => {
  const idToko = typeof storeId === 'string' ? storeId.trim() : '';
  if (!idToko) throw new Error('ID toko aktif tidak tersedia.');
  return idToko;
};

const bacaTransaksi = (storeId) => {
  const kunci = buatKunciStorageKasir('transactions', { storeId });
  return bacaArrayStorageKasir(kunci, 'Riwayat transaksi');
};

const simpanTransaksi = (storeId, transaksi) => {
  const kunci = buatKunciStorageKasir('transactions', { storeId });
  simpanArrayStorageKasir(kunci, transaksi, 'Riwayat transaksi');
};

const ubahStatusSinkronisasi = (storeId, target, statusSync, detail = {}) => {
  const transaksi = bacaTransaksi(storeId);
  const indeks = transaksi.findIndex((item) =>
    target.idTransaksi
      ? item.idTransaksi === target.idTransaksi
      : !item.idTransaksi &&
        item.noStruk === target.noStruk &&
        item.tanggal === target.tanggal &&
        item.statusSync === target.statusSync
  );
  if (indeks < 0) {
    throw new Error(`Transaksi ${target.idTransaksi || target.noStruk || ''} tidak ditemukan di penyimpanan lokal.`);
  }

  transaksi[indeks] = {
    ...transaksi[indeks],
    statusSync,
    statusSyncDiperbaruiPada: new Date().toISOString(),
    ...detail
  };
  simpanTransaksi(storeId, transaksi);
};

const buatDataFirestore = (transaksi, storeId) => {
  const dataTransaksi = { ...transaksi };
  delete dataTransaksi.statusSync;
  delete dataTransaksi.statusSyncDiperbaruiPada;
  delete dataTransaksi.pesanErrorSync;

  return {
    ...dataTransaksi,
    store_id: storeId
  };
};

async function prosesSinkronisasiPenjualan(storeId) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const tertunda = bacaTransaksi(storeId).filter(
      (item) =>
        item.store_id === storeId &&
        item.tipeTransaksi !== 'RETUR_TUKAR' &&
        item.statusSync !== 'synced'
    ).length;
    return { status: 'offline', berhasil: 0, tertunda };
  }

  let transaksi = bacaTransaksi(storeId);
  let perluSimpanStatus = false;
  transaksi = transaksi.map((item) => {
    if (item.store_id !== storeId || item.tipeTransaksi === 'RETUR_TUKAR') return item;
    if (item.statusSync === 'syncing' || item.statusSync === 'failed') {
      perluSimpanStatus = true;
      return {
        ...item,
        statusSync: 'pending',
        statusSyncDiperbaruiPada: new Date().toISOString(),
        pesanErrorSync: ''
      };
    }
    return item;
  });
  if (perluSimpanStatus) simpanTransaksi(storeId, transaksi);

  let berhasil = 0;
  let gagal = 0;
  while (true) {
    const transaksiPending = bacaTransaksi(storeId).filter(
      (item) =>
        item.store_id === storeId &&
        item.tipeTransaksi !== 'RETUR_TUKAR' &&
        item.statusSync === 'pending'
    );
    if (transaksiPending.length === 0) {
      if (sinkronisasiDimintaUlang.delete(storeId)) continue;
      return {
        status: gagal > 0 ? 'failed' : 'synced',
        berhasil,
        gagal
      };
    }

    for (const transaksiLokal of transaksiPending) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const tertunda = bacaTransaksi(storeId).filter(
          (item) =>
            item.store_id === storeId &&
            item.tipeTransaksi !== 'RETUR_TUKAR' &&
            item.statusSync !== 'synced'
        ).length;
        return { status: 'offline', berhasil, gagal, tertunda };
      }

      const { idTransaksi } = transaksiLokal;
      if (!idTransaksi) {
        ubahStatusSinkronisasi(storeId, transaksiLokal, 'failed', {
          pesanErrorSync: 'ID transaksi unik tidak tersedia.'
        });
        gagal += 1;
        continue;
      }

      ubahStatusSinkronisasi(storeId, transaksiLokal, 'syncing', { pesanErrorSync: '' });
      try {
        await setDoc(
          doc(db, 'stores', storeId, 'transactions', idTransaksi),
          buatDataFirestore(transaksiLokal, storeId)
        );
        ubahStatusSinkronisasi(storeId, transaksiLokal, 'synced', {
          pesanErrorSync: ''
        });
        berhasil += 1;
      } catch (error) {
        ubahStatusSinkronisasi(storeId, transaksiLokal, 'failed', {
          pesanErrorSync: error instanceof Error ? error.message : String(error)
        });
        gagal += 1;
      }
    }
  }
}

export function sinkronkanPenjualanPending(storeId) {
  let idToko;
  try {
    idToko = normalisasiStoreId(storeId);
  } catch (error) {
    return Promise.reject(error);
  }
  if (sinkronisasiAktif.has(idToko)) {
    sinkronisasiDimintaUlang.add(idToko);
    return sinkronisasiAktif.get(idToko);
  }

  const jalankanDenganLock = () => {
    const jalankan = () => prosesSinkronisasiPenjualan(idToko);
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
      return navigator.locks.request(
        `pos_warung_sales_sync:${encodeURIComponent(idToko)}`,
        jalankan
      );
    }
    return jalankan();
  };

  const janjiSinkronisasi = Promise.resolve()
    .then(jalankanDenganLock)
    .finally(() => {
      sinkronisasiAktif.delete(idToko);
      sinkronisasiDimintaUlang.delete(idToko);
    });
  sinkronisasiAktif.set(idToko, janjiSinkronisasi);
  return janjiSinkronisasi;
}
