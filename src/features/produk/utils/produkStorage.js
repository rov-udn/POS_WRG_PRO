export const awalanKunciStorageProduk = 'pos_warung_daftar_produk';

export function buatKunciStorageProduk(storeId) {
  const idStore = String(storeId ?? '').trim();
  return idStore
    ? `${awalanKunciStorageProduk}:${encodeURIComponent(idStore)}`
    : null;
}
