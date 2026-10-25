import { useState, useEffect } from 'react';

const KUNCI_STORAGE_PRODUK = 'pos_warung_daftar_produk';
const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';
const KUNCI_STORAGE_DRAF = 'pos_warung_draf_transactions';
const KUNCI_STORAGE_KERANJANG = 'pos_warung_keranjang_kasir';

export function useKasir() {
  const [daftarProduk, setDaftarProduk] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_PRODUK);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  // State Keranjang dengan dukungan localStorage (Persistence)
  const [keranjang, setKeranjang] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_KERANJANG);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  const [metodePembayaran, setMetodePembayaran] = useState('CASH');
  const [jumlahUangDiterima, setJumlahUangDiterima] = useState('');
  const [transaksiSelesai, setTransaksiSelesai] = useState(null);

  // State untuk Draf Transaksi (Tahan & Panggil Nota)
  const [daftarDraf, setDaftarDraf] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_DRAF);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  // Simpan keranjang ke localStorage setiap kali ada perubahan item
  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_KERANJANG, JSON.stringify(keranjang));
    } catch (e) {
      console.error("Gagal menyimpan keranjang ke storage:", e);
    }
  }, [keranjang]);

  const simpanDrafKeStorage = (drafBaru) => {
    setDaftarDraf(drafBaru);
    localStorage.setItem(KUNCI_STORAGE_DRAF, JSON.stringify(drafBaru));
  };

  const simpanProdukKeStorage = (produkBaru) => {
    setDaftarProduk(produkBaru);
    localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(produkBaru));
  };

  const tambahKeKeranjang = (produk, satuanPilihan) => {
    setKeranjang((prev) => {
      const indexEksis = prev.findIndex(
        (item) => item.idProduk === produk.idProduk && item.idSatuan === satuanPilihan.idSatuan
      );

      if (indexEksis > -1) {
        const keranjangBaru = [...prev];
        const itemLama = keranjangBaru[indexEksis];
        const qtyBaru = itemLama.qty + 1;
        
        keranjangBaru[indexEksis] = {
          ...itemLama,
          qty: qtyBaru,
          subtotal: qtyBaru * itemLama.hargaJualSatuan
        };
        return keranjangBaru;
      } else {
        const itemBaru = {
          idProduk: produk.idProduk,
          namaProduk: produk.namaProduk,
          idSatuan: satuanPilihan.idSatuan,
          namaSatuan: satuanPilihan.namaSatuan,
          barcode: satuanPilihan.barcode || '',
          hargaJualSatuan: Number(satuanPilihan.hargaJual) || 0,
          hargaBeliSatuan: Number(satuanPilihan.hargaBeli) || 0,
          qty: 1,
          rasio: Number(satuanPilihan.rasio) || 1,
          subtotal: Number(satuanPilihan.hargaJual) || 0
        };
        return [...prev, itemBaru];
      }
    });
  };

  const ubahQtyItem = (idProduk, idSatuan, qtyBaru) => {
    const q = Number(qtyBaru);
    if (q <= 0) {
      hapusItemKeranjang(idProduk, idSatuan);
      return;
    }

    setKeranjang((prev) =>
      prev.map((item) => {
        if (item.idProduk === idProduk && item.idSatuan === idSatuan) {
          return {
            ...item,
            qty: q,
            subtotal: q * item.hargaJualSatuan
          };
        }
        return item;
      })
    );
  };

  const hapusItemKeranjang = (idProduk, idSatuan) => {
    setKeranjang((prev) => prev.filter((item) => !(item.idProduk === idProduk && item.idSatuan === idSatuan)));
  };

  const resetKeranjang = () => {
    setKeranjang([]);
    setJumlahUangDiterima('');
    localStorage.removeItem(KUNCI_STORAGE_KERANJANG);
  };

  // FUNGSI TAHAN TRANSAKSI (HOLD)
  const tahanTransaksi = (catatan = '') => {
    if (keranjang.length === 0) return false;

    const drafBaruItem = {
      idDraf: `DRAF-${Date.now()}`,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      catatan: catatan || `Draf ${daftarDraf.length + 1}`,
      items: [...keranjang]
    };

    const drafBaruList = [drafBaruItem, ...daftarDraf];
    simpanDrafKeStorage(drafBaruList);
    resetKeranjang();
    return true;
  };

  // FUNGSI PANGGIL TRANSAKSI (RESUME)
  const panggilDraf = (idDraf) => {
    const drafTarget = daftarDraf.find((d) => d.idDraf === idDraf);
    if (!drafTarget) return;

    if (keranjang.length > 0) {
      if (!window.confirm('Keranjang saat ini terisi. Tumpuk/ganti dengan draf yang dipanggil?')) {
        return;
      }
    }

    setKeranjang(drafTarget.items);
    hapusDraf(idDraf);
  };

  const hapusDraf = (idDraf) => {
    const sisaDraf = daftarDraf.filter((d) => d.idDraf !== idDraf);
    simpanDrafKeStorage(sisaDraf);
  };

  const totalBayar = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQtyItems = keranjang.reduce((sum, item) => sum + item.qty, 0);
  const kembalian = Math.max(0, Number(jumlahUangDiterima) - totalBayar);

  const dapatkanNominalCepat = () => {
    if (totalBayar <= 0) return [];
    const pecahanRupiah = [2000, 5000, 10000, 20000, 50000, 100000];
    const daftarNominal = new Set();
    daftarNominal.add(totalBayar);
    pecahanRupiah.forEach((pecahan) => {
      if (pecahan >= totalBayar) daftarNominal.add(pecahan);
    });
    const pembulatanAtas = Math.ceil(totalBayar / 10000) * 10000;
    if (pembulatanAtas > totalBayar) daftarNominal.add(pembulatanAtas);
    return Array.from(daftarNominal).sort((a, b) => a - b);
  };

  const pilihNominalCepat = (nominal) => {
    setJumlahUangDiterima(nominal.toString());
  };

  const prosesBayar = () => {
    if (keranjang.length === 0) {
      alert('Keranjang masih kosong!');
      return false;
    }

    if (metodePembayaran === 'CASH' && Number(jumlahUangDiterima) < totalBayar) {
      alert('Jumlah uang yang diterima kurang dari total belanja!');
      return false;
    }

    // Validasi ketersediaan stok sebelum transaksi diproses
    for (const item of keranjang) {
      const produkTarget = daftarProduk.find((p) => p.idProduk === item.idProduk);
      const stokTersedia = Number(produkTarget?.stokUtama) || 0;
      const totalKebutuhanPcs = item.qty * (Number(item.rasio) || 1);

      if (stokTersedia < totalKebutuhanPcs) {
        alert(`❌ Stok tidak cukup untuk produk "${item.namaProduk}" (${item.namaSatuan}). Stok tersedia: ${stokTersedia}, dibutuhkan: ${totalKebutuhanPcs}.`);
        return false;
      }
    }

    const tglSekarang = new Date();
    const formatTanggal = tglSekarang.toISOString().slice(0, 10).replace(/-/g, '');
    const noStruk = `TRX-${formatTanggal}-${Math.floor(1000 + Math.random() * 9000)}`;

    let daftarProdukBaru = [...daftarProduk];

    keranjang.forEach((item) => {
      const produkTarget = daftarProdukBaru.find((p) => p.idProduk === item.idProduk);
      if (produkTarget) {
        const totalPenguranganPcs = item.qty * item.rasio;
        const stokBaru = Math.max(0, (Number(produkTarget.stokUtama) || 0) - totalPenguranganPcs);

        daftarProdukBaru = daftarProdukBaru.map((p) =>
          p.idProduk === item.idProduk ? { ...p, stokUtama: stokBaru } : p
        );
      }
    });

    const dataTransaksiBaru = {
      noStruk,
      tanggal: tglSekarang.toISOString(),
      idKasir: "USR-001",
      namaKasir: "Rofi",
      items: [...keranjang],
      totalQtyItems,
      totalBayar,
      metodePembayaran,
      jumlahUangDiterima: metodePembayaran === 'CASH' ? Number(jumlahUangDiterima) : totalBayar,
      kembalian: metodePembayaran === 'CASH' ? kembalian : 0
    };

    try {
      const riwayatLama = JSON.parse(localStorage.getItem(KUNCI_STORAGE_TRANSAKSI) || '[]');
      const riwayatBaru = [dataTransaksiBaru, ...riwayatLama];
      localStorage.setItem(KUNCI_STORAGE_TRANSAKSI, JSON.stringify(riwayatBaru));
      simpanProdukKeStorage(daftarProdukBaru);
      localStorage.removeItem(KUNCI_STORAGE_KERANJANG);
    } catch (e) {
      console.error("Gagal menyimpan riwayat transaksi atau stok ke storage:", e);
      alert('❌ Gagal menyimpan data transaksi ke penyimpanan lokal. Transaksi dibatalkan untuk menjaga konsistensi data.');
      return false;
    }

    setTransaksiSelesai(dataTransaksiBaru);
    setKeranjang([]);
    setJumlahUangDiterima('');
    return true;
  };

  const resetTransaksiSelesai = () => {
    setTransaksiSelesai(null);
  };

  return {
    daftarProduk,
    keranjang,
    metodePembayaran,
    setMetodePembayaran,
    jumlahUangDiterima,
    setJumlahUangDiterima,
    totalBayar,
    totalQtyItems,
    kembalian,
    transaksiSelesai,
    daftarDraf,
    tahanTransaksi,
    panggilDraf,
    hapusDraf,
    dapatkanNominalCepat,
    pilihNominalCepat,
    tambahKeKeranjang,
    ubahQtyItem,
    hapusItemKeranjang,
    resetKeranjang,
    prosesBayar,
    resetTransaksiSelesai
  };
}