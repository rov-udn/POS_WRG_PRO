import { useRef, useState } from 'react';
import Button from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { importProdukJson } from '../utils/importProdukJson';

export default function ImportProdukJson() {
  const inputRef = useRef(null);
  const [sedangImport, setSedangImport] = useState(false);
  const [notifikasi, setNotifikasi] = useState(null);

  const prosesFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSedangImport(true);
    setNotifikasi(null);

    try {
      const dataProduk = JSON.parse(await file.text());
      const hasil = await importProdukJson(dataProduk);

      if (hasil.berhasil === 0 && hasil.gagal > 0) {
        setNotifikasi({
          variant: 'danger',
          pesan: `Tidak ada produk yang berhasil diimpor. ${hasil.gagal} data gagal diproses.`
        });
      } else {
        const pesan = `${hasil.berhasil} produk berhasil diimpor.`;
        setNotifikasi({
          variant: hasil.gagal > 0 ? 'warning' : 'success',
          pesan: hasil.gagal > 0 ? `${pesan} ${hasil.gagal} data gagal diproses.` : pesan
        });
      }
    } catch (error) {
      console.error('Gagal membaca atau mengimpor file JSON produk.', error);
      setNotifikasi({
        variant: 'danger',
        pesan: 'File tidak dapat diimpor. Pastikan format JSON berisi array produk yang valid.'
      });
    } finally {
      setSedangImport(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={prosesFile}
        className="hidden"
        aria-label="Pilih file JSON produk"
      />
      <Button
        variant="info"
        size="sm"
        disabled={sedangImport}
        onClick={() => inputRef.current?.click()}
      >
        {sedangImport ? 'Mengimpor...' : 'Import JSON Produk'}
      </Button>
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
