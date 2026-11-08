import { useState, useEffect } from 'react';
import { useAppMode } from '../../../hooks/useAppMode';
import { calculateSubtotal, roundPreciseQuantity, roundQuantity } from '../../../utils/formatQuantity';
import {
  apakahProdukBerubahDariSnapshot,
  beriTahuProdukDiperbarui,
  buatSnapshotProdukTransaksi,
  EVENT_PRODUK_DIPERBARUI,
  hitungRasioSatuanKeBasisSaatIni
} from '../../produk/utils/produkUtils';

const KUNCI_STORAGE_PRODUK = 'pos_warung_daftar_produk';
const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';
const KUNCI_STORAGE_DRAF = 'pos_warung_draf_transactions';
const KUNCI_STORAGE_KERANJANG = 'pos_warung_keranjang_kasir';

export function useKasir() {
  const { fitur } = useAppMode();
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
      return data
        ? JSON.parse(data).map((item) => ({
            ...item,
            qty: roundQuantity(item.qty),
            subtotal: calculateSubtotal(item.hargaJualSatuan, item.qty)
          }))
        : [];
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

  useEffect(() => {
    const muatProdukTerbaru = () => {
      try {
        const data = localStorage.getItem(KUNCI_STORAGE_PRODUK);
        setDaftarProduk(data ? JSON.parse(data) : []);
      } catch (error) {
        console.error('Gagal memuat produk yang diperbarui:', error);
      }
    };
    const tanganiStorage = (event) => {
      if (event.key === KUNCI_STORAGE_PRODUK) muatProdukTerbaru();
    };

    window.addEventListener('storage', tanganiStorage);
    window.addEventListener(EVENT_PRODUK_DIPERBARUI, muatProdukTerbaru);
    return () => {
      window.removeEventListener('storage', tanganiStorage);
      window.removeEventListener(EVENT_PRODUK_DIPERBARUI, muatProdukTerbaru);
    };
  }, []);

  const simpanDrafKeStorage = (drafBaru) => {
    setDaftarDraf(drafBaru);
    localStorage.setItem(KUNCI_STORAGE_DRAF, JSON.stringify(drafBaru));
  };

  const simpanProdukKeStorage = (produkBaru) => {
    setDaftarProduk(produkBaru);
    localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(produkBaru));
    beriTahuProdukDiperbarui();
  };

  const tambahKeKeranjang = (produk, satuanPilihan) => {
    const itemAda = keranjang.find(
      (item) => item.idProduk === produk.idProduk && item.idSatuan === satuanPilihan.idSatuan
    );
    if (
      itemAda &&
      apakahProdukBerubahDariSnapshot(itemAda.snapshotProduk, produk)
    ) {
      alert(
        `Produk "${produk.namaProduk}" sudah ada dengan data lama di keranjang. Hapus item lama sebelum menambahkan versi terbaru.`
      );
      return;
    }

    setKeranjang((prev) => {
      const indexEksis = prev.findIndex(
        (item) => item.idProduk === produk.idProduk && item.idSatuan === satuanPilihan.idSatuan
      );

      if (indexEksis > -1) {
        const keranjangBaru = [...prev];
        const itemLama = keranjangBaru[indexEksis];
        const qtyBaru = roundQuantity(itemLama.qty + 1);
        
        keranjangBaru[indexEksis] = {
          ...itemLama,
          qty: qtyBaru,
          subtotal: calculateSubtotal(itemLama.hargaJualSatuan, qtyBaru)
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
          snapshotProduk: buatSnapshotProdukTransaksi(produk),
          subtotal: calculateSubtotal(satuanPilihan.hargaJual, 1)
        };
        return [...prev, itemBaru];
      }
    });
  };

  const ubahQtyItem = (idProduk, idSatuan, qtyBaru) => {
    const q = roundQuantity(qtyBaru);
    if (!Number.isFinite(Number(qtyBaru))) return;
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
            subtotal: calculateSubtotal(item.hargaJualSatuan, q)
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

    setKeranjang(
      drafTarget.items.map((item) => ({
        ...item,
        qty: roundQuantity(item.qty),
        subtotal: calculateSubtotal(item.hargaJualSatuan, item.qty)
      }))
    );
    hapusDraf(idDraf);
  };

  const hapusDraf = (idDraf) => {
    const sisaDraf = daftarDraf.filter((d) => d.idDraf !== idDraf);
    simpanDrafKeStorage(sisaDraf);
  };

  const produkKeranjangBerubah = keranjang
    .filter((item) => {
      const produkTerkini = daftarProduk.find((produk) => produk.idProduk === item.idProduk);
      return apakahProdukBerubahDariSnapshot(item.snapshotProduk, produkTerkini);
    })
    .map((item) => item.namaProduk);

  const totalBayar = keranjang.reduce(
    (sum, item) => sum + calculateSubtotal(item.hargaJualSatuan, item.qty),
    0
  );
  const totalQtyItems = roundQuantity(keranjang.reduce((sum, item) => sum + item.qty, 0));
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

    let produkOperasional;
    try {
      produkOperasional = JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]');
      setDaftarProduk(produkOperasional);
    } catch (error) {
      console.error('Gagal memuat data produk terbaru sebelum pembayaran:', error);
      alert('❌ Data produk terbaru tidak dapat dibaca. Transaksi belum diproses.');
      return false;
    }

    const itemDenganProdukTerkini = keranjang.map((item) => ({
      item,
      produk: produkOperasional.find((produk) => produk.idProduk === item.idProduk)
    }));
    const itemTanpaSnapshot = itemDenganProdukTerkini.filter(
      ({ item, produk }) =>
        !item.snapshotProduk &&
        produk &&
        (fitur.validasiStok || fitur.ubahStok)
    );
    if (itemTanpaSnapshot.length > 0) {
      alert(
        `❌ Data satuan pada keranjang ${itemTanpaSnapshot.map(({ item }) => item.namaProduk).join(', ')} berasal dari versi lama dan belum memiliki snapshot rasio. Hapus item tersebut lalu tambahkan kembali sebelum mengubah stok.`
      );
      return false;
    }

    const itemUsang = itemDenganProdukTerkini.filter(
      ({ item, produk }) => apakahProdukBerubahDariSnapshot(item.snapshotProduk, produk)
    );
    if (
      itemUsang.length > 0 &&
      !window.confirm(
        `Data master produk berikut berubah setelah masuk keranjang: ${itemUsang.map(({ item }) => item.namaProduk).join(', ')}. Harga dan satuan transaksi tetap memakai snapshot keranjang; stok akan dikonversi ke basis terbaru. Lanjutkan pembayaran?`
      )
    ) {
      return false;
    }

    const itemDenganRasioSaatIni = itemDenganProdukTerkini.map(({ item, produk }) => ({
      item,
      produk,
      rasioSaatIni: produk ? hitungRasioSatuanKeBasisSaatIni(item, produk) : null
    }));
    if (fitur.validasiStok || fitur.ubahStok) {
      const itemTidakDapatDikonversi = itemDenganRasioSaatIni.find(
        ({ produk, rasioSaatIni }) =>
          !produk || rasioSaatIni === null
      );
      if (itemTidakDapatDikonversi) {
        alert(
          `❌ Data satuan "${itemTidakDapatDikonversi.item.namaSatuan}" untuk produk "${itemTidakDapatDikonversi.item.namaProduk}" tidak dapat dikonversi ke master terbaru. Perbarui keranjang sebelum melanjutkan.`
        );
        return false;
      }
    }

    if (metodePembayaran === 'CASH' && Number(jumlahUangDiterima) < totalBayar) {
      alert('Jumlah uang yang diterima kurang dari total belanja!');
      return false;
    }

    if (fitur.validasiStok) {
      for (const { item, produk: produkTarget, rasioSaatIni } of itemDenganRasioSaatIni) {
        const stokTersedia = Number(produkTarget?.stokUtama) || 0;
        const totalKebutuhanPcs = roundPreciseQuantity(item.qty * rasioSaatIni);

        if (stokTersedia < totalKebutuhanPcs) {
          alert(`❌ Stok tidak cukup untuk produk "${item.namaProduk}" (${item.namaSatuan}). Stok tersedia: ${stokTersedia}, dibutuhkan: ${totalKebutuhanPcs}.`);
          return false;
        }
      }
    }

    const tglSekarang = new Date();
    const formatTanggal = tglSekarang.toISOString().slice(0, 10).replace(/-/g, '');
    const noStruk = `TRX-${formatTanggal}-${Math.floor(1000 + Math.random() * 9000)}`;

    let daftarProdukBaru = [...produkOperasional];

    if (fitur.ubahStok) {
      itemDenganRasioSaatIni.forEach(({ item, rasioSaatIni }) => {
        const produkTarget = daftarProdukBaru.find((p) => p.idProduk === item.idProduk);
        if (produkTarget) {
          const totalPenguranganPcs = roundPreciseQuantity(item.qty * rasioSaatIni);
          const stokBaru = Math.max(
            0,
            roundPreciseQuantity((Number(produkTarget.stokUtama) || 0) - totalPenguranganPcs)
          );

          daftarProdukBaru = daftarProdukBaru.map((p) =>
            p.idProduk === item.idProduk ? { ...p, stokUtama: stokBaru } : p
          );
        }
      });
    }

    const dataTransaksiBaru = {
      noStruk,
      tanggal: tglSekarang.toISOString(),
      idKasir: "USR-001",
      namaKasir: "Rofi",
      items: keranjang.map((item) => ({
        ...item,
        qty: roundQuantity(item.qty),
        subtotal: calculateSubtotal(item.hargaJualSatuan, item.qty)
      })),
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
      if (fitur.ubahStok) {
        simpanProdukKeStorage(daftarProdukBaru);
      }
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
    produkKeranjangBerubah,
    resetKeranjang,
    prosesBayar,
    resetTransaksiSelesai
  };
}