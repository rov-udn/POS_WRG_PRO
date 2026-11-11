import {
  formatQuantity,
  roundPreciseQuantity
} from '../../../utils/formatQuantity';

export const EVENT_PRODUK_DIPERBARUI = 'pos-warung-produk-diperbarui';

export const beriTahuProdukDiperbarui = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_PRODUK_DIPERBARUI));
  }
};

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

export const normalisasiVarianProduk = (varian) => {
  const daftarVarian = Array.isArray(varian)
    ? varian
    : typeof varian === 'string'
      ? varian.split(',')
      : [];

  return daftarVarian
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Mengambil objek satuan dasar (isBase: true) dari listSatuan.
 */
export const dapatkanSatuanDasar = (listSatuan = []) => {
  return listSatuan.find((satuan) => satuan.isBase) || null;
};

export const normalisasiRasioSatuan = (listSatuan = [], idSatuanDasar) => {
  const satuanDasar =
    listSatuan.find((satuan) => satuan.idSatuan === idSatuanDasar) ||
    dapatkanSatuanDasar(listSatuan) ||
    listSatuan[listSatuan.length - 1];

  if (!satuanDasar) return [];

  const rasioDasar = Number(satuanDasar.rasio);
  const rasioAcuan = Number.isFinite(rasioDasar) && rasioDasar > 0 ? rasioDasar : 1;

  return listSatuan.map((satuan) => {
    const rasio = Number(satuan.rasio);
    const rasioValid = Number.isFinite(rasio) && rasio > 0 ? rasio : 1;
    const isBase = satuan.idSatuan === satuanDasar.idSatuan;

    return {
      ...satuan,
      isBase,
      rasio: isBase ? 1 : Number((rasioValid / rasioAcuan).toPrecision(12))
    };
  });
};

export const buatSnapshotProdukTransaksi = (produk) => {
  if (!produk || !Array.isArray(produk.listSatuan)) return null;

  const listSatuan = normalisasiRasioSatuan(produk.listSatuan)
    .map((satuan) => ({
      idSatuan: satuan.idSatuan,
      namaSatuan: satuan.namaSatuan,
      rasio: satuan.rasio,
      isBase: satuan.isBase,
      hargaBeli: Number(satuan.hargaBeli) || 0,
      hargaJual: Number(satuan.hargaJual) || 0,
      barcode: satuan.barcode || ''
    }))
    .sort((a, b) => String(a.idSatuan).localeCompare(String(b.idSatuan)));
  const satuanDasar = listSatuan.find((satuan) => satuan.isBase);

  return {
    namaProduk: produk.namaProduk,
    satuanDasarId: satuanDasar?.idSatuan || null,
    listSatuan
  };
};

export const apakahProdukBerubahDariSnapshot = (snapshot, produk) => {
  if (!snapshot || !produk) return true;
  return JSON.stringify(snapshot) !== JSON.stringify(buatSnapshotProdukTransaksi(produk));
};

export const hitungRasioSatuanKeBasisSaatIni = (item, produk) => {
  const snapshot = item?.snapshotProduk;
  if (!snapshot || !produk) return null;

  const idSatuan = item?.idSatuan ?? item?.idSatuanDipilih;
  const satuanTransaksi = snapshot.listSatuan?.find(
    (satuan) => satuan.idSatuan === idSatuan
  );
  const listSatuanSaatIni = normalisasiRasioSatuan(produk.listSatuan || []);
  const satuanDasarSaatIni = listSatuanSaatIni.find((satuan) => satuan.isBase);
  const rasioDasarSaatIniDalamSnapshot = snapshot.listSatuan?.find(
    (satuan) => satuan.idSatuan === satuanDasarSaatIni?.idSatuan
  )?.rasio;

  if (
    !satuanTransaksi ||
    !Number.isFinite(Number(satuanTransaksi.rasio)) ||
    !Number.isFinite(Number(rasioDasarSaatIniDalamSnapshot)) ||
    Number(rasioDasarSaatIniDalamSnapshot) <= 0
  ) {
    return null;
  }

  return roundPreciseQuantity(
    Number(satuanTransaksi.rasio) / Number(rasioDasarSaatIniDalamSnapshot)
  );
};

/**
 * Memformat tampilan stok utama beserta satuan terkecilnya.
 * Contoh: 120, "Pcs" -> "120 Pcs"
 */
export const formatStokUtama = (stokUtama = 0, satuanTerkecil = '') => {
  return `${formatQuantity(stokUtama)} ${satuanTerkecil}`.trim();
};

/**
 * Menghitung harga beli otomatis untuk satuan tertentu
 * berdasarkan harga dan rasio dari satuan acuan,
 * lalu dibulatkan selalu ke atas ke kelipatan 100 terdekat agar tidak rugi.
 */
export const hitungHargaBeliSatuan = (hargaBeliAcuan, rasioAcuan, rasioSatuanIni) => {
  const hargaAcuan = Number(hargaBeliAcuan) || 0;
  const rAcuan = Number(rasioAcuan) || 1;
  const rIni = Number(rasioSatuanIni) || 1;

  if (hargaAcuan <= 0 || rAcuan <= 0) return 0;

  const modalPerRasio = hargaAcuan / rAcuan;

  const hasilHitung = modalPerRasio * rIni;
  const kelipatanRatusan = hasilHitung / 100;
  const toleransiPembulatan = Number.EPSILON * Math.abs(kelipatanRatusan) * 4;
  return Math.ceil(kelipatanRatusan - toleransiPembulatan) * 100;
};

// Daftar master referensi satuan yang dikelompokkan ke dalam 3 bagian
export const REFERENSI_SATUAN_AWAL = {
  besar: ['Dus', 'Karton', 'Ball', 'Karung', 'Peti', 'Gross'],
  menengah: ['Pack', 'Renceng', 'Box', 'Rim', 'Slop', 'Toples'],
  kecil: ['Pcs', 'Biji', 'Sachet', 'Botol', 'Bungkus', 'Cup', 'Lusin']
};

/**
 * Menghitung stok dalam satuan dasar aktif dari kuantitas dan rasio satuan pilihan.
 * @param {number|string} jumlahInput - Jumlah fisik yang diinput (misal: 10)
 * @param {number|string} rasioSatuan - Rasio dari satuan yang dipilih terhadap satuan dasar (misal: 120)
 * @returns {number} Total stok dalam satuan dasar aktif
 */
export const hitungStokUtama = (jumlahInput, rasioSatuan) => {
  const qty = Number(jumlahInput) || 0;
  const rasio = Number(rasioSatuan) || 1;
  return Math.max(0, roundPreciseQuantity(qty * rasio));
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