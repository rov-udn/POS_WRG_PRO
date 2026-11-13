export default function FilterKategori({
  daftarProduk = [],
  kategoriAktif,
  onUbahKategori
}) {
  const daftarKategori = [...new Set(
    daftarProduk
      .map((produk) => typeof produk.kategori === 'string' ? produk.kategori.trim() : '')
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'id'));

  return (
    <div className="flex w-full items-center gap-2 sm:w-fit">
      <span
        className="max-w-[45%] truncate rounded-full bg-indigo-100 px-2.5 py-1.5 text-xs font-semibold text-indigo-800"
        title={kategoriAktif || 'Semua kategori'}
      >
        Kategori: {kategoriAktif || 'Semua'}
      </span>
      <select
        aria-label="Filter kategori produk"
        value={kategoriAktif}
        onChange={(event) => onUbahKategori(event.target.value)}
        className="h-10 min-w-0 flex-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm font-medium text-indigo-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 sm:w-64 sm:flex-none"
      >
        <option value="">Semua kategori</option>
        {daftarKategori.map((kategori) => (
          <option key={kategori} value={kategori}>{kategori}</option>
        ))}
      </select>
    </div>
  );
}
