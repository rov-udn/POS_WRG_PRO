import { useState, useEffect } from 'react';
import { useAppMode } from '../../../hooks/useAppMode';
import { calculateSubtotal, roundQuantity } from '../../../utils/formatQuantity';
import {
  apakahProdukBerubahDariSnapshot,
  beriTahuProdukDiperbarui,
  buatSnapshotProdukTransaksi,
  EVENT_PRODUK_DIPERBARUI,
  hitungRasioSatuanKeBasisSaatIni
} from '../../produk/utils/produkUtils';
import { beriTahuMenuNotificationsDiperbarui } from '../../../utils/menuNotifications';
import { buatKunciStorageProduk } from '../../produk/utils/produkStorage';

const KUNCI_STORAGE_DRAF_BELANJA = 'pos_warung_draf_belanja';
const KUNCI_STORAGE_RIWAYAT_BELANJA = 'pos_warung_riwayat_belanja_agen'; // Key baru untuk arsip riwayat kulakan

export function useBelanjaAgen(storeId) {
  const KUNCI_STORAGE_PRODUK = buatKunciStorageProduk(storeId);
  const { fitur } = useAppMode();
  const [daftarProduk, setDaftarProduk] = useState(() => {
    try {
      if (!KUNCI_STORAGE_PRODUK) return [];
      const data = localStorage.getItem(KUNCI_STORAGE_PRODUK);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  const [keranjangBelanja, setKeranjangBelanja] = useState([]);
  const [namaAgen, setNamaAgen] = useState('');
  
  const [daftarDraf, setDaftarDraf] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_DRAF_BELANJA);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  // State untuk menyimpan daftar riwayat belanja agen yang sudah selesai
  const [daftarRiwayatKulakan, setDaftarRiwayatKulakan] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_RIWAYAT_BELANJA);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

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

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_DRAF_BELANJA, JSON.stringify(daftarDraf));
      beriTahuMenuNotificationsDiperbarui();
    } catch (e) {
      console.error("Gagal menyimpan draf belanja:", e);
    }
  }, [daftarDraf]);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_RIWAYAT_BELANJA, JSON.stringify(daftarRiwayatKulakan));
    } catch (e) {
      console.error("Gagal menyimpan riwayat kulakan:", e);
    }
  }, [daftarRiwayatKulakan]);

  const tambahKeKeranjang = (produk, satuanPilihan) => {
    const itemAda = keranjangBelanja.find(
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

    setKeranjangBelanja((prev) => {
      const indexEksis = prev.findIndex(
        (item) => item.idProduk === produk.idProduk && item.idSatuan === satuanPilihan.idSatuan
      );

      const hargaBeliUnit = Number(satuanPilihan.hargaBeli) || 0;

      if (indexEksis > -1) {
        const keranjangBaru = [...prev];
        const itemLama = keranjangBaru[indexEksis];
        const qtyBaru = roundQuantity(itemLama.qty + 1);
        
        keranjangBaru[indexEksis] = {
          ...itemLama,
          qty: qtyBaru,
          subtotal: calculateSubtotal(itemLama.hargaBeliSatuan, qtyBaru)
        };
        return keranjangBaru;
      } else {
        const itemBaru = {
          idProduk: produk.idProduk,
          namaProduk: produk.namaProduk,
          kategori: produk.kategori || 'Lainnya',
          idSatuan: satuanPilihan.idSatuan,
          namaSatuan: satuanPilihan.namaSatuan,
          barcode: satuanPilihan.barcode || '',
          hargaBeliSatuan: hargaBeliUnit,
          qty: 1,
          rasio: Number(satuanPilihan.rasio) || 1,
          snapshotProduk: buatSnapshotProdukTransaksi(produk),
          subtotal: calculateSubtotal(hargaBeliUnit, 1),
          isKosongDiAgen: false,
          qtyReal: 1 // Inisialisasi Real Qty sama dengan rencana awal
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

    setKeranjangBelanja((prev) =>
      prev.map((item) => {
        if (item.idProduk === idProduk && item.idSatuan === idSatuan) {
          return {
            ...item,
            qty: q,
            subtotal: calculateSubtotal(item.hargaBeliSatuan, q)
          };
        }
        return item;
      })
    );
  };

  const hapusItemKeranjang = (idProduk, idSatuan) => {
    setKeranjangBelanja((prev) =>
      prev.filter((item) => !(item.idProduk === idProduk && item.idSatuan === idSatuan))
    );
  };

  const totalEstimasiModal = keranjangBelanja.reduce(
    (sum, item) => sum + calculateSubtotal(item.hargaBeliSatuan, item.qty),
    0
  );
  const totalQtyItems = roundQuantity(keranjangBelanja.reduce((sum, item) => sum + item.qty, 0));

  const simpanKeDraf = () => {
    if (keranjangBelanja.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return false;
    }

    const drafBaru = {
      idDraf: `DRAF-KULAKAN-${Date.now()}`,
      tanggal: new Date().toISOString(),
      namaAgen: namaAgen || 'Agen Grosir / Toko',
      items: keranjangBelanja.map(i => ({ ...i, qtyReal: i.qty })),
      totalEstimasiModal
    };

    setDaftarDraf((prev) => [drafBaru, ...prev]);
    setKeranjangBelanja([]);
    setNamaAgen('');
    alert('✅ Rencana belanja berhasil disimpan sebagai draf!');
    return true;
  };

  const toggleStatusKosongDraf = (idDraf, idProduk, idSatuan) => {
    setDaftarDraf((prevDraf) =>
      prevDraf.map((draf) => {
        if (draf.idDraf === idDraf) {
          const itemsBaru = draf.items.map((item) => {
            if (item.idProduk === idProduk && item.idSatuan === idSatuan) {
              return { ...item, isKosongDiAgen: !item.isKosongDiAgen };
            }
            return item;
          });

          const totalModalBaru = itemsBaru
            .filter((item) => !item.isKosongDiAgen)
            .reduce(
              (sum, item) =>
                sum + calculateSubtotal(item.hargaBeliSatuan, item.qtyReal ?? item.qty),
              0
            );

          return {
            ...draf,
            items: itemsBaru,
            totalEstimasiModal: totalModalBaru
          };
        }
        return draf;
      })
    );
  };

  // Fungsi untuk mengubah Qty Real langsung pada item draf (jika di agen kurang / nambah)
  const ubahQtyRealDraf = (idDraf, idProduk, idSatuan, qtyRealBaru) => {
    if (!Number.isFinite(Number(qtyRealBaru))) return;
    const qReal = Math.max(0, roundQuantity(qtyRealBaru));
    setDaftarDraf((prevDraf) =>
      prevDraf.map((draf) => {
        if (draf.idDraf === idDraf) {
          const itemsBaru = draf.items.map((item) => {
            if (item.idProduk === idProduk && item.idSatuan === idSatuan) {
              return { ...item, qtyReal: qReal };
            }
            return item;
          });

          const totalModalBaru = itemsBaru
            .filter((item) => !item.isKosongDiAgen)
            .reduce(
              (sum, item) => sum + calculateSubtotal(item.hargaBeliSatuan, item.qtyReal),
              0
            );

          return {
            ...draf,
            items: itemsBaru,
            totalEstimasiModal: totalModalBaru
          };
        }
        return draf;
      })
    );
  };

  // FUNGSI GANDA: ARSIP RIWAYAT & KIRIM KE ANTREAN RESTOCK GUDANG
  const prosesSelesaiBelanja = (draf) => {
    if (!KUNCI_STORAGE_PRODUK) {
      alert('ID toko aktif tidak tersedia. Belanja belum dapat diproses ke gudang.');
      return false;
    }
    try {
      const produkTerkini = JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]');
      setDaftarProduk(produkTerkini);
      const itemOperasional = draf.items
        .filter((item) => !item.isKosongDiAgen && (item.qtyReal ?? item.qty) > 0)
        .map((item) => {
          const produk = produkTerkini.find((p) => p.idProduk === item.idProduk);
          return {
            item,
            produk,
            rasioSaatIni: produk ? hitungRasioSatuanKeBasisSaatIni(item, produk) : null,
            produkBerubah: apakahProdukBerubahDariSnapshot(
              item.snapshotProduk,
              produk
            )
          };
        });

      if (fitur.kirimAntreanRestock) {
        const itemTanpaKonversiAman = itemOperasional.find(
          ({ item, produk, rasioSaatIni }) =>
            !item.snapshotProduk || !produk || rasioSaatIni === null
        );
        if (itemTanpaKonversiAman) {
          alert(
            `❌ Data satuan untuk "${itemTanpaKonversiAman.item.namaProduk}" tidak memiliki snapshot rasio yang dapat dikonversi dengan aman. Hapus draf lama dan buat draf baru sebelum mengirim ke Gudang.`
          );
          return false;
        }
      }

      const itemUsang = itemOperasional.filter(({ produkBerubah }) => produkBerubah);
      if (
        itemUsang.length > 0 &&
        !window.confirm(
          `Master produk berubah setelah draf dibuat: ${itemUsang.map(({ item }) => item.namaProduk).join(', ')}. Jumlah dan harga draf tetap dibekukan; rasio stok akan dikonversi ke satuan dasar terbaru. Lanjutkan?`
        )
      ) {
        return false;
      }

      // 1. Siapkan data arsip utuh apa adanya (lengkap dengan status kosong dan qty real)
      const arsipRiwayat = {
        ...draf,
        statusSelesai: 'SELESAI_KULAKAN',
        tanggalSelesai: new Date().toISOString()
      };

      // Masukkan ke state & storage riwayat kulakan
      setDaftarRiwayatKulakan((prev) => [arsipRiwayat, ...prev]);

      if (fitur.kirimAntreanRestock || fitur.ubahHargaBeli) {
        const KUNCI_STORAGE_ANTREAN = 'pos_warung_antrean_restock';
        const rawAntrean = localStorage.getItem(KUNCI_STORAGE_ANTREAN) || '[]';
        const antreanLama = JSON.parse(rawAntrean);

        const itemValidGudang = itemOperasional
          .filter(({ item }) => (item.qtyReal ?? item.qty) > 0)
          .map(({ item, rasioSaatIni }) => {
            const itemGudang = {
              idProduk: item.idProduk,
              namaProduk: item.namaProduk,
              idSatuan: item.idSatuan,
              namaSatuan: item.namaSatuan,
              hargaBeli: item.hargaBeliSatuan,
              snapshotProduk: item.snapshotProduk
            };

            if (fitur.kirimAntreanRestock) {
              return {
                ...itemGudang,
                qty: item.qtyReal ?? item.qty,
                rasio: rasioSaatIni
              };
            }

            return itemGudang;
          });

        if (itemValidGudang.length > 0) {
          const kirimanGudang = {
            idDraf: draf.idDraf,
            namaAgen: draf.namaAgen,
            tanggal: draf.tanggal,
            items: itemValidGudang
          };
          localStorage.setItem(KUNCI_STORAGE_ANTREAN, JSON.stringify([...antreanLama, kirimanGudang]));
          beriTahuMenuNotificationsDiperbarui();
        }
        beriTahuProdukDiperbarui();
      }

      // 3. Hapus draf dari daftar aktif
      setDaftarDraf((prev) => prev.filter((d) => d.idDraf !== draf.idDraf));

      alert(
        fitur.kirimAntreanRestock
          ? '🚀 Belanjaan berhasil diarsipkan ke Riwayat Kulakan dan dikirim ke Gudang!'
          : fitur.ubahHargaBeli
            ? '🚀 Belanjaan berhasil diarsipkan dan data harga dikirim ke Gudang!'
            : '🚀 Belanjaan berhasil diarsipkan ke Riwayat Kulakan!'
      );
      return true;
    } catch (e) {
      console.error("Gagal memproses selesai belanja:", e);
      alert('❌ Terjadi kesalahan saat memproses belanjaan.');
      return false;
    }
  };

  const hapusDraf = (idDraf) => {
    setDaftarDraf((prev) => prev.filter((d) => d.idDraf !== idDraf));
  };

  const produkKeranjangBerubah = keranjangBelanja
    .filter((item) =>
      apakahProdukBerubahDariSnapshot(
        item.snapshotProduk,
        daftarProduk.find((produk) => produk.idProduk === item.idProduk)
      )
    )
    .map((item) => item.namaProduk);
  const produkDrafBerubah = Object.fromEntries(
    daftarDraf.map((draf) => [
      draf.idDraf,
      [...new Set(
        draf.items
          .filter((item) =>
            apakahProdukBerubahDariSnapshot(
              item.snapshotProduk,
              daftarProduk.find((produk) => produk.idProduk === item.idProduk)
            )
          )
          .map((item) => item.namaProduk)
      )]
    ])
  );

  return {
    daftarProduk,
    keranjangBelanja,
    produkKeranjangBerubah,
    namaAgen,
    setNamaAgen,
    daftarDraf,
    produkDrafBerubah,
    daftarRiwayatKulakan,
    totalEstimasiModal,
    totalQtyItems,
    tambahKeKeranjang,
    ubahQtyItem,
    hapusItemKeranjang,
    simpanKeDraf,
    toggleStatusKosongDraf,
    ubahQtyRealDraf,
    prosesSelesaiBelanja,
    hapusDraf
  };
}