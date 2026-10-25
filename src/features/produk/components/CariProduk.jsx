import React from 'react';

export default function CariProduk({ kataKunci, onUbahKataKunci }) {
  return (
    <div className="w-full">
      <input
        type="text"
        value={kataKunci}
        onChange={(e) => onUbahKataKunci(e.target.value)}
        placeholder="Cari nama produk..."
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}