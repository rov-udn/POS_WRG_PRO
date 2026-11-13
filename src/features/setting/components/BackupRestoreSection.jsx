import { useRef, useState } from 'react';
import { SectionCard } from './SettingFormFields';
import { awalanKunciStorageProduk, buatKunciStorageProduk } from '../../produk/utils/produkStorage';

const PREFIX_STORAGE_APLIKASI = ['pos_wrg_', 'pos_warung_', 'warung_'];
const KUNCI_STORAGE_PRODUK_LEGACY = 'pos_warung_products';

function isianStorageAplikasi(key) {
  return PREFIX_STORAGE_APLIKASI.some((prefix) => key.startsWith(prefix));
}

function isianDataProduk(key) {
  return key === awalanKunciStorageProduk
    || key.startsWith(`${awalanKunciStorageProduk}:`)
    || key === KUNCI_STORAGE_PRODUK_LEGACY;
}

export default function BackupRestoreSection({ storeId }) {
  const inputBackupRef = useRef(null);
  const [statusBackup, setStatusBackup] = useState('');
  const kunciProdukAktif = buatKunciStorageProduk(storeId);

  const eksporBackup = () => {
    try {
      const data = {};
      for (let indeks = 0; indeks < localStorage.length; indeks += 1) {
        const key = localStorage.key(indeks);
        if (
          key &&
          isianStorageAplikasi(key) &&
          (!isianDataProduk(key) || key === kunciProdukAktif)
        ) {
          data[key] = localStorage.getItem(key);
        }
      }

      const backup = {
        format: 'pos-wrg-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        data
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-pos-wrg-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusBackup('Backup berhasil diunduh.');
    } catch (error) {
      console.error('Gagal mengekspor backup aplikasi:', error);
      setStatusBackup('Backup gagal dibuat. Silakan coba kembali.');
    }
  };

  const imporBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!kunciProdukAktif) {
      setStatusBackup('ID toko aktif tidak tersedia. Pemulihan backup dibatalkan.');
      return;
    }

    try {
      const backup = JSON.parse(await file.text());
      const isValidData =
        backup &&
        backup.format === 'pos-wrg-backup' &&
        backup.version === 1 &&
        backup.data &&
        typeof backup.data === 'object' &&
        !Array.isArray(backup.data);
      const entries = isValidData ? Object.entries(backup.data) : [];
      const isValidEntries =
        entries.length > 0 &&
        entries.every(
          ([key, value]) => isianStorageAplikasi(key) && typeof value === 'string'
        );

      if (!isValidData || !isValidEntries) {
        setStatusBackup('File backup tidak valid atau tidak berisi data aplikasi.');
        return;
      }

      const dataDipulihkan = {};
      entries.forEach(([key, value]) => {
        if (!isianDataProduk(key)) {
          dataDipulihkan[key] = value;
        } else if (key === kunciProdukAktif) {
          dataDipulihkan[kunciProdukAktif] = value;
        } else if (
          (key === awalanKunciStorageProduk || key === KUNCI_STORAGE_PRODUK_LEGACY) &&
          !(kunciProdukAktif in backup.data)
        ) {
          dataDipulihkan[kunciProdukAktif] = value;
        }
      });

      if (
        !window.confirm(
          'Pemulihan akan mengganti data aplikasi yang tersimpan di perangkat ini. Lanjutkan?'
        )
      ) {
        return;
      }

      const keyUntukDihapus = [];
      for (let indeks = 0; indeks < localStorage.length; indeks += 1) {
        const key = localStorage.key(indeks);
        if (
          key &&
          isianStorageAplikasi(key) &&
          (!isianDataProduk(key) || key === kunciProdukAktif) &&
          !(key in dataDipulihkan)
        ) {
          keyUntukDihapus.push(key);
        }
      }
      keyUntukDihapus.forEach((key) => localStorage.removeItem(key));
      Object.entries(dataDipulihkan).forEach(([key, value]) => localStorage.setItem(key, value));
      window.location.reload();
    } catch (error) {
      console.error('Gagal mengimpor backup aplikasi:', error);
      setStatusBackup('File backup gagal diproses. Pastikan file JSON dapat dibaca.');
    }
  };

  return (
    <SectionCard title="Backup dan pemulihan data">
      <p className="text-sm leading-6 text-gray-600">
        Backup mencakup data aplikasi POS yang tersimpan di browser, seperti produk,
        transaksi, stok, dan pengaturan.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!kunciProdukAktif}
          onClick={eksporBackup}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Unduh backup JSON
        </button>
        <button
          type="button"
          disabled={!kunciProdukAktif}
          onClick={() => inputBackupRef.current?.click()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pulihkan dari backup
        </button>
        <input
          ref={inputBackupRef}
          type="file"
          accept=".json,application/json"
          onChange={imporBackup}
          className="hidden"
          aria-label="Pilih file backup aplikasi"
        />
      </div>
      {!kunciProdukAktif && (
        <p role="alert" className="text-sm text-red-700">
          ID toko aktif tidak tersedia; backup dan pemulihan dinonaktifkan.
        </p>
      )}
      {statusBackup && (
        <p role="status" className="text-sm text-gray-600">
          {statusBackup}
        </p>
      )}
    </SectionCard>
  );
}
