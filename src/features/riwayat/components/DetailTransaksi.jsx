import React from 'react';
import BaseModal from '../../../components/ui/BaseModal';

export default function DetailTransaksi({ transaksi, isOpen, onClose }) {
  // Jika tidak ada data transaksi yang dipilih, tidak perlu me-render apapun
  if (!transaksi) return null;

  // Helper untuk memformat angka menjadi mata uang Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Struk: ${transaksi.noStruk}`}
      subtitle={`Waktu: ${new Date(transaksi.tanggal).toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium'
      })}`}
      size="md"
    >
      <div className="space-y-4 text-sm">
        {/* Informasi Ringkas Transaksi */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 block">Kasir / Operator:</span>
            <span className="font-semibold text-gray-800">{transaksi.namaKasir}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Metode Pembayaran:</span>
            <span className="font-semibold text-gray-800">{transaksi.metodePembayaran}</span>
          </div>
        </div>

        {/* Daftar Item Barang yang Dibeli */}
        <div className="border-t border-b divide-y py-2 max-h-60 overflow-y-auto">
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Rincian Barang</p>
          {transaksi.items && transaksi.items.map((item, idx) => (
            <div key={idx} className="py-2 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-gray-800">{item.namaProduk}</p>
                <p className="text-gray-500">
                  {item.qty} {item.namaSatuan} × {formatRupiah(item.hargaJualSatuan)}
                </p>
              </div>
              <span className="font-bold text-gray-800">
                {formatRupiah(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Kalkulasi Total Belanja & Pembayaran */}
        <div className="space-y-1.5 pt-1 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Total Item Barang:</span>
            <span className="font-medium text-gray-800">{transaksi.totalQtyItems} pcs</span>
          </div>

          <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-2">
            <span>Total Belanja:</span>
            <span className="text-green-600">{formatRupiah(transaksi.totalBayar)}</span>
          </div>

          {transaksi.metodePembayaran === 'CASH' && (
            <>
              <div className="flex justify-between text-gray-600">
                <span>Uang Diterima:</span>
                <span>{formatRupiah(transaksi.jumlahUangDiterima)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-semibold text-gray-800">
                <span>Kembalian:</span>
                <span>{formatRupiah(transaksi.kembalian)}</span>
              </div>
            </>
          )}
        </div>

        {/* Tombol Aksi Modal */}
        <div className="pt-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </BaseModal>
  );
}