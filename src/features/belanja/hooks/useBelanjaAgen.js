import { useState, useEffect } from 'react';

const KUNCI_STORAGE_PRODUK = 'pos_warung_daftar_produk';
const KUNCI_STORAGE_DRAF_BELANJA = 'pos_warung_draf_belanja';
const KUNCI_STORAGE_RIWAYAT_BELANJA = 'pos_warung_riwayat_belanja_agen'; // Key baru untuk arsip riwayat kulakan

export function useBelanjaAgen() {
  const [daftarProduk] = useState(() => {
    try {
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
    try {
      localStorage.setItem(KUNCI_STORAGE_DRAF_BELANJA, JSON.stringify(daftarDraf));
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
    setKeranjangBelanja((prev) => {
      const indexEksis = prev.findIndex(
        (item) => item.idProduk === produk.idProduk && item.idSatuan === satuanPilihan.idSatuan
      );

      const hargaBeliUnit = Number(satuanPilihan.hargaBeli) || 0;

      if (indexEksis > -1) {
        const keranjangBaru = [...prev];
        const itemLama = keranjangBaru[indexEksis];
        const qtyBaru = itemLama.qty + 1;
        
        keranjangBaru[indexEksis] = {
          ...itemLama,
          qty: qtyBaru,
          subtotal: qtyBaru * itemLama.hargaBeliSatuan
        };
        return keranjangBaru;
      } else {
        const itemBaru = {
          idProduk: produk.idProduk,
          namaProduk: produk.namaProduk,
          idSatuan: satuanPilihan.idSatuan,
          namaSatuan: satuanPilihan.namaSatuan,
          barcode: satuanPilihan.barcode || '',
          hargaBeliSatuan: hargaBeliUnit,
          qty: 1,
          rasio: Number(satuanPilihan.rasio) || 1,
          subtotal: hargaBeliUnit,
          isKosongDiAgen: false,
          qtyReal: 1 // Inisialisasi Real Qty sama dengan rencana awal
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

    setKeranjangBelanja((prev) =>
      prev.map((item) => {
        if (item.idProduk === idProduk && item.idSatuan === idSatuan) {
          return {
            ...item,
            qty: q,
            subtotal: q * item.hargaBeliSatuan
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

  const totalEstimasiModal = keranjangBelanja.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQtyItems = keranjangBelanja.reduce((sum, item) => sum + item.qty, 0);

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
            .reduce((sum, item) => sum + (item.qtyReal * item.hargaBeliSatuan), 0);

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
    const qReal = Number(qtyRealBaru) < 0 ? 0 : Number(qtyRealBaru);
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
            .reduce((sum, item) => sum + (item.qtyReal * item.hargaBeliSatuan), 0);

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
    try {
      const KUNCI_STORAGE_ANTREAN = 'pos_warung_antrean_restock';
      
      // 1. Siapkan data arsip utuh apa adanya (lengkap dengan status kosong dan qty real)
      const arsipRiwayat = {
        ...draf,
        statusSelesai: 'SELESAI_KULAKAN',
        tanggalSelesai: new Date().toISOString()
      };

      // Masukkan ke state & storage riwayat kulakan
      setDaftarRiwayatKulakan((prev) => [arsipRiwayat, ...prev]);

      // 2. Ambil antrean gudang lama dan saring item yang valid (tidak kosong & qtyReal > 0)
      const rawAntrean = localStorage.getItem(KUNCI_STORAGE_ANTREAN) || '[]';
      const antreanLama = JSON.parse(rawAntrean);

      const itemValidGudang = draf.items
        .filter((i) => !i.isKosongDiAgen && i.qtyReal > 0)
        .map((i) => ({
          idProduk: i.idProduk,
          namaProduk: i.namaProduk,
          idSatuan: i.idSatuan,
          namaSatuan: i.namaSatuan,
          qty: i.qtyReal, // Menggunakan Real Qty hasil penyesuaian di agen
          hargaBeli: i.hargaBeliSatuan,
          rasio: i.rasio
        }));

      if (itemValidGudang.length > 0) {
        const kirimanGudang = {
          idDraf: draf.idDraf,
          namaAgen: draf.namaAgen,
          tanggal: draf.tanggal,
          items: itemValidGudang
        };
        localStorage.setItem(KUNCI_STORAGE_ANTREAN, JSON.stringify([...antreanLama, kirimanGudang]));
      }

      // 3. Hapus draf dari daftar aktif
      setDaftarDraf((prev) => prev.filter((d) => d.idDraf !== draf.idDraf));

      alert('🚀 Belanjaan berhasil diarsipkan ke Riwayat Kulakan dan dikirim ke Gudang!');
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

  return {
    daftarProduk,
    keranjangBelanja,
    namaAgen,
    setNamaAgen,
    daftarDraf,
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