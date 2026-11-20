const AWALAN_KUNCI_STORAGE_KASIR = 'pos_warung_kasir';
export const EVENT_TRANSAKSI_KASIR_DIPERBARUI = 'pos-wrg-sales-transactions-updated';

export function buatKunciStorageKasir(jenis, { storeId, idKasir } = {}) {
  const idToko = typeof storeId === 'string' ? storeId.trim() : '';
  const idPengguna = typeof idKasir === 'string' ? idKasir.trim() : '';
  const ruangLingkup = idToko
    ? `store:${encodeURIComponent(idToko)}`
    : idPengguna
      ? `user:${encodeURIComponent(idPengguna)}`
      : null;

  return ruangLingkup
    ? `${AWALAN_KUNCI_STORAGE_KASIR}:${ruangLingkup}:${jenis}`
    : null;
}

export function bacaArrayStorageKasir(kunci, label) {
  if (!kunci) return [];

  let nilaiTersimpan;
  try {
    nilaiTersimpan = localStorage.getItem(kunci);
  } catch (error) {
    throw new Error(`${label} tidak dapat dibaca dari penyimpanan lokal.`, { cause: error });
  }
  if (nilaiTersimpan === null) return [];

  let data;
  try {
    data = JSON.parse(nilaiTersimpan);
  } catch (error) {
    throw new Error(`${label} berisi JSON yang rusak.`, { cause: error });
  }
  if (!Array.isArray(data)) {
    throw new TypeError(`${label} tersimpan dalam format yang tidak valid.`);
  }
  return data;
}

export function simpanArrayStorageKasir(kunci, data, label) {
  if (!kunci) throw new Error(`Identitas toko/kasir belum tersedia; ${label} tidak disimpan.`);
  if (!Array.isArray(data)) throw new TypeError(`${label} harus berupa daftar.`);

  try {
    localStorage.setItem(kunci, JSON.stringify(data));
  } catch (error) {
    throw new Error(`${label} tidak dapat disimpan ke penyimpanan lokal.`, { cause: error });
  }
  if (kunci.endsWith(':transactions') && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_TRANSAKSI_KASIR_DIPERBARUI));
  }
}

export function hapusStorageKasir(kunci, label) {
  if (!kunci) throw new Error(`Identitas toko/kasir belum tersedia; ${label} tidak dapat dihapus.`);

  try {
    localStorage.removeItem(kunci);
  } catch (error) {
    throw new Error(`${label} tidak dapat dihapus dari penyimpanan lokal.`, { cause: error });
  }
}
