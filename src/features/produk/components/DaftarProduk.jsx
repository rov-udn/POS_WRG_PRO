import React from 'react';

export default function DaftarProduk({ daftarProduk = [] }) {
  if (daftarProduk.length === 0) {
    return <p className="text-gray-500 text-sm py-4">Tidak ada produk.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {daftarProduk.map((item) => (
        <li key={item.idProduk} className="py-3 px-2">
          <span className="font-medium text-gray-800">{item.namaProduk}</span>
        </li>
      ))}
    </ul>
  );
}