import React, { useState } from 'react';
import BaseModal from '../../../components/ui/BaseModal';

export default function PenyesuaianStokModal({
  isOpen,
  onClose,
  produk,
  onSubmitPenyesuaian
}) {
  const [qtyPcsKurang, setQtyPcsKurang] = useState('');
  const [alasan, setAlasan] = useState('RUSAK');
  const [catatan, setCatatan] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!qtyPcsKurang || Number(qtyPcsKurang) <= 0) {
      alert('Masukkan jumlah pengurangan stok dengan benar!');
      return;
    }

    if (Number(qtyPcsKurang) > produk.stokUtama) {
      alert('Jumlah pengurangan tidak boleh melebihi stok yang ada!');
      return;
    }

    onSubmitPenyesuaian({
      idProduk: produk.idProduk,
      qtyPcsKurang: Number(qtyPcsKurang),
      alasan,
      catatan
    });

    // Reset & Tutup
    setQtyPcsKurang('');
    setCatatan('');
    setAlasan('RUSAK');
    onClose();
    alert('Penyesuaian stok berhasil disimpan!');
  };

  if (!produk) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Penyesuaian Stok: ${produk.namaProduk}`}
      subtitle={`Stok saat ini: ${produk.stokUtama} ${produk.satuanTerkecil}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          ⚠️ Fitur ini akan <b>mengarungi stok utama</b> produk dalam satuan terkecil ({produk.satuanTerkecil}).
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Alasan Pengurangan
          </label>
          <select
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="RUSAK">RUSAK</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="HILANG">HILANG</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Jumlah Berkurang ({produk.satuanTerkecil})
          </label>
          <input
            type="number"
            min="1"
            max={produk.stokUtama}
            value={qtyPcsKurang}
            onChange={(e) => setQtyPcsKurang(e.target.value)}
            placeholder="Contoh: 3"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Catatan Tambahan
          </label>
          <input
            type="text"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Bocor / Gigitan tikus"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Kurangi Stok
          </button>
        </div>
      </form>
    </BaseModal>
  );
}