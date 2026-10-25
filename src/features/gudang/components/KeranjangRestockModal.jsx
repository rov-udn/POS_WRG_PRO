import React, { useState } from 'react';
import BaseModal from '../../../components/ui/BaseModal';

export default function KeranjangRestockModal({
  isOpen,
  onClose,
  keranjang,
  onUbahItem,
  onHapusItem,
  onProsesMassal
}) {
  const [catatan, setCatatan] = useState('');

  const handleProses = (e) => {
    e.preventDefault();
    if (keranjang.length === 0) return;
    onProsesMassal(catatan);
    setCatatan('');
    onClose();
    alert('Semua barang dalam keranjang berhasil di-restock!');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Keranjang Restock Massal"
      subtitle={`${keranjang.length} barang siap diperbarui stoknya`}
      size="lg"
    >
      <form onSubmit={handleProses} className="space-y-4">
        {keranjang.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Keranjang restock masih kosong. Pilih barang dari tabel stok terlebih dahulu.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto pr-1">
            {keranjang.map((item) => (
              <div key={item.idProduk} className="py-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{item.namaProduk}</h4>
                    <p className="text-xs text-gray-500">
                      Stok saat ini: {item.stokUtamaSaatIni} {item.satuanTerkecil}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onHapusItem(item.idProduk)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Batal
                  </button>
                </div>

                {/* Form Baris Memanjang Minimalis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg text-xs">
                  {/* Pilihan Satuan & Qty */}
                  <div className="flex items-center gap-2">
                    <select
                      value={item.idSatuanDipilih}
                      onChange={(e) => onUbahItem(item.idProduk, 'idSatuanDipilih', e.target.value)}
                      className="px-2 py-1 border rounded bg-white font-medium"
                    >
                      {item.listSatuan.map((s) => (
                        <option key={s.idSatuan} value={s.idSatuan}>
                          {s.namaSatuan} (x{s.rasio})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.qtyRestock}
                      onChange={(e) => onUbahItem(item.idProduk, 'qtyRestock', e.target.value)}
                      className="w-16 px-2 py-1 border rounded bg-white text-center font-bold"
                      placeholder="Qty"
                      required
                    />
                  </div>

                  {/* Info Pembanding Harga Beli */}
                  <div className="flex flex-col justify-center text-[11px] text-gray-600">
                    <span>Modal Master: <b>Rp{Number(item.hargaBeliMaster).toLocaleString('id-ID')}</b></span>
                  </div>

                  {/* Checkbox Update Harga */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.updateHargaBeli}
                        onChange={(e) => onUbahItem(item.idProduk, 'updateHargaBeli', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-[11px]">Update Modal:</span>
                    </label>
                    {item.updateHargaBeli && (
                      <input
                        type="number"
                        value={item.hargaBeliBaru}
                        onChange={(e) => onUbahItem(item.idProduk, 'hargaBeliBaru', e.target.value)}
                        className="w-24 px-1.5 py-0.5 border rounded bg-white font-semibold"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {keranjang.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Nota / Agen</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Belanja Agen Makmur"
                className="w-full px-3 py-1.5 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Proses Restock Semua ({keranjang.length})
              </button>
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
}