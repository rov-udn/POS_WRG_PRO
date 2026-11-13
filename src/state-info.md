# Informasi State & Pengaturan Sistem - POS Warung Pro

Dokumentasi ini mencatat pengelolaan state global, lokal, serta persistensi aplikasi.

## 1. Persistensi Sesi Login (`browserLocalPersistence`)
- Menggunakan konfigurasi Firebase Auth dengan `browserLocalPersistence`.
- Memastikan sesi login pengguna tetap tersimpan meskipun tab atau browser ditutup, dan hanya akan terhapus jika pengguna menekan tombol "Keluar" secara eksplisit.

## 2. Konfigurasi Toko & Perangkat (`pos_wrg_settings` - LocalStorage)
Menyimpan konfigurasi operasional toko lokal:
- **`profil`**: Nama toko, alamat, dan nomor telepon.
- **`nota`**: Pengaturan cetak struk.
- **`pajakLayanan`**: Pengaturan persentase pajak atau biaya layanan.
- **`perangkat`**: Identifikasi terminal/perangkat kasir.
- **`sistem`**: Konfigurasi fitur aktif pada sistem.

## 3. Manajemen Shift Kasir (`shiftStorage.js`)
- **`shiftAktif`**: Menyimpan status shift yang sedang berjalan (`mulai`, `cashStart`).
- **`shiftTertutup`**: Rekapitulasi penutupan shift (`waktuMulai`, `waktuTutup`, `totalTunaiMasuk`, `kasKeluar`, `cashExpected`, `cashActual`, `selisih`).

## 4. Data Referensi Pendukung (LocalStorage)
- **Master Kategori**: Kumpulan kategori produk (`id`, `label`).
- **Master Satuan**: Pengelompokan satuan berdasarkan hierarki (`besar`, `menengah`, `kecil`).
- **Tombol Cepat (Quick Buttons)**: Pengaturan tombol akses cepat produk di kasir (`id`, `label`, `harga`, `kategori`).