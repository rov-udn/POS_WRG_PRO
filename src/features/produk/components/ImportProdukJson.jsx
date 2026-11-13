import { useRef, useState } from 'react';
import Button from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { importProdukJson } from '../utils/importProdukJson';
import { importProdukExcel } from '../utils/importProdukExcel';

export default function ImportProdukJson({ storeId, onImportComplete }) {
  const jsonInputRef = useRef(null);
  const excelInputRef = useRef(null);
  const [bukaModal, setBukaModal] = useState(false);
  const [sedangImport, setSedangImport] = useState(false);
  const [notifikasi, setNotifikasi] = useState(null);

  const prosesFileJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSedangImport(true);
    setNotifikasi(null);
    setBukaModal(false);

    try {
      const dataProduk = JSON.parse(await file.text());
      const hasil = await importProdukJson(dataProduk, storeId);
      if (hasil.daftarProduk) onImportComplete?.(hasil.daftarProduk);

      const pesan = `${hasil.berhasil} produk JSON berhasil diimpor.${hasil.sinkronisasi?.pesan ? ` ${hasil.sinkronisasi.pesan}` : ''}`;
      setNotifikasi({
        variant: hasil.gagal > 0 || (hasil.sinkronisasi && hasil.sinkronisasi.status !== 'synced')
          ? 'warning'
          : 'success',
        pesan: hasil.gagal > 0 ? `${pesan} ${hasil.gagal} data gagal.` : pesan
      });
    } catch (error) {
      console.error('Gagal mengimpor file JSON.', error);
      setNotifikasi({
        variant: 'danger',
        pesan: `Gagal mengimpor JSON: ${error.message || 'Format tidak valid.'}`
      });
    } finally {
      setSedangImport(false);
    }
  };

  const prosesFileExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSedangImport(true);
    setNotifikasi(null);
    setBukaModal(false);

    try {
      const hasil = await importProdukExcel(file, storeId);
      if (hasil.daftarProduk) onImportComplete?.(hasil.daftarProduk);

      const pesan = `${hasil.berhasil} produk Excel berhasil diimpor (${hasil.dilewati} baris ringkasan dilewati).${hasil.sinkronisasi?.pesan ? ` ${hasil.sinkronisasi.pesan}` : ''}`;
      setNotifikasi({
        variant: hasil.gagal > 0 || (hasil.sinkronisasi && hasil.sinkronisasi.status !== 'synced')
          ? 'warning'
          : 'success',
        pesan: hasil.gagal > 0 ? `${pesan} ${hasil.gagal} data gagal.` : pesan
      });
    } catch (error) {
      console.error('Gagal mengimpor file Excel.', error);
      setNotifikasi({
        variant: 'danger',
        pesan: `Gagal mengimpor Excel: ${error.message || 'Pastikan format file .xlsx/.xls valid.'}`
      });
    } finally {
      setSedangImport(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Hidden inputs untuk masing-masing tipe file */}
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        onChange={prosesFileJson}
        className="hidden"
      />
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={prosesFileExcel}
        className="hidden"
      />

      <Button
        variant="info"
        size="sm"
        disabled={sedangImport || !storeId}
        onClick={() => setBukaModal(true)}
      >
        {sedangImport ? 'Mengimpor...' : '📂 Import Produk (JSON / Excel)'}
      </Button>

      {/* Popup Modal Pilihan */}
      {bukaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pilih Metode Impor Data
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Silakan pilih format file yang ingin Anda masukkan ke sistem toko:
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Button
                variant="info"
                className="w-full justify-center"
                onClick={() => jsonInputRef.current?.click()}
              >
                📄 Import File JSON
              </Button>
              <Button
                variant="success"
                className="w-full justify-center"
                onClick={() => excelInputRef.current?.click()}
              >
                📊 Import File Excel (.xlsx / .xls)
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => setBukaModal(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {!storeId && (
        <p role="alert" className="text-xs text-red-700">
          ID toko aktif tidak tersedia; impor dinonaktifkan.
        </p>
      )}

      {notifikasi && (
        <div role="status" className="w-full">
          <Alert variant={notifikasi.variant} onClose={() => setNotifikasi(null)}>
            {notifikasi.pesan}
          </Alert>
        </div>
      )}
    </div>
  );
}