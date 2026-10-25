import React, { useEffect, useRef } from 'react';

export default function PencarianProduk({
  kataKunci,
  onUbahKataKunci,
  onScanBarcode
}) {
  const inputRef = useRef(null);

  // Auto focus ke input pencarian saat komponen dimuat
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Menangani input dari scanner barcode (mendeteksi tombol Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nilaiInput = kataKunci.trim();
      if (nilaiInput) {
        onScanBarcode(nilaiInput);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 text-lg">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={kataKunci}
          onChange={(e) => onUbahKataKunci(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cari nama produk atau scan barcode di sini..."
          className="w-full pl-10 pr-10 py-3 text-base border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium shadow-sm"
        />
        {kataKunci && (
          <button
            onClick={() => onUbahKataKunci('')}
            className="absolute right-3 text-gray-400 hover:text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center"
            title="Bersihkan pencarian"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mt-1 pl-1">
        💡 <b>Tips Kasir:</b> Tekan <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">Enter</kbd> atau tembak barcode scanner untuk mencari/menambah otomatis.
      </p>
    </div>
  );
}