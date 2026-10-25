import { useState, useMemo, useEffect } from 'react';
import { buatIdProduk } from '../utils/produkUtils';

const KUNCI_STORAGE_PRODUK = 'pos_warung_daftar_produk';

const DATA_AWAL_PRODUK = [
  {
    "idProduk": "PRD-1728123456789",
    "namaProduk": "Kopi Susu Pouch 1L",
    "kategori": "Minuman",
    "stokUtama": 120,
    "satuanTerkecil": "Pcs",
    "listSatuan": [
      {
        "idSatuan": "SAT-001",
        "namaSatuan": "Dus",
        "barcode": "899123456001",
        "hargaBeli": 240000,
        "hargaJual": 280000,
        "rasio": 24,
        "isBase": false
      },
      {
        "idSatuan": "SAT-002",
        "namaSatuan": "Pack",
        "barcode": "899123456002",
        "hargaBeli": 61000,
        "hargaJual": 72000,
        "rasio": 6,
        "isBase": false
      },
      {
        "idSatuan": "SAT-003",
        "namaSatuan": "Pcs",
        "barcode": "899123456003",
        "hargaBeli": 10000,
        "hargaJual": 12500,
        "rasio": 1,
        "isBase": true
      }
    ]
  },
  {
    "idProduk": "PRD-1728123456790",
    "namaProduk": "Minyak Goreng 2L",
    "kategori": "Sembako",
    "stokUtama": 48,
    "satuanTerkecil": "Pcs",
    "listSatuan": [
      {
        "idSatuan": "SAT-101",
        "namaSatuan": "Karton",
        "barcode": "899123456101",
        "hargaBeli": 180000,
        "hargaJual": 200000,
        "rasio": 12,
        "isBase": false
      },
      {
        "idSatuan": "SAT-102",
        "namaSatuan": "Pcs",
        "barcode": "899123456102",
        "hargaBeli": 15000,
        "hargaJual": 17500,
        "rasio": 1,
        "isBase": true
      }
    ]
  },
  {
    "idProduk": "PRD-1728123456791",
    "namaProduk": "Rokok Filter 16",
    "kategori": "Rokok",
    "stokUtama": 200,
    "satuanTerkecil": "Bungkus",
    "listSatuan": [
      {
        "idSatuan": "SAT-201",
        "namaSatuan": "Bal",
        "barcode": "899123456201",
        "hargaBeli": 230000,
        "hargaJual": 250000,
        "rasio": 10,
        "isBase": false
      },
      {
        "idSatuan": "SAT-202",
        "namaSatuan": "Bungkus",
        "barcode": "899123456202",
        "hargaBeli": 23000,
        "hargaJual": 26000,
        "rasio": 1,
        "isBase": true
      }
    ]
  },
  {
    "idProduk": "PRD-1728123456792",
    "namaProduk": "Mie Instan Goreng",
    "kategori": "Makanan",
    "stokUtama": 160,
    "satuanTerkecil": "Pcs",
    "listSatuan": [
      {
        "idSatuan": "SAT-301",
        "namaSatuan": "Dus",
        "barcode": "899123456301",
        "hargaBeli": 105000,
        "hargaJual": 120000,
        "rasio": 40,
        "isBase": false
      },
      {
        "idSatuan": "SAT-302",
        "namaSatuan": "Pcs",
        "barcode": "899123456302",
        "hargaBeli": 2800,
        "hargaJual": 3500,
        "rasio": 1,
        "isBase": true
      }
    ]
  }
];

export function useProduk() {
  // State data utama dengan dukungan localStorage (Offline-first)
  const [daftarProdukAsli, setDaftarProdukAsli] = useState(() => {
    try {
      const dataSimpanan = localStorage.getItem(KUNCI_STORAGE_PRODUK);
      return dataSimpanan ? JSON.parse(dataSimpanan) : DATA_AWAL_PRODUK;
    } catch (error) {
      console.error("Gagal memuat data dari localStorage:", error);
      return DATA_AWAL_PRODUK;
    }
  });

  // State untuk pencarian dipindahkan ke sini
  const [kataKunci, setKataKunci] = useState('');
  const [produkDipilih, setProdukDipilih] = useState(null);
  const [produkEdit, setProdukEdit] = useState(null);
  const [tampilkanForm, setTampilkanForm] = useState(false);

  // Simpan otomatis ke localStorage setiap kali data berubah
  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(daftarProdukAsli));
    } catch (error) {
      console.error("Gagal menyimpan data ke localStorage:", error);
    }
  }, [daftarProdukAsli]);

  // Logika penyaringan (produk tersaring) dipindah ke dalam hook
  const produkTersaring = useMemo(() => {
    if (!kataKunci.trim()) return daftarProdukAsli;
    return daftarProdukAsli.filter((item) =>
      item.namaProduk.toLowerCase().includes(kataKunci.toLowerCase())
    );
  }, [daftarProdukAsli, kataKunci]);

  const bukaFormTambah = () => {
    setProdukEdit(null);
    setTampilkanForm(true);
  };

  const bukaFormEdit = (produk) => {
    setProdukEdit(produk);
    setTampilkanForm(true);
  };

  const tutupForm = () => {
    setProdukEdit(null);
    setTampilkanForm(false);
  };

  const simpanProduk = (dataForm) => {
    if (dataForm.idProduk) {
      setDaftarProdukAsli((prev) =>
        prev.map((item) => (item.idProduk === dataForm.idProduk ? dataForm : item))
      );
      if (produkDipilih?.idProduk === dataForm.idProduk) {
        setProdukDipilih(dataForm);
      }
    } else {
      const produkBaru = {
        ...dataForm,
        idProduk: buatIdProduk()
      };
      setDaftarProdukAsli((prev) => [produkBaru, ...prev]);
    }
    tutupForm();
  };

  const hapusProduk = (idProduk) => {
    setDaftarProdukAsli((prev) => prev.filter((item) => item.idProduk !== idProduk));
    if (produkDipilih?.idProduk === idProduk) {
      setProdukDipilih(null);
    }
  };

  const pilihProduk = (produk) => {
    const produkClone = {
      ...produk,
      listSatuan: produk.listSatuan.map((s) => ({ ...s }))
    };
    setProdukDipilih(produkClone);
  };

  const tutupDetail = () => {
    setProdukDipilih(null);
  };

  return {
    daftarProduk: produkTersaring, // Mengembalikan data yang sudah difilter
    daftarProdukAsli,
    kataKunci,
    setKataKunci,
    produkDipilih,
    produkEdit,
    tampilkanForm,
    bukaFormTambah,
    bukaFormEdit,
    tutupForm,
    simpanProduk,
    hapusProduk,
    pilihProduk,
    tutupDetail
  };
}