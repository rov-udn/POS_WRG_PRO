import React from 'react';

export default function RiwayatRestock({ riwayatRestock }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-800">Riwayat Log Gudang (Restock & Penyesuaian)</h2>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
              <th className="p-3">Tanggal</th>
              <th className="p-3">Produk</th>
              <th className="p-3">Aksi / Alasan</th>
              <th className="p-3">Perubahan (Pcs)</th>
              <th className="p-3">Stok Akhir</th>
              <th className="p-3">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {riwayatRestock.map((log) => (
              <tr key={log.idLog} className="hover:bg-gray-50">
                <td className="p-3 text-xs text-gray-500">
                  {new Date(log.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="p-3 font-medium text-gray-800">{log.namaProduk}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    log.tipeAksi === 'PENAMBAHAN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.alasan}
                  </span>
                </td>
                <td className={`p-3 font-bold ${log.tipeAksi === 'PENAMBAHAN' ? 'text-green-600' : 'text-red-600'}`}>
                  {log.tipeAksi === 'PENAMBAHAN' ? `+${log.totalPerubahanPcs}` : `-${log.totalPerubahanPcs}`}
                </td>
                <td className="p-3 text-gray-700 font-semibold">{log.stokSesudah}</td>
                <td className="p-3 text-xs text-gray-500">{log.catatan}</td>
              </tr>
            ))}
            {riwayatRestock.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400 text-sm">
                  Belum ada riwayat aktivitas gudang.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}