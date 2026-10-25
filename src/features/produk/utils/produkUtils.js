/**
 * Memformat nominal angka menjadi format Rupiah (IDR).
 * Contoh: 280000 -> "Rp 280.000"
 */
export const formatRupiah = (nominal) => {
  if (nominal === undefined || nominal === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(nominal);
};

/**
 * Membuat ID Produk unik dengan timestamp + random string.
 */
export const buatIdProduk = () => {
  return `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Membuat ID Satuan unik dengan timestamp + random string agar tidak bentrok.
 */
export const buatIdSatuan = () => {
  return `SAT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Mengambil objek satuan dasar (isBase: true) dari listSatuan.
 */
export const dapatkanSatuanDasar = (listSatuan = []) => {
  return listSatuan.find((satuan) => satuan.isBase) || null;
};

/**
 * Memformat tampilan stok utama beserta satuan terkecilnya.
 * Contoh: 120, "Pcs" -> "120 Pcs"
 */
export const formatStokUtama = (stokUtama = 0, satuanTerkecil = '') => {
  return `${stokUtama} ${satuanTerkecil}`.trim();
};

/**
 * Menghitung harga beli otomatis untuk satuan tertentu
 * berdasarkan Harga Beli & Rasio dari Satuan Terbesar,
 * lalu dibulatkan selalu ke atas ke kelipatan 100 terdekat agar tidak rugi.
 */
export const hitungHargaBeliSatuan = (hargaBeliTerbesar, rasioTerbesar, rasioSatuanIni) => {
  const hargaBesar = Number(hargaBeliTerbesar) || 0;
  const rBesar = Number(rasioTerbesar) || 1;
  const rIni = Number(rasioSatuanIni) || 1;

  if (hargaBesar <= 0 || rBesar <= 0) return 0;

  // 1. Cari modal per satuan terkecil (Pcs) dulu
  const modalPcs = hargaBesar / rBesar;

  // 2. Kalikan dengan rasio satuan ini, lalu bulatkan KE ATAS (Math.ceil) ke kelipatan 100
  const hasilHitung = modalPcs * rIni;
  return Math.ceil(hasilHitung / 100) * 100;
};

// Daftar master referensi satuan yang dikelompokkan ke dalam 3 bagian
export const REFERENSI_SATUAN_AWAL = {
  besar: ['Dus', 'Karton', 'Ball', 'Karung', 'Peti', 'Gross'],
  menengah: ['Pack', 'Renceng', 'Box', 'Rim', 'Slop', 'Toples'],
  kecil: ['Pcs', 'Biji', 'Sachet', 'Botol', 'Bungkus', 'Cup', 'Lusin']
};

/**
 * Menghitung total stok utama (satuan terkecil) berdasarkan jumlah kuantitas dan rasio satuan yang dipilih.
 * @param {number|string} jumlahInput - Jumlah fisik yang diinput (misal: 10)
 * @param {number|string} rasioSatuan - Rasio dari satuan yang dipilih terhadap satuan dasar (misal: 120)
 * @returns {number} Total stok dalam satuan terkecil (misal: 1200)
 */
export const hitungStokUtama = (jumlahInput, rasioSatuan) => {
  const qty = Number(jumlahInput) || 0;
  const rasio = Number(rasioSatuan) || 1;
  return Math.max(0, Math.round(qty * rasio));
};

/**
 * Menghitung persentase margin keuntungan dari harga beli dan harga jual.
 * Rumus: ((Harga Jual - Harga Beli) / Harga Jual) * 100
 * @param {number} hargaBeli 
 * @param {number} hargaJual 
 * @returns {number} Persentase margin (dibulatkan 1 desimal)
 */
export const hitungMarginPersen = (hargaBeli, hargaJual) => {
  const beli = Number(hargaBeli) || 0;
  const jual = Number(hargaJual) || 0;
  if (jual <= 0 || jual <= beli) return 0;
  
  const margin = ((jual - beli) / jual) * 100;
  return Math.round(margin * 10) / 10;
};