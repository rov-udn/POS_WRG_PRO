/**
 * SCHEMA DATA MASTER PRODUK & TRANSAKSI (POS SYSTEM)
 * File acuan struktur data untuk Frontend, State, dan Firestore/Database.
 */

// 1. STRUKTUR MASTER DATA PRODUK (Multi-Satuan & Flexible Ratio)
export const SINGLE_PRODUCT_SCHEMA = {
  idProduk: "PRD-1728123456789", // Unique Identifier (bisa generate via Date.now() atau UUID)
  namaProduk: "Kopi Susu Pouch 1L",
  kategori: "Minuman",
  stokUtama: 120, // TOTAL STOK FISIK (Selalu disimpan dalam unit Satuan Terkecil / Base Unit)
  satuanTerkecil: "Pcs", // Nama string dari satuan yang bernilai isBase: true
  
  // Array dari semua tingkatan satuan yang dimiliki oleh barang ini (1, 2, atau 3 satuan)
  listSatuan: [
    {
      idSatuan: "SAT-001",
      namaSatuan: "Dus",
      barcode: "899123456001",
      hargaBeli: 240000, // Harga modal per Dus
      hargaJual: 280000, // Harga jual per Dus
      rasio: 24,          // 1 Dus = 24 Pcs (Satuan Terkecil)
      isBase: false      // Bukan satuan terkecil
    },
    {
      idSatuan: "SAT-002",
      namaSatuan: "Pack",
      barcode: "899123456002",
      hargaBeli: 61000,  // Harga modal per Pack
      hargaJual: 72000,  // Harga jual per Pack
      rasio: 6,          // 1 Pack = 6 Pcs
      isBase: false      // Bukan satuan terkecil
    },
    {
      idSatuan: "SAT-003",
      namaSatuan: "Pcs",
      barcode: "899123456003",
      hargaBeli: 10000,  // Harga modal per Pcs (Hasil dari: Harga Dus / Rasio Dus)
      hargaJual: 12500,  // Harga jual eceran
      rasio: 1,          // Satuan terkecil SELALU ber-rasio 1
      isBase: true       // PENANDA SATUAN TERKECIL (Base Unit)
    }
  ]
};

// 2. STRUKTUR RECORD PENYESUAIAN STOK (Gudang / Restock / Stock Opname)
export const RESTOCK_LOG_SCHEMA = {
  idLog: "LOG-1728123456789",
  idProduk: "PRD-1728123456789",
  namaProduk: "Kopi Susu Pouch 1L",
  tanggal: "2026-10-05T15:00:00Z",
  
  // Tipe Perubahan
  tipeAksi: "PENAMBAHAN", // "PENAMBAHAN" (Restock) | "PENGURANGAN" (Penyesuaian)
  alasan: "BARANG_MASUK",  // "BARANG_MASUK" | "RUSAK" | "EXPIRED" | "HILANG"
  
  // Data Inputan User
  satuanDipilih: "Dus",
  jumlahInput: 2,         // Jumlah yang diinput di form (misal: 2 Dus)
  rasioSaatItu: 24,       // Rasio satuan Dus ke Pcs
  
  // Output Perubahan
  totalPerubahanPcs: 48,  // (jumlahInput * rasioSaatItu) -> +48 atau -48 Pcs
  stokSebelum: 72,        // Stok dalam Pcs sebelum penyesuaian
  stokSesudah: 120,       // Stok dalam Pcs setelah penyesuaian
  catatan: "Kulakan dari Agen Sumber Makmur"
};

// 3. STRUKTUR ITEM KERANJANG / TRANSAKSI KASIR
export const CART_ITEM_SCHEMA = {
  idProduk: "PRD-1728123456789",
  namaProduk: "Kopi Susu Pouch 1L",
  
  // Satuan yang dipilih saat beli di Kasir
  idSatuan: "SAT-001",
  namaSatuan: "Dus",
  barcode: "899123456001",
  
  hargaJualSatuan: 280000, // Harga jual per Dus
  hargaBeliSatuan: 240000, // Untuk keperluan menghitung laba kotor
  qty: 1,                   // Beli 1 Dus
  rasio: 24,               // Rasio Dus ke Pcs (untuk motong stokUtama sejumlah 24 Pcs)
  subtotal: 280000          // qty * hargaJualSatuan
};

// 4. STRUKTUR TRANSAKSI / PENJUALAN HEADER
export const TRANSACTION_SCHEMA = {
  noStruk: "TRX-20261005-0001",
  tanggal: "2026-10-05T15:30:00Z",
  idKasir: "USR-001",
  namaKasir: "Rofi",
  
  items: [
    CART_ITEM_SCHEMA // Array of CART_ITEM_SCHEMA
  ],
  
  totalQtyItems: 1,
  totalBayar: 280000,
  metodePembayaran: "CASH", // "CASH" | "QRIS"
  jumlahUangDiterima: 300000,
  kembalian: 20000
};

// 5. DUMMY DATA UNTUK DUMMY STATE FRONTEND
export const INITIAL_PRODUCTS_DUMMY = [
  SINGLE_PRODUCT_SCHEMA,
  {
    idProduk: "PRD-1728999999999",
    namaProduk: "Minyak Goreng 1L",
    kategori: "Sembako",
    stokUtama: 30,
    satuanTerkecil: "Pcs",
    listSatuan: [
      {
        idSatuan: "SAT-101",
        namaSatuan: "Pcs",
        barcode: "890000000001",
        hargaBeli: 14000,
        hargaJual: 16000,
        rasio: 1,
        isBase: true
      }
    ]
  }
];