export const MASTER_KATEGORI_AWAL = [
  { id: 'groceries', label: 'Groceries & Staples (Sembako)' },
  { id: 'snacks', label: 'Snacks & Confectionery (Snack & Jajanan)' },
  { id: 'beverages', label: 'Beverages (Minuman)' },
  { id: 'cooking', label: 'Cooking Essentials (Bumbu Dapur)' },
  { id: 'household', label: 'Household Supplies (Kebersihan Rumah)' },
  { id: 'personal', label: 'Personal Care (Perawatan Diri)' },
  { id: 'medical', label: 'Medical & Healthcare (Obat & Kesehatan)' },
  { id: 'tobacco', label: 'Tobacco & Cigarettes (Rokok)' },
  { id: 'packaging', label: 'Packaging & Plastics (Plastik & Kemasan)' },
  { id: 'miscellaneous', label: 'Utilities & Miscellaneous (Lain-lain)' }
];

const PETA_KATEGORI_PRODUK = {
  'smebako/dapur': 'Sembako',
  'sembako/dapur': 'Sembako',
  groceries: 'Sembako',
  sembako: 'Sembako',
  'groceries & staples (sembako)': 'Sembako',
  'snack/biskuit/roti': 'Makanan',
  snacks: 'Makanan',
  snack: 'Makanan',
  makanan: 'Makanan',
  'snacks & confectionery (snack & jajanan)': 'Makanan',
  'minuman/kopi/susu': 'Minuman',
  beverages: 'Minuman',
  minuman: 'Minuman',
  cooking: 'Bumbu Dapur',
  'cooking essentials (bumbu dapur)': 'Bumbu Dapur',
  'sabun/pembersih': 'Kebersihan Rumah',
  household: 'Kebersihan Rumah',
  'household supplies (kebersihan rumah)': 'Kebersihan Rumah',
  'personal care': 'Perawatan Diri',
  personal: 'Perawatan Diri',
  'personal care (perawatan diri)': 'Perawatan Diri',
  'obat-obatan/medical item': 'Obat-obatan',
  medical: 'Obat-obatan',
  'medical & healthcare (obat & kesehatan)': 'Obat-obatan',
  'rokok/korek': 'Rokok',
  tobacco: 'Rokok',
  'tobacco & cigarettes (rokok)': 'Rokok',
  'plastik/cup': 'Plastik/Cup',
  packaging: 'Plastik/Cup',
  'packaging & plastics (plastik & kemasan)': 'Plastik/Cup',
  'lain-lain': 'Lain-lain',
  miscellaneous: 'Lain-lain',
  'utilities & miscellaneous (lain-lain)': 'Lain-lain'
};

export function normalisasiKategoriProduk(kategori) {
  if (typeof kategori !== 'string' || !kategori.trim()) return 'Lain-lain';
  const kategoriBersih = kategori.trim();
  return PETA_KATEGORI_PRODUK[kategoriBersih.toLowerCase()] || kategoriBersih;
}