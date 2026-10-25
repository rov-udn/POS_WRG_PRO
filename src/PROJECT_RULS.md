# PROJECT RULES — POS WARUNG

## 1. Prinsip Utama

AI WAJIB mengikuti struktur dan fungsi yang sudah ditentukan.

AI DILARANG menambahkan fitur yang tidak diminta.

Jika menemukan kemungkinan fitur tambahan:
- jangan implementasikan
- cukup sebutkan sebagai catatan opsional
- tunggu instruksi berikutnya

---

## 2. Arsitektur

Project menggunakan:

- React
- Vite
- Tailwind CSS
- CVA
- PWA

Struktur menggunakan feature-based architecture.

---

## 3. Tanggung Jawab File

### Page
Page hanya bertanggung jawab:
- menyusun layout
- menghubungkan component
- menerima/meneruskan state jika diperlukan

Page tidak boleh:
- berisi UI yang terlalu kompleks
- menangani database secara langsung
- menambahkan fitur di luar konteks halaman

### Component
Component hanya bertanggung jawab terhadap fungsi UI yang disebutkan.

Component tidak boleh:
- melakukan fitur bisnis lain
- mengubah data yang bukan tanggung jawabnya
- membuat fitur tambahan secara otomatis

### Hook
Hook bertanggung jawab terhadap:
- state
- logic
- interaksi data yang berkaitan dengan feature

### Service
Service bertanggung jawab terhadap:
- akses data
- operasi database
- penyimpanan/pengambilan data

---

## 4. Aturan Scope

Jika diminta:

"buat DaftarProduk"

maka fungsi DaftarProduk HANYA:

- menerima daftar produk
- menampilkan daftar produk
- menampilkan informasi yang ditentukan

DILARANG:
- keranjang
- transaksi
- pembayaran
- restock
- perubahan stok
- edit produk
- hapus produk
- database
- barcode scanner

kecuali secara eksplisit diminta.

---

## 5. Aturan CVA

Jangan membuat CVA secara otomatis.

Gunakan CVA hanya jika sebuah component memiliki
beberapa variant/style yang memang perlu dikelola.

Contoh:
- Button: primary / secondary / danger
- Badge: success / warning / danger
- Input: error / normal

Jika component hanya memiliki satu tampilan:
JANGAN menggunakan CVA.

---

## 6. Aturan Data

Gunakan schema yang sudah ditentukan.

Jangan:
- mengubah nama field
- membuat field baru
- menghapus field
- membuat schema baru

tanpa persetujuan.

---

## 7. Aturan Bahasa

Gunakan nama:
- variable bahasa Indonesia
- function bahasa Indonesia jika memungkinkan
- komentar bahasa Indonesia

Contoh:

produk
daftarProduk
produkDipilih
tambahProduk()
ubahProduk()

---

## 8. Aturan Perubahan Code

Sebelum mengubah file:

1. Jelaskan file yang akan diubah.
2. Jelaskan fungsi/state/function yang akan digunakan.
3. Jangan mengubah file lain tanpa alasan.
4. Jika file lain diperlukan, minta persetujuan terlebih dahulu.

---

## 9. Aturan Anti Scope Creep

Jangan mengimplementasikan:
- fitur tambahan
- optimasi tambahan
- refactor tambahan
- UI tambahan
- validasi tambahan

jika tidak diminta.

Prioritas:
1. kebutuhan user
2. schema
3. arsitektur project
4. kesederhanaan