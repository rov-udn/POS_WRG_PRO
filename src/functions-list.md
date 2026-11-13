# Daftar Fungsi & Custom Hooks - POS Warung Pro

Daftar modul fungsi dan *custom hooks* utama beserta lokasi filenya dalam struktur direktori proyek.

## 1. Manajemen Pengguna & Karyawan
- **`ApprovalPage.jsx`** (`src/features/setting/`): Menampilkan menu persetujuan pendaftaran yang hanya tersedia bagi `super_admin`.
- **`useManajemenKaryawan.js`** (`src/features/setting/hooks/`): Mengelola daftar karyawan, memproses *approval* akun baru, dan pembaruan role.
- **`useTambahKaryawan.js`** (`src/features/setting/hooks/`): Menangani logika pembuatan akun dan pendaftaran karyawan baru.
- **`useUserProfile.js`** (`src/features/setting/hooks/`): Menarik dan mengelola informasi profil pengguna aktif yang sedang login.

## 2. Pengelolaan Operasional & Stok
- **`useKasir.js`** (`src/features/kasir/hooks/`): Mengatur keranjang belanja, perhitungan total, draf transaksi, pembayaran, dan retur/tukar barang.
- **`useGudang.js`** (`src/features/gudang/hooks/`): Mengelola alur barang masuk, antrean distribusi, dan pencatatan stok gudang.
- **`useBelanjaAgen.js`** (`src/features/belanja/hooks/`): Mengatur pembuatan draf kulakan, pencatatan item agen, hingga pengarsipan belanja.
- **`useSettings.js`** (`src/features/setting/hooks/`): Mengatur penyimpanan dan pembaruan preferensi sistem/toko.

## 3. Utilitas & Pemrosesan Data
- **`importProdukJson.js` / `importProdukExcel.js`** (`src/features/produk/utils/`): Menangani impor data produk massal dari file eksternal beserta pemetaan varian.
- **`unpackItems.js`** (`src/features/kasir/utils/` / `src/features/gudang/components/`): Mengelola logika konversi barang grosir menjadi eceran serta pencatatan log kerugian (*shrinkage*).
- **`shiftStorage.js`** (`src/features/laporan/utils/`): Memproses penyimpanan data rekapitulasi shift kasir.