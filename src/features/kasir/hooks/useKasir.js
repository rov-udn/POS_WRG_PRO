import { useState, useEffect, useRef } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ATURAN_MODE, KUNCI_STORAGE_MODE } from '../../../constants/configMode';
import { db } from '../../../constants/firebaseConfig';
import { calculateSubtotal, roundPreciseQuantity, roundQuantity } from '../../../utils/formatQuantity';
import {
  bacaArrayStorageKasir,
  buatKunciStorageKasir,
  hapusStorageKasir,
  simpanArrayStorageKasir
} from '../utils/kasirStorage';
import { sinkronkanPenjualanPending } from '../../../lib/services/transaksiSyncService';
import {
  apakahProdukBerubahDariSnapshot,
  beriTahuProdukDiperbarui,
  buatSnapshotProdukTransaksi,
  EVENT_PRODUK_DIPERBARUI,
  hitungRasioSatuanKeBasisSaatIni
} from '../../produk/utils/produkUtils';
import { buatKunciStorageProduk } from '../../produk/utils/produkStorage';
import { antrikanPerubahanProdukDanSinkronkan } from '../../../lib/services/produkSyncService';
import {
  dapatkanUnpackTersedia,
  EVENT_UNPACK_DIPERBARUI,
  KUNCI_STORAGE_UNPACK,
  bacaTombolCepat
} from '../utils/unpackItems';

const bacaAturanModeAktif = () => {
  const modeAktif = localStorage.getItem(KUNCI_STORAGE_MODE) || 'simple';
  const aturanMode = ATURAN_MODE[modeAktif];
  if (!aturanMode) {
    throw new Error(`Mode aplikasi "${modeAktif}" tidak dikenali.`);
  }
  return aturanMode;
};

const buatIdTransaksi = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Generator ID transaksi aman tidak tersedia di perangkat ini.');
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export function useKasir({ storeId, idKasir, namaKasir } = {}) {
  const storeIdAktif = typeof storeId === 'string' ? storeId.trim() : '';
  const idKasirAktif = typeof idKasir === 'string' ? idKasir.trim() : '';
  const namaKasirAktif = typeof namaKasir === 'string' && namaKasir.trim()
    ? namaKasir.trim()
    : 'Kasir';
  const KUNCI_STORAGE_PRODUK = buatKunciStorageProduk(storeIdAktif);
  const KUNCI_STORAGE_TRANSAKSI = buatKunciStorageKasir('transactions', {
    storeId: storeIdAktif,
    idKasir
  });
  const KUNCI_STORAGE_DRAF = buatKunciStorageKasir('drafts', {
    storeId: storeIdAktif,
    idKasir
  });
  const KUNCI_STORAGE_KERANJANG = buatKunciStorageKasir('cart', {
    storeId: storeIdAktif,
    idKasir
  });
  const [keranjangAwal] = useState(() => {
    try {
      return {
        items: bacaArrayStorageKasir(KUNCI_STORAGE_KERANJANG, 'Keranjang kasir')
          .map((item) => ({
            ...item,
            qty: roundQuantity(item.qty),
            subtotal: calculateSubtotal(item.hargaJualSatuan, item.qty)
          })),
        storageValid: true
      };
    } catch (error) {
      console.error('Gagal memuat keranjang kasir:', error);
      return { items: [], storageValid: false };
    }
  });
  const keranjangStorageValidRef = useRef(keranjangAwal.storageValid);
  const pesanKeranjangStorageDitampilkanRef = useRef(false);
  const [daftarProduk, setDaftarProduk] = useState(() => {
    try {
      if (!KUNCI_STORAGE_PRODUK) return [];
      const data = localStorage.getItem(KUNCI_STORAGE_PRODUK);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Gagal memuat produk kasir:', error);
      return [];
    }
  });

  // State Keranjang dengan dukungan localStorage (Persistence)
  const [keranjang, setKeranjang] = useState(keranjangAwal.items);

  const [metodePembayaran, setMetodePembayaran] = useState('CASH');
  const [jumlahUangDiterima, setJumlahUangDiterima] = useState('');
  const [transaksiSelesai, setTransaksiSelesai] = useState(null);

  // State untuk Draf Transaksi (Tahan & Panggil Nota)
  const [daftarDraf, setDaftarDraf] = useState(() => {
    try {
      return bacaArrayStorageKasir(KUNCI_STORAGE_DRAF, 'Draf transaksi');
    } catch (e) {
      console.error('Gagal memuat draf transaksi:', e);
      return [];
    }
  });

  // Simpan keranjang ke localStorage setiap kali ada perubahan item
  useEffect(() => {
    if (!KUNCI_STORAGE_KERANJANG) return;
    if (!keranjangStorageValidRef.current) {
      if (!pesanKeranjangStorageDitampilkanRef.current) {
        pesanKeranjangStorageDitampilkanRef.current = true;
        alert('Data keranjang lokal tidak dapat dibaca. Kosongkan keranjang dengan tombol hapus sebelum mulai transaksi baru.');
      }
      return;
    }
    try {
      simpanArrayStorageKasir(KUNCI_STORAGE_KERANJANG, keranjang, 'Keranjang kasir');
    } catch (e) {
      console.error('Gagal menyimpan keranjang ke storage:', e);
      alert('Keranjang hanya tersimpan sementara di perangkat ini. Periksa penyimpanan sebelum melanjutkan.');
    }
  }, [keranjang, KUNCI_STORAGE_KERANJANG]);

  useEffect(() => {
    const muatProdukTerbaru = () => {
      try {
        if (!KUNCI_STORAGE_PRODUK) return;
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
  }, [KUNCI_STORAGE_PRODUK]);

  const simpanDrafKeStorage = (drafBaru) => {
    bacaArrayStorageKasir(KUNCI_STORAGE_DRAF, 'Draf transaksi');
    simpanArrayStorageKasir(KUNCI_STORAGE_DRAF, drafBaru, 'Draf transaksi');
    setDaftarDraf(drafBaru);
  };

  const simpanProdukKeStorage = (produkBaru, produkSebelumnya) => {
    if (!KUNCI_STORAGE_PRODUK) {
      throw new Error('ID toko aktif tidak tersedia. Produk tidak dapat disimpan.');
    }
    try {
      localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(produkBaru));
    } catch (error) {
      throw new Error('Daftar produk tidak dapat disimpan ke penyimpanan lokal.', { cause: error });
    }
    setDaftarProduk(produkBaru);
    beriTahuProdukDiperbarui();
    void antrikanPerubahanProdukDanSinkronkan(
      storeIdAktif,
      produkSebelumnya,
      produkBaru
    );
  };

  const tambahKeKeranjang = (produk, satuanPilihan) => {
    const itemAda = keranjang.find(
      (item) =>
        !item.isUnpackItem &&
        item.idProduk === produk.idProduk &&
        item.idSatuan === satuanPilihan.idSatuan
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
        (item) =>
          !item.isUnpackItem &&
          item.idProduk === produk.idProduk &&
          item.idSatuan === satuanPilihan.idSatuan
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

  const tambahEceranCepat = (kategori, harga) => {
    let activeSebelumnya;
    let cartSebelumnya;

    try {
      const activeData = localStorage.getItem(KUNCI_STORAGE_UNPACK);
      const daftarUnpack = activeData ? JSON.parse(activeData) : [];
      const productData = KUNCI_STORAGE_PRODUK
        ? localStorage.getItem(KUNCI_STORAGE_PRODUK)
        : null;
      const produkDataAktif = productData;
      const produkTerbaru = produkDataAktif ? JSON.parse(produkDataAktif) : [];

      if (!Array.isArray(daftarUnpack) || !Array.isArray(produkTerbaru)) {
        throw new Error('Format data produk atau kuota eceran tidak valid.');
      }

      const tombolCepat = bacaTombolCepat().find((item) => item.id === kategori);
      if (!tombolCepat) {
        throw new Error(`Tombol cepat eceran tidak terdaftar: ${kategori}`);
      }
      const unpack = dapatkanUnpackTersedia(daftarUnpack, tombolCepat, produkTerbaru)[0];
      if (!unpack) {
        alert('Stok eceran kategori ini habis. Buka dus atau pack baru terlebih dahulu.');
        return false;
      }
      const produk = produkTerbaru.find((item) =>
        (unpack.idProduk && item.idProduk === unpack.idProduk) ||
        (unpack.namaProdukGrosir && unpack.namaProdukGrosir.startsWith(item.namaProduk))
      );
      const satuanDasar = produk?.listSatuan?.find((item) => item.isBase) ||
        produk?.listSatuan?.find((item) => Number(item.rasio) === 1);
      if (!produk || !satuanDasar || !unpack.id) {
        alert('Data produk eceran tidak lengkap. Buka ulang dus/pack dari widget gudang.');
        return false;
      }

      const sisa = Number(unpack.sisaQtyEceran);
      if (!Number.isFinite(sisa) || sisa < 1) {
        alert('Stok eceran sudah habis. Buka dus atau pack baru terlebih dahulu.');
        return false;
      }

      const daftarUnpackBaru = daftarUnpack.map((item) =>
        item.id === unpack.id
          ? { ...item, sisaQtyEceran: Math.max(0, sisa - 1) }
          : item
      );
      const idSatuanUnpack = satuanDasar.idSatuan;
      const idUnpackBaris = `${unpack.id}-${Number(harga)}`;
      const indeksItem = keranjang.findIndex((item) =>
        item.idUnpack === unpack.id &&
        Number(item.hargaJualSatuan) === Number(harga)
      );
      const keranjangBaru = [...keranjang];
      if (indeksItem >= 0) {
        const itemLama = keranjangBaru[indeksItem];
        const qtyBaru = roundQuantity(itemLama.qty + 1);
        keranjangBaru[indeksItem] = {
          ...itemLama,
          qty: qtyBaru,
          subtotal: calculateSubtotal(itemLama.hargaJualSatuan, qtyBaru)
        };
      } else {
        keranjangBaru.push({
          idProduk: produk.idProduk,
          namaProduk: unpack.namaProduk || produk.namaProduk,
          idSatuan: idSatuanUnpack,
          namaSatuan: unpack.namaSatuanEceran || produk.satuanTerkecil || satuanDasar.namaSatuan,
          barcode: '',
          hargaJualSatuan: Number(harga),
          hargaBeliSatuan: Number(satuanDasar.hargaBeli) || 0,
          qty: 1,
          rasio: 1,
          snapshotProduk: buatSnapshotProdukTransaksi(produk),
          subtotal: calculateSubtotal(Number(harga), 1),
          idUnpack: unpack.id,
          idUnpackBaris,
          isUnpackItem: true
        });
      }

      activeSebelumnya = activeData;
      cartSebelumnya = localStorage.getItem(KUNCI_STORAGE_KERANJANG);
      localStorage.setItem(KUNCI_STORAGE_UNPACK, JSON.stringify(daftarUnpackBaru));
      localStorage.setItem(KUNCI_STORAGE_KERANJANG, JSON.stringify(keranjangBaru));
      setKeranjang(keranjangBaru);
      setDaftarProduk(produkTerbaru);
      window.dispatchEvent(new Event(EVENT_UNPACK_DIPERBARUI));
      return true;
    } catch (error) {
      console.error('Gagal menambahkan barang eceran ke keranjang:', error);
      try {
        if (activeSebelumnya === null) localStorage.removeItem(KUNCI_STORAGE_UNPACK);
        else if (activeSebelumnya !== undefined) {
          localStorage.setItem(KUNCI_STORAGE_UNPACK, activeSebelumnya);
        }
        if (cartSebelumnya === null) localStorage.removeItem(KUNCI_STORAGE_KERANJANG);
        else if (cartSebelumnya !== undefined) {
          localStorage.setItem(KUNCI_STORAGE_KERANJANG, cartSebelumnya);
        }
      } catch (restoreError) {
        console.error('Gagal memulihkan keranjang atau kuota eceran:', restoreError);
      }
      alert('Gagal menyimpan item eceran ke keranjang. Kuota tidak dikurangi.');
      return false;
    }
  };

  const ubahQtyItem = (idProduk, idSatuan, qtyBaru, idUnpack = null) => {
    const q = roundQuantity(qtyBaru);
    if (!Number.isFinite(Number(qtyBaru))) return;
    if (q <= 0) {
      hapusItemKeranjang(idProduk, idSatuan);
      return;
    }

    setKeranjang((prev) =>
      prev.map((item) => {
        const itemCocok = item.idProduk === idProduk &&
          item.idSatuan === idSatuan &&
          (idUnpack ? item.idUnpack === idUnpack : !item.isUnpackItem);
        if (itemCocok) {
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

  const hapusItemKeranjang = (idProduk, idSatuan, idUnpack = null, idUnpackBaris = null) => {
    const itemDihapus = keranjang.filter((item) =>
      item.idProduk === idProduk &&
      item.idSatuan === idSatuan &&
      (idUnpackBaris
        ? item.idUnpackBaris === idUnpackBaris
        : idUnpack
          ? item.idUnpack === idUnpack
          : !item.isUnpackItem)
    );
    const itemUnpackDihapus = itemDihapus.filter((item) => item.isUnpackItem);
    if (itemUnpackDihapus.length > 0) {
      try {
        const daftarUnpack = JSON.parse(localStorage.getItem(KUNCI_STORAGE_UNPACK) || '[]');
        const daftarUnpackBaru = daftarUnpack.map((unpack) => {
          const itemKembali = itemUnpackDihapus.find((item) => item.idUnpack === unpack.id);
          if (!itemKembali) return unpack;
          const total = Number(unpack.totalSisaPcs) || 0;
          const sisa = Number(unpack.sisaQtyEceran) || 0;
          return {
            ...unpack,
            sisaQtyEceran: Math.min(total, sisa + Number(itemKembali.qty))
          };
        });
        localStorage.setItem(KUNCI_STORAGE_UNPACK, JSON.stringify(daftarUnpackBaru));
        window.dispatchEvent(new Event(EVENT_UNPACK_DIPERBARUI));
      } catch (error) {
        console.error('Gagal mengembalikan kuota eceran ke widget:', error);
        alert('Kuota eceran tidak dapat diperbarui. Item tetap berada di keranjang.');
        return;
      }
    }
    setKeranjang((prev) => prev.filter((item) =>
      !(
        item.idProduk === idProduk &&
        item.idSatuan === idSatuan &&
        (idUnpackBaris
          ? item.idUnpackBaris === idUnpackBaris
          : idUnpack
            ? item.idUnpack === idUnpack
            : !item.isUnpackItem)
      )
    ));
  };

  const resetKeranjang = ({ pertahankanKuotaEceran = false } = {}) => {
    if (!pertahankanKuotaEceran) {
      const itemUnpack = keranjang.filter((item) => item.isUnpackItem);
      if (itemUnpack.length > 0) {
        try {
          const daftarUnpack = JSON.parse(localStorage.getItem(KUNCI_STORAGE_UNPACK) || '[]');
          const daftarUnpackBaru = daftarUnpack.map((unpack) => {
            const qtyKembali = itemUnpack
              .filter((item) => item.idUnpack === unpack.id)
              .reduce((total, item) => total + Number(item.qty || 0), 0);
            return qtyKembali > 0
              ? {
                  ...unpack,
                  sisaQtyEceran: Math.min(
                    Number(unpack.totalSisaPcs) || 0,
                    (Number(unpack.sisaQtyEceran) || 0) + qtyKembali
                  )
                }
              : unpack;
          });
          localStorage.setItem(KUNCI_STORAGE_UNPACK, JSON.stringify(daftarUnpackBaru));
          window.dispatchEvent(new Event(EVENT_UNPACK_DIPERBARUI));
        } catch (error) {
          console.error('Gagal mengembalikan kuota eceran saat keranjang dikosongkan:', error);
          alert('Kuota eceran tidak dapat diperbarui. Keranjang tidak dikosongkan.');
          return;
        }
      }
    }
    try {
      if (KUNCI_STORAGE_KERANJANG) {
        hapusStorageKasir(KUNCI_STORAGE_KERANJANG, 'Keranjang kasir');
      }
    } catch (error) {
      console.error('Gagal menghapus keranjang dari penyimpanan lokal:', error);
      alert('Keranjang tidak dapat dikosongkan dengan aman. Periksa penyimpanan lalu coba kembali.');
      return false;
    }
    keranjangStorageValidRef.current = true;
    setKeranjang([]);
    setJumlahUangDiterima('');
    return true;
  };

  // FUNGSI TAHAN TRANSAKSI (HOLD)
  const tahanTransaksi = (catatan = '') => {
    if (keranjang.length === 0) return false;

    const drafBaruItem = {
      idDraf: `DRAF-${Date.now()}`,
      store_id: storeIdAktif || null,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      catatan: catatan || `Draf ${daftarDraf.length + 1}`,
      items: [...keranjang]
    };

    const drafBaruList = [drafBaruItem, ...daftarDraf];
    try {
      simpanDrafKeStorage(drafBaruList);
    } catch (error) {
      console.error('Gagal menyimpan draf transaksi:', error);
      alert('Draf tidak berhasil disimpan. Keranjang tetap tersedia.');
      return false;
    }
    if (!resetKeranjang({ pertahankanKuotaEceran: true })) {
      try {
        simpanDrafKeStorage(daftarDraf);
      } catch (error) {
        console.error('Gagal membatalkan draf setelah keranjang gagal dikosongkan:', error);
        alert('Draf mungkin sudah tersimpan, tetapi keranjang belum dikosongkan. Periksa draf sebelum mencoba lagi.');
      }
      return false;
    }
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

    const keranjangBaru = drafTarget.items.map((item) => ({
        ...item,
        qty: roundQuantity(item.qty),
        subtotal: calculateSubtotal(item.hargaJualSatuan, item.qty)
      }));
    try {
      if (KUNCI_STORAGE_KERANJANG) {
        simpanArrayStorageKasir(KUNCI_STORAGE_KERANJANG, keranjangBaru, 'Keranjang kasir');
      }
      simpanDrafKeStorage(daftarDraf.filter((d) => d.idDraf !== idDraf));
      setKeranjang(keranjangBaru);
    } catch (error) {
      console.error('Gagal memanggil draf transaksi:', error);
      alert('Draf tidak dapat dipanggil dengan aman. Data draf tetap tersedia.');
    }
  };

  const hapusDraf = (idDraf) => {
    const sisaDraf = daftarDraf.filter((d) => d.idDraf !== idDraf);
    try {
      simpanDrafKeStorage(sisaDraf);
      return true;
    } catch (error) {
      console.error('Gagal menghapus draf transaksi:', error);
      alert('Draf tidak dapat dihapus dari penyimpanan lokal.');
      return false;
    }
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
    if (!KUNCI_STORAGE_PRODUK) {
      alert('ID toko aktif tidak tersedia. Transaksi belum diproses.');
      return false;
    }
    if (!idKasirAktif) {
      alert('Sesi kasir tidak tersedia. Silakan masuk kembali sebelum memproses transaksi.');
      return false;
    }

    let produkOperasional;
    let fiturAktif;
    try {
      fiturAktif = bacaAturanModeAktif();
      produkOperasional = JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]');
      setDaftarProduk(produkOperasional);
    } catch (error) {
      console.error('Gagal memuat mode atau data produk sebelum pembayaran:', error);
      alert('❌ Mode aplikasi atau data produk tidak dapat dibaca. Transaksi belum diproses.');
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
        (fiturAktif.validasiStok || fiturAktif.ubahStok)
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
        `Data master produk berikut berubah setelah masuk keranjang: ${itemUsang.map(({ item }) => item.namaProduk).join(', ')}. Harga dan satuan transaksi tetap memakai snapshot keranjang.${fiturAktif.ubahStok ? ' Stok akan dikonversi ke basis terbaru.' : ''} Lanjutkan pembayaran?`
      )
    ) {
      return false;
    }

    const itemDenganRasioSaatIni = itemDenganProdukTerkini.map(({ item, produk }) => ({
      item,
      produk,
      rasioSaatIni: produk ? hitungRasioSatuanKeBasisSaatIni(item, produk) : null
    }));
    if (fiturAktif.validasiStok || fiturAktif.ubahStok) {
      const itemTidakDapatDikonversi = itemDenganRasioSaatIni.find(
        ({ item, produk, rasioSaatIni }) =>
          !item.isUnpackItem && (!produk || rasioSaatIni === null)
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

    if (fiturAktif.validasiStok) {
      for (const { item, produk: produkTarget, rasioSaatIni } of itemDenganRasioSaatIni) {
        if (item.isUnpackItem) continue;
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
    let idTransaksi;
    try {
      idTransaksi = buatIdTransaksi();
    } catch (error) {
      console.error('Gagal membuat ID transaksi unik:', error);
      alert('ID transaksi aman tidak dapat dibuat. Pembayaran belum diproses.');
      return false;
    }
    const noStruk = `TRX-${formatTanggal}-${Math.floor(1000 + Math.random() * 9000)}`;

    let daftarProdukBaru = [...produkOperasional];

    if (fiturAktif.ubahStok) {
      itemDenganRasioSaatIni.forEach(({ item, rasioSaatIni }) => {
        if (item.isUnpackItem) return;
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
      idTransaksi,
      noStruk,
      tanggal: tglSekarang.toISOString(),
      store_id: storeIdAktif,
      idKasir: idKasirAktif,
      namaKasir: namaKasirAktif,
      statusSync: 'pending',
      statusSyncDiperbaruiPada: tglSekarang.toISOString(),
      pesanErrorSync: '',
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

    let riwayatLama;
    try {
      riwayatLama = bacaArrayStorageKasir(KUNCI_STORAGE_TRANSAKSI, 'Riwayat transaksi');
      const produkTersimpanSebelumnya = fiturAktif.ubahStok
        ? JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]')
        : null;
      const riwayatBaru = [dataTransaksiBaru, ...riwayatLama];
      simpanArrayStorageKasir(KUNCI_STORAGE_TRANSAKSI, riwayatBaru, 'Riwayat transaksi');
      if (fiturAktif.ubahStok) {
        try {
          simpanProdukKeStorage(daftarProdukBaru, produkOperasional);
        } catch (error) {
          simpanArrayStorageKasir(KUNCI_STORAGE_TRANSAKSI, riwayatLama, 'Riwayat transaksi');
          if (produkTersimpanSebelumnya !== null) {
            localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(produkTersimpanSebelumnya));
            setDaftarProduk(produkOperasional);
          }
          throw error;
        }
      }
      if (KUNCI_STORAGE_KERANJANG) {
        try {
          hapusStorageKasir(KUNCI_STORAGE_KERANJANG, 'Keranjang kasir');
        } catch (error) {
          simpanArrayStorageKasir(KUNCI_STORAGE_TRANSAKSI, riwayatLama, 'Riwayat transaksi');
          if (fiturAktif.ubahStok && produkTersimpanSebelumnya !== null) {
            localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(produkTersimpanSebelumnya));
            setDaftarProduk(produkOperasional);
          }
          throw error;
        }
      }
    } catch (e) {
      console.error('Gagal menyimpan transaksi, stok, atau keranjang lokal:', e);
      alert('❌ Transaksi belum dapat disimpan dengan aman. Periksa penyimpanan lalu coba kembali.');
      return false;
    }

    setTransaksiSelesai(dataTransaksiBaru);
    setKeranjang([]);
    setJumlahUangDiterima('');
    void sinkronkanPenjualanPending(storeIdAktif).catch((error) => {
      console.error('Sinkronisasi transaksi penjualan tertunda:', error);
    });
    return true;
  };

  const prosesReturTukar = async ({ barangKembali, barangPengganti, metodePembayaran, jumlahDiterima }) => {
    if (!KUNCI_STORAGE_PRODUK) {
      alert('ID toko aktif tidak tersedia. Retur/tukar belum diproses.');
      return false;
    }
    if (!idKasirAktif) {
      alert('Sesi kasir tidak tersedia. Silakan masuk kembali sebelum memproses retur/tukar.');
      return false;
    }
    let produkOperasional;
    let riwayatLama;
    let fiturAktif;
    try {
      fiturAktif = bacaAturanModeAktif();
      produkOperasional = JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]');
      riwayatLama = bacaArrayStorageKasir(KUNCI_STORAGE_TRANSAKSI, 'Riwayat transaksi');
      if (!Array.isArray(produkOperasional) || !Array.isArray(riwayatLama)) {
        throw new Error('Format data produk atau transaksi tidak valid.');
      }
    } catch (error) {
      console.error('Gagal memuat data sebelum retur/tukar:', error);
      alert('❌ Data produk atau transaksi tidak dapat dibaca. Retur/tukar belum diproses.');
      return false;
    }

    const buatItemTransaksi = (baris, arah) => {
      const produk = produkOperasional.find((p) => p.idProduk === baris.idProduk);
      const satuan = produk?.listSatuan?.find((s) => s.idSatuan === baris.idSatuan);
      const qty = Number(baris.qty);
      if (!produk || !satuan || !Number.isFinite(qty) || qty <= 0 ||
        !Number.isFinite(Number(satuan.rasio)) || Number(satuan.rasio) <= 0) {
        return null;
      }
      return {
        idProduk: produk.idProduk,
        namaProduk: produk.namaProduk,
        idSatuan: satuan.idSatuan,
        namaSatuan: satuan.namaSatuan,
        qty: roundQuantity(qty),
        rasio: Number(satuan.rasio),
        hargaJualSatuan: Number(satuan.hargaJual) || 0,
        hargaBeliSatuan: Number(satuan.hargaBeli) || 0,
        subtotal: calculateSubtotal(satuan.hargaJual, qty),
        arah,
        snapshotProduk: buatSnapshotProdukTransaksi(produk)
      };
    };

    const itemsKembali = barangKembali.map((item) => buatItemTransaksi(item, 'MASUK'));
    const itemsPengganti = barangPengganti.map((item) => buatItemTransaksi(item, 'KELUAR'));
    if (itemsKembali.some((item) => !item) || itemsPengganti.some((item) => !item)) {
      alert('❌ Produk atau satuan berubah/tidak valid. Periksa kembali barang retur dan pengganti.');
      return false;
    }

    const totalKembali = itemsKembali.reduce((total, item) => total + item.subtotal, 0);
    const totalPengganti = itemsPengganti.reduce((total, item) => total + item.subtotal, 0);
    const selisih = totalPengganti - totalKembali;
    if (selisih > 0 && metodePembayaran === 'CASH' && Number(jumlahDiterima) < selisih) {
      alert('Jumlah uang yang diterima kurang dari kekurangan pembayaran.');
      return false;
    }

    let daftarProdukBaru = produkOperasional;
    if (fiturAktif.ubahStok) {
      const perubahanStok = new Map();
      [...itemsKembali, ...itemsPengganti].forEach((item) => {
        const totalPcs = roundPreciseQuantity(item.qty * item.rasio) * (item.arah === 'MASUK' ? 1 : -1);
        perubahanStok.set(item.idProduk, (perubahanStok.get(item.idProduk) || 0) + totalPcs);
      });
      daftarProdukBaru = produkOperasional.map((produk) => {
        if (!perubahanStok.has(produk.idProduk)) return produk;
        const stokTerkini = Number(produk.stokUtama);
        if (!Number.isFinite(stokTerkini)) return null;
        const stokBaru = roundPreciseQuantity(
          stokTerkini + perubahanStok.get(produk.idProduk)
        );
        if (stokBaru < 0) return null;
        return { ...produk, stokUtama: stokBaru };
      });
      if (daftarProdukBaru.some((producto) => producto === null)) {
        alert('❌ Stok tidak cukup untuk salah satu barang pengganti.');
        return false;
      }
    }

    const tglSekarang = new Date();
    const idRetur = `RT-${tglSekarang.toISOString().replace(/[-:.TZ]/g, '')}-${Math.floor(Math.random() * 1000)}`;
    const transaksiRetur = {
      noStruk: idRetur,
      tanggal: tglSekarang.toISOString(),
      store_id: storeIdAktif,
      idKasir: idKasirAktif,
      namaKasir: namaKasirAktif,
      tipeTransaksi: 'RETUR_TUKAR',
      items: [...itemsKembali, ...itemsPengganti],
      totalQtyItems: roundQuantity(
        [...itemsKembali, ...itemsPengganti].reduce((total, item) => total + item.qty, 0)
      ),
      totalBayar: selisih,
      arusKasMasuk: selisih > 0 && metodePembayaran === 'CASH' ? selisih : 0,
      arusKasMasukNonTunai: selisih > 0 && metodePembayaran !== 'CASH' ? selisih : 0,
      arusKasKeluar: Math.max(0, -selisih),
      metodePembayaran: selisih > 0 ? metodePembayaran : 'CASH',
      jumlahUangDiterima: selisih > 0 && metodePembayaran === 'CASH' ? Number(jumlahDiterima) : Math.max(0, selisih),
      kembalian: selisih > 0 && metodePembayaran === 'CASH'
        ? Math.max(0, Number(jumlahDiterima) - selisih)
        : 0
    };
    const dataReturFirestore = {
      store_id: storeIdAktif,
      timestamp: tglSekarang.toISOString(),
      createdAt: serverTimestamp(),
      kasir: namaKasirAktif,
      barangKembali: itemsKembali.map((item) => ({
        idProduk: item.idProduk,
        namaProduk: item.namaProduk,
        idSatuan: item.idSatuan,
        namaSatuan: item.namaSatuan,
        qty: item.qty,
        hargaSatuan: item.hargaJualSatuan,
        subtotal: item.subtotal
      })),
      barangPengganti: itemsPengganti.map((item) => ({
        idProduk: item.idProduk,
        namaProduk: item.namaProduk,
        idSatuan: item.idSatuan,
        namaSatuan: item.namaSatuan,
        qty: item.qty,
        hargaSatuan: item.hargaJualSatuan,
        subtotal: item.subtotal
      })),
      totalKembali,
      totalPengganti,
      selisih,
      statusKeuangan: selisih > 0
        ? 'BAYAR_TAMBAHAN'
        : selisih < 0
          ? 'REFUND_KAS'
          : 'IMPAS',
      metodePembayaran,
      jumlahDiterima: Number(jumlahDiterima) || 0
    };

    let produkTersimpanSebelumnya;
    let transaksiTersimpanSebelumnya;
    try {
      produkTersimpanSebelumnya = fiturAktif.ubahStok
        ? localStorage.getItem(KUNCI_STORAGE_PRODUK)
        : null;
      transaksiTersimpanSebelumnya = localStorage.getItem(KUNCI_STORAGE_TRANSAKSI);
    } catch (error) {
      console.error('Gagal membuat cadangan lokal sebelum retur/tukar:', error);
      alert('❌ Data lokal tidak dapat dibaca untuk mengamankan retur/tukar.');
      return false;
    }
    const batalkanPerubahanLokal = () => {
      if (fiturAktif.ubahStok) {
        if (produkTersimpanSebelumnya === null) localStorage.removeItem(KUNCI_STORAGE_PRODUK);
        else localStorage.setItem(KUNCI_STORAGE_PRODUK, produkTersimpanSebelumnya);
      }
      if (transaksiTersimpanSebelumnya === null) localStorage.removeItem(KUNCI_STORAGE_TRANSAKSI);
      else localStorage.setItem(KUNCI_STORAGE_TRANSAKSI, transaksiTersimpanSebelumnya);
    };

    try {
      if (fiturAktif.ubahStok) {
        localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(daftarProdukBaru));
      }
      simpanArrayStorageKasir(
        KUNCI_STORAGE_TRANSAKSI,
        [transaksiRetur, ...riwayatLama],
        'Riwayat transaksi'
      );
    } catch (error) {
      try {
        batalkanPerubahanLokal();
      } catch (rollbackError) {
        console.error('Gagal membatalkan perubahan data retur/tukar:', rollbackError);
      }
      console.error('Gagal menyimpan transaksi retur/tukar:', error);
      alert('❌ Retur/tukar gagal disimpan. Periksa ruang penyimpanan lalu coba kembali.');
      return false;
    }

    try {
      await setDoc(doc(db, 'retur_logs', idRetur), dataReturFirestore);
    } catch (error) {
      try {
        batalkanPerubahanLokal();
      } catch (rollbackError) {
        console.error('Gagal membatalkan perubahan data retur/tukar:', rollbackError);
      }
      console.error('Gagal menyimpan riwayat retur ke Firestore:', error);
      alert('❌ Riwayat retur gagal disimpan ke Firestore. Periksa koneksi lalu coba kembali.');
      return false;
    }

    if (fiturAktif.ubahStok) {
      setDaftarProduk(daftarProdukBaru);
      beriTahuProdukDiperbarui();
      void antrikanPerubahanProdukDanSinkronkan(
        storeId,
        produkOperasional,
        daftarProdukBaru
      );
    }
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
    tambahEceranCepat,
    ubahQtyItem,
    hapusItemKeranjang,
    produkKeranjangBerubah,
    resetKeranjang,
    prosesBayar,
    prosesReturTukar,
    resetTransaksiSelesai
  };
}