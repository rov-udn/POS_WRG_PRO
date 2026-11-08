import { useRef, useState } from 'react';
import { SectionCard } from './SettingFormFields';

const PREFIX_STORAGE_APLIKASI = ['pos_wrg_', 'pos_warung_', 'warung_'];

function isianStorageAplikasi(key) {
  return PREFIX_STORAGE_APLIKASI.some((prefix) => key.startsWith(prefix));
}

export default function BackupRestoreSection() {
  const inputBackupRef = useRef(null);
  const [statusBackup, setStatusBackup] = useState('');

  const eksporBackup = () => {
    try {
      const data = {};
      for (let indeks = 0; indeks < localStorage.length; indeks += 1) {
        const key = localStorage.key(indeks);
        if (key && isianStorageAplikasi(key)) {
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
        if (key && isianStorageAplikasi(key) && !(key in backup.data)) {
          keyUntukDihapus.push(key);
        }
      }
      keyUntukDihapus.forEach((key) => localStorage.removeItem(key));
      entries.forEach(([key, value]) => localStorage.setItem(key, value));
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
          onClick={eksporBackup}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Unduh backup JSON
        </button>
        <button
          type="button"
          onClick={() => inputBackupRef.current?.click()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
      {statusBackup && (
        <p role="status" className="text-sm text-gray-600">
          {statusBackup}
        </p>
      )}
    </SectionCard>
  );
}
