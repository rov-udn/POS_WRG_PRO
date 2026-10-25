# 01 — Struktur Data

Dokumen ini adalah acuan utama struktur data untuk aplikasi POS Warung.

## 1. Aturan Umum

- Struktur data di dokumen ini adalah struktur yang sudah disepakati.
- Jangan mengubah nama field, menghapus field, atau menambah field tanpa persetujuan.
- Gunakan nama field sesuai schema.
- `idProduk` digunakan untuk mengidentifikasi produk.
- `idSatuan` digunakan untuk mengidentifikasi satuan di dalam produk.
- `stokUtama` menggunakan **satuan terkecil** sebagai dasar stok.
- Perubahan stok tidak dilakukan langsung dari Master Produk.
- Perubahan stok harus melalui proses yang sesuai, seperti:
  - Penjualan
  - Restock
  - Penyesuaian stok
- Data transaksi menyimpan snapshot data produk pada saat transaksi terjadi.
- Jangan membuat schema baru jika kebutuhan masih bisa ditangani oleh schema yang sudah ada.
- Jika ada kebutuhan data baru yang belum tersedia, jangan langsung mengubah schema. Jelaskan kebutuhan tersebut terlebih dahulu.

---

# 2. Produk

Produk adalah data utama barang yang dijual di toko.

Collection:

```text
products/
```

Schema:

```js
export const SINGLE_PRODUCT_SCHEMA = {
  idProduk: "PRD-1728123456789",
  namaProduk: "Kopi Susu Pouch 1L",
  kategori: "Minuman",
  stokUtama: 120,
  satuanTerkecil: "Pcs",
  listSatuan: [
    {
      idSatuan: "SAT-001",
      namaSatuan: "Dus",
      barcode: "899123456001",
      hargaBeli: 240000,
      hargaJual: 280000,
      rasio: 24,
      isBase: false
    },
    {
      idSatuan: "SAT-002",
      namaSatuan: "Pack",
      barcode: "899123456002",
      hargaBeli: 61000,
      hargaJual: 72000,
      rasio: 6,
      isBase: false
    },
    {
      idSatuan: "SAT-003",
      namaSatuan: "Pcs",
      barcode: "899123456003",
      hargaBeli: 10000,
      hargaJual: 12500,
      rasio: 1,
      isBase: true
    }
  ]
};
```

## Penjelasan Field

### `idProduk`

ID unik produk.

Contoh:

```text
PRD-1728123456789
```

### `namaProduk`

Nama utama produk.

Contoh:

```text
Kopi Susu Pouch 1L
```

### `kategori`

Kategori produk.

Contoh:

```text
Minuman
Sembako
Rokok
Makanan
```

Untuk MVP, kategori masih berupa nilai sederhana.

### `stokUtama`

Jumlah stok produk dalam **satuan terkecil**.

Contoh:

```text
1 Dus = 24 Pcs
```

Jika toko mempunyai:

```text
5 Dus
```

maka:

```text
stokUtama = 120
```

Jadi stok utama:

```text
120 Pcs
```

bukan:

```text
5 Dus
```

### `satuanTerkecil`

Nama satuan dasar stok.

Contoh:

```text
Pcs
```

### `listSatuan`

Daftar satuan yang dapat digunakan untuk produk.

Setiap satuan dapat mempunyai:

- ID satuan
- nama satuan
- barcode
- harga beli
- harga jual
- rasio terhadap satuan terkecil
- penanda apakah satuan tersebut merupakan satuan dasar

### `idSatuan`

ID unik untuk satuan.

Contoh:

```text
SAT-001
```

### `namaSatuan`

Nama satuan.

Contoh:

```text
Dus
Pack
Pcs
```

### `barcode`

Barcode yang digunakan untuk satuan tersebut.

**Setiap satuan boleh mempunyai barcode sendiri.**

Contoh:

```text
Dus  → barcode A
Pack → barcode B
Pcs  → barcode C
```

Barcode tidak harus hanya dimiliki oleh satuan dasar.

### `hargaBeli`

Harga modal untuk satu satuan tersebut.

Contoh:

```text
Dus = Rp240.000
Pcs = Rp10.000
```

### `hargaJual`

Harga jual untuk satu satuan tersebut.

Contoh:

```text
Dus = Rp280.000
Pcs = Rp12.500
```

### `rasio`

Jumlah satuan terkecil yang terdapat dalam satu satuan tersebut.

Contoh:

```text
Dus  = 24 Pcs → rasio 24
Pack = 6 Pcs  → rasio 6
Pcs  = 1 Pcs  → rasio 1
```

### `isBase`

Menentukan apakah satuan tersebut adalah satuan terkecil/dasar.

```js
isBase: true
```

hanya untuk satuan dasar.

Contoh:

```text
Dus  → false
Pack → false
Pcs  → true
```

---

# 3. Restock / Perubahan Stok

Digunakan untuk mencatat perubahan stok.

Collection:

```text
restockLogs/
```

Schema:

```js
export const RESTOCK_LOG_SCHEMA = {
  idLog: "LOG-1728123456789",
  idProduk: "PRD-1728123456789",
  namaProduk: "Kopi Susu Pouch 1L",
  tanggal: "2026-10-05T15:00:00Z",
  tipeAksi: "PENAMBAHAN",
  alasan: "BARANG_MASUK",
  satuanDipilih: "Dus",
  jumlahInput: 2,
  rasioSaatItu: 24,
  totalPerubahanPcs: 48,
  stokSebelum: 72,
  stokSesudah: 120,
  catatan: "Kulakan dari Agen Sumber Makmur"
};
```

## Nilai `tipeAksi`

```text
PENAMBAHAN
PENGURANGAN
```

### `PENAMBAHAN`

Digunakan ketika stok bertambah.

Contoh:

```text
Restock 2 Dus
```

### `PENGURANGAN`

Digunakan ketika stok berkurang karena penyesuaian.

Contoh:

```text
Barang rusak
Barang expired
Barang hilang
```

## Nilai `alasan`

Untuk MVP:

```text
BARANG_MASUK
RUSAK
EXPIRED
HILANG
```

Schema ini juga dapat digunakan untuk mencatat penyesuaian stok sehingga MVP tidak membutuhkan schema `STOCK_MOVEMENT_SCHEMA` terpisah.

---

# 4. Cart Item

Cart adalah data sementara yang digunakan oleh halaman Kasir.

`CART_ITEM_SCHEMA` **bukan collection database untuk MVP**.

Schema:

```js
export const CART_ITEM_SCHEMA = {
  idProduk: "PRD-1728123456789",
  namaProduk: "Kopi Susu Pouch 1L",
  idSatuan: "SAT-001",
  namaSatuan: "Dus",
  barcode: "899123456001",
  hargaJualSatuan: 280000,
  hargaBeliSatuan: 240000,
  qty: 1,
  rasio: 24,
  subtotal: 280000
};
```

Cart digunakan untuk:

- menampung barang yang sedang dibeli
- mengubah jumlah barang
- menghitung subtotal
- menghitung total transaksi

Cart tidak bertanggung jawab terhadap:

- database
- pembayaran
- pencatatan transaksi
- perubahan stok

Proses tersebut dilakukan oleh bagian Kasir/Transaksi.

---

# 5. Transaksi

Digunakan untuk menyimpan transaksi penjualan yang sudah selesai.

Collection:

```text
transactions/
```

Schema:

```js
export const TRANSACTION_SCHEMA = {
  noStruk: "TRX-20261005-0001",
  tanggal: "2026-10-05T15:30:00Z",
  idKasir: "USR-001",
  namaKasir: "Rofi",
  items: [
    CART_ITEM_SCHEMA
  ],
  totalQtyItems: 1,
  totalBayar: 280000,
  metodePembayaran: "CASH",
  jumlahUangDiterima: 300000,
  kembalian: 20000
};
```

## Nilai `metodePembayaran`

Untuk MVP:

```text
CASH
QRIS
```

## Kenapa `items` menyimpan data produk?

Data item transaksi merupakan **snapshot pada saat transaksi**.

Contoh:

Saat transaksi:

```text
Kopi Susu
Harga jual = Rp12.500
```

Kemudian harga produk berubah menjadi:

```text
Rp13.000
```

Transaksi lama tetap:

```text
Rp12.500
```

Karena data transaksi tidak mengambil harga terbaru dari Master Produk.

---

# 6. Daftar Belanja

Digunakan untuk membuat rencana barang yang akan dibeli.

Collection:

```text
shoppingLists/
```

Schema:

```js
export const SHOPPING_LIST_SCHEMA = {
  idBelanja: "BLJ-001",
  tanggal: "2026-10-05",
  status: "RENCANA",
  items: [
    {
      idProduk: "PRD-001",
      namaProduk: "Kopi Susu",
      idSatuan: "SAT-001",
      namaSatuan: "Dus",
      qty: 2,
      hargaEstimasi: 240000,
      subtotalEstimasi: 480000
    }
  ],
  totalEstimasi: 480000,
  catatan: "Belanja agen"
};
```

## Nilai `status`

```text
RENCANA
DIBELI
BATAL
```

Daftar Belanja hanya merupakan **rencana pembelian**.

Alurnya:

```text
Daftar Belanja
      ↓
Barang benar-benar dibeli
      ↓
Restock
      ↓
Restock Log
      ↓
stokUtama bertambah
```

Daftar Belanja tidak langsung mengubah stok.

---

# 7. Hubungan Antar Data

```text
products
   │
   ├── digunakan oleh Kasir
   │        ↓
   │     CART_ITEM
   │        ↓
   │   TRANSACTION
   │
   ├── digunakan oleh Restock
   │        ↓
   │   RESTOCK_LOG
   │        ↓
   │   stokUtama berubah
   │
   └── digunakan oleh Belanja
            ↓
      SHOPPING_LIST
            ↓
         Restock
```

---

# 8. Database MVP

Struktur database MVP:

```text
database
│
├── products/
│
├── transactions/
│
├── restockLogs/
│
└── shoppingLists/
```

`CART_ITEM_SCHEMA` tidak menjadi collection database.

---

# 9. Aturan Perubahan Stok

`stokUtama` adalah stok dalam satuan terkecil.

Contoh:

```text
1 Dus = 24 Pcs

stokUtama = 72
```

Jika restock:

```text
2 Dus
```

maka:

```text
2 × 24 = 48 Pcs
```

sehingga:

```text
stokSebelum = 72
stokSesudah = 120
```

Jika penjualan:

```text
1 Dus
```

maka stok berkurang:

```text
1 × 24 = 24 Pcs
```

menjadi:

```text
120 - 24 = 96 Pcs
```

**Master Produk tidak boleh mengubah `stokUtama` secara langsung.**

---

# 10. Data yang Belum Masuk MVP

Data berikut sengaja belum dibuat sebagai schema terpisah:

```text
Price History
Supplier
User
Customer
Category
Stock Movement
Payment
Expense
```

Jangan membuat schema tersebut hanya karena membutuhkan tempat untuk menyimpan data.

Jika kebutuhan tersebut muncul saat pengembangan, buat proposal struktur terlebih dahulu sebelum mengubah `01-struktur-data.md`.

---

# 11. Prinsip Utama

Struktur data MVP harus:

1. Sederhana.
2. Mudah dipahami AI.
3. Mudah dikembangkan.
4. Tidak menduplikasi data tanpa alasan.
5. Tidak mencampurkan data saat ini dengan data histori.
6. Menggunakan satuan terkecil sebagai dasar stok.
7. Menyimpan snapshot pada transaksi.
8. Memisahkan rencana belanja dari barang yang benar-benar masuk stok.
9. Tidak membuat schema baru sebelum benar-benar diperlukan.
10. Tidak mengubah schema yang sudah disepakati tanpa persetujuan.