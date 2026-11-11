export const KUNCI_STORAGE_UNPACK = 'active_unpack_items';
export const EVENT_UNPACK_DIPERBARUI = 'active-unpack-items-updated';
export const KUNCI_STORAGE_QUICK_BUTTONS = 'pos_warung_quick_buttons';
export const EVENT_QUICK_BUTTONS_UPDATED = 'quick-buttons-updated';

export const TOMBOL_CEPAT_DEFAULT = [
  { id: 'm1', label: 'Minuman', harga: 1000, kategori: 'minuman' },
  { id: 'j1', label: 'Jajanan', harga: 1000, kategori: 'jajanan' },
  { id: 'j2', label: 'Jajanan', harga: 2000, kategori: 'jajanan' }
];

export function bacaTombolCepat() {
  const data = localStorage.getItem(KUNCI_STORAGE_QUICK_BUTTONS);
  if (!data) return TOMBOL_CEPAT_DEFAULT;

  const hasil = JSON.parse(data);
  if (!Array.isArray(hasil)) {
    throw new Error('Daftar tombol cepat harus berupa daftar.');
  }
  if (hasil.length === 0) return TOMBOL_CEPAT_DEFAULT;

  const isValid = hasil.every((tombol) =>
    tombol &&
    typeof tombol.id === 'string' &&
    typeof tombol.label === 'string' &&
    tombol.label.trim() &&
    Number.isFinite(Number(tombol.harga)) &&
    Number(tombol.harga) >= 0 &&
    typeof tombol.kategori === 'string' &&
    tombol.kategori.trim()
  );
  const idUnik = new Set(hasil.map((tombol) => tombol.id));
  if (!isValid || idUnik.size !== hasil.length) {
    throw new Error('Daftar tombol cepat memiliki data tidak valid atau ID duplikat.');
  }

  return hasil.map((tombol) => ({
    ...tombol,
    label: tombol.label.trim(),
    harga: Number(tombol.harga),
    kategori: tombol.kategori.trim()
  }));
}

export function simpanTombolCepat(daftarTombol) {
  localStorage.setItem(KUNCI_STORAGE_QUICK_BUTTONS, JSON.stringify(daftarTombol));
  window.dispatchEvent(new Event(EVENT_QUICK_BUTTONS_UPDATED));
}

export function dapatkanKategoriUnpack(item, daftarProduk) {
  if (item.kategoriTombolCepat) {
    return String(item.kategoriTombolCepat).trim().toLocaleLowerCase('id-ID');
  }
  if (item.kategori) return String(item.kategori).trim().toLocaleLowerCase('id-ID');

  const produkTerkait = daftarProduk.find((produk) =>
    (item.idProduk && produk.idProduk === item.idProduk) ||
    (item.namaProdukGrosir && item.namaProdukGrosir.startsWith(produk.namaProduk))
  );
  return String(produkTerkait?.kategori || '').trim().toLocaleLowerCase('id-ID');
}

export function cocokkanKategoriUnpack(item, tombol, daftarProduk) {
  if (item.idTombolCepat) {
    if (item.idTombolCepat === tombol.id) return true;
    const idTombolLama = {
      'minuman-1000': { kategori: 'minuman', harga: 1000 },
      'jajanan-1000': { kategori: 'jajanan', harga: 1000 },
      'jajanan-2000': { kategori: 'jajanan', harga: 2000 }
    }[item.idTombolCepat];
    if (idTombolLama) {
      return idTombolLama.kategori === tombol.kategori &&
        idTombolLama.harga === Number(tombol.harga);
    }
    return false;
  }
  const kategori = typeof tombol === 'string' ? tombol : tombol.kategori;
  const labelKategori = dapatkanKategoriUnpack(item, daftarProduk);
  const kategoriDicari = String(kategori).trim().toLocaleLowerCase('id-ID');
  if (item.kategoriTombolCepat) return labelKategori === kategoriDicari;
  if (labelKategori === kategoriDicari) return true;
  if (kategoriDicari === 'minuman') return labelKategori.includes('minuman');
  if (kategoriDicari === 'jajanan') {
    return ['jajanan', 'makanan', 'snack'].some((kata) => labelKategori.includes(kata));
  }
  return false;
}

export function dapatkanUnpackTersedia(items, tombol, daftarProduk) {
  return items.filter((item) =>
    Number(item.sisaQtyEceran) > 0 &&
    cocokkanKategoriUnpack(item, tombol, daftarProduk)
  );
}
