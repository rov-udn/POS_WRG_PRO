import { useState, useMemo, useEffect } from 'react';
import { beriTahuProdukDiperbarui, buatIdProduk } from '../utils/produkUtils';
import { buatKunciStorageProduk } from '../utils/produkStorage';

export function useProduk(storeId) {
  const kunciStorageProduk = buatKunciStorageProduk(storeId);
  const [daftarProdukAsli, setDaftarProdukAsli] = useState(() => {
    if (!kunciStorageProduk) return [];
    try {
      const dataSimpanan = localStorage.getItem(kunciStorageProduk);
      const produkTersimpan = dataSimpanan ? JSON.parse(dataSimpanan) : [];
      return Array.isArray(produkTersimpan) ? produkTersimpan : [];
    } catch (error) {
      console.error("Gagal memuat data dari localStorage:", error);
      return [];
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
      if (!kunciStorageProduk) return;
      localStorage.setItem(kunciStorageProduk, JSON.stringify(daftarProdukAsli));
      beriTahuProdukDiperbarui();
    } catch (error) {
      console.error("Gagal menyimpan data ke localStorage:", error);
    }
  }, [daftarProdukAsli, kunciStorageProduk]);

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
    setDaftarProdukAsli,
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