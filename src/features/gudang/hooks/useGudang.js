import { useState, useEffect } from 'react';

const KUNCI_STORAGE_RESTOCK = 'pos_warung_restock_logs';
const KUNCI_STORAGE_PRODUK = 'pos_warung_daftar_produk';

export function useGudang() {
  const [tabAktif, setTabAktif] = useState('stok'); // 'stok', 'riwayat'
  const [keranjangRestock, setKeranjangRestock] = useState([]); // State keranjang restock massal
  
  // Data produk dari localStorage
  const [daftarProduk, setDaftarProduk] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_PRODUK);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  // Data log restock & penyesuaian (disatukan dalam satu sumber riwayat)
  const [riwayatRestock, setRiwayatRestock] = useState(() => {
    try {
      const data = localStorage.getItem(KUNCI_STORAGE_RESTOCK);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_RESTOCK, JSON.stringify(riwayatRestock));
    } catch (e) {
      console.error("Gagal menyimpan riwayat restock", e);
    }
  }, [riwayatRestock]);

  // Tambahkan item ke keranjang restock
  const tambahKeKeranjangRestock = (produk) => {
    const satuanTerbesar = produk?.listSatuan?.reduce((prev, curr) => {
      return (prev.rasio > curr.rasio) ? prev : curr;
    }, produk?.listSatuan[0]);

    setKeranjangRestock((prev) => {
      const eksis = prev.find((item) => item.idProduk === produk.idProduk);
      if (eksis) return prev; // Jika sudah ada, jangan duplikasi

      const itemBaru = {
        idProduk: produk.idProduk,
        namaProduk: produk.namaProduk,
        satuanTerkecil: produk.satuanTerkecil,
        stokUtamaSaatIni: produk.stokUtama,
        listSatuan: produk.listSatuan || [],
        idSatuanDipilih: satuanTerbesar?.idSatuan || '',
        namaSatuanDipilih: satuanTerbesar?.namaSatuan || 'Pcs',
        rasioDipilih: satuanTerbesar?.rasio || 1,
        hargaBeliMaster: satuanTerbesar?.hargaBeli || 0,
        hargaBeliBaru: satuanTerbesar?.hargaBeli || 0,
        qtyRestock: 1,
        updateHargaBeli: false
      };
      return [...prev, itemBaru];
    });
  };

  // "SATPAM" PENERIMA DATA DARI MENU BELANJA AGEN (DENGAN SAFEGUARD ANTREAN GAGAL)
  useEffect(() => {
    const KUNCI_STORAGE_ANTREAN = 'pos_warung_antrean_restock';
    const rawAntrean = localStorage.getItem(KUNCI_STORAGE_ANTREAN);

    if (rawAntrean) {
      try {
        const daftarKiriman = JSON.parse(rawAntrean);

        if (Array.isArray(daftarKiriman) && daftarKiriman.length > 0) {
          const sisaAntreanGagal = [];

          daftarKiriman.forEach((kiriman) => {
            const itemGagalPerKiriman = [];

            kiriman.items.forEach((itemAgen) => {
              const produkMaster = daftarProduk.find((p) => p.idProduk === itemAgen.idProduk);

              if (produkMaster) {
                const listSatuan = produkMaster.listSatuan || [];
                const satuanDipilih = listSatuan.find((s) => s.idSatuan === itemAgen.idSatuan) || listSatuan[0] || {};

                setKeranjangRestock((prev) => {
                  const eksisIndex = prev.findIndex(
                    (k) => k.idProduk === itemAgen.idProduk && k.idSatuanDipilih === itemAgen.idSatuan
                  );

                  if (eksisIndex > -1) {
                    const baru = [...prev];
                    baru[eksisIndex] = {
                      ...baru[eksisIndex],
                      qtyRestock: baru[eksisIndex].qtyRestock + itemAgen.qty
                    };
                    return baru;
                  } else {
                    const itemKeranjangBaru = {
                      idProduk: produkMaster.idProduk,
                      namaProduk: produkMaster.namaProduk,
                      satuanTerkecil: produkMaster.satuanTerkecil || 'Pcs',
                      stokUtamaSaatIni: produkMaster.stokUtama || 0,
                      listSatuan: listSatuan,
                      idSatuanDipilih: itemAgen.idSatuan,
                      namaSatuanDipilih: itemAgen.namaSatuan,
                      rasioDipilih: Number(itemAgen.rasio) || 1,
                      hargaBeliMaster: Number(satuanDipilih.hargaBeli) || 0,
                      hargaBeliBaru: Number(itemAgen.hargaBeli) || Number(satuanDipilih.hargaBeli) || 0,
                      qtyRestock: itemAgen.qty,
                      updateHargaBeli: true
                    };
                    return [...prev, itemKeranjangBaru];
                  }
                });
              } else {
                itemGagalPerKiriman.push(itemAgen);
              }
            });

            if (itemGagalPerKiriman.length > 0) {
              sisaAntreanGagal.push({
                ...kiriman,
                items: itemGagalPerKiriman
              });
            }
          });

          if (sisaAntreanGagal.length > 0) {
            localStorage.setItem(KUNCI_STORAGE_ANTREAN, JSON.stringify(sisaAntreanGagal));
          } else {
            localStorage.removeItem(KUNCI_STORAGE_ANTREAN);
          }
          
          if (typeof setBukaModalKeranjang === 'function') {
            setBukaModalKeranjang(true);
          }
        }
      } catch (e) {
        console.error("Gagal menyerap data antrean restock:", e);
      }
    }
  }, [daftarProduk]);

  // Update item di dalam keranjang restock
  const ubahItemKeranjang = (idProduk, field, val) => {
    setKeranjangRestock((prev) =>
      prev.map((item) => {
        if (item.idProduk === idProduk) {
          if (field === 'idSatuanDipilih') {
            const sat = item.listSatuan.find((s) => s.idSatuan === val);
            return {
              ...item,
              idSatuanDipilih: val,
              namaSatuanDipilih: sat?.namaSatuan || '',
              rasioDipilih: sat?.rasio || 1,
              hargaBeliMaster: sat?.hargaBeli || 0,
              hargaBeliBaru: sat?.hargaBeli || 0
            };
          }
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  // Hapus item dari keranjang restock
  const hapusItemKeranjang = (idProduk) => {
    setKeranjangRestock((prev) => prev.filter((item) => item.idProduk !== idProduk));
  };

  // Eksekusi Massal (Bulk Restock)
  const prosesRestockMassal = (catatanUmum) => {
    if (keranjangRestock.length === 0) return;

    let daftarProdukBaru = [...daftarProduk];
    const logBaruList = [];

    keranjangRestock.forEach((item) => {
      const produkTarget = daftarProdukBaru.find((p) => p.idProduk === item.idProduk);
      if (!produkTarget) return;

      const qtyRestock = Number(item.qtyRestock) || 0;
      const rasio = Number(item.rasioDipilih) || 1;
      const jumlahPcsTambahan = qtyRestock * rasio;
      const stokSebelum = Number(produkTarget.stokUtama) || 0;
      const stokSesudah = stokSebelum + jumlahPcsTambahan;

      daftarProdukBaru = daftarProdukBaru.map((p) => {
        if (p.idProduk === item.idProduk) {
          const listSatuanBaru = p.listSatuan.map((sat) => {
            if (sat.idSatuan === item.idSatuanDipilih && item.updateHargaBeli && Number(item.hargaBeliBaru) > 0) {
              return { ...sat, hargaBeli: Number(item.hargaBeliBaru) };
            }
            return sat;
          });

          return {
            ...p,
            stokUtama: stokSesudah,
            listSatuan: listSatuanBaru
          };
        }
        return p;
      });

      logBaruList.push({
        idLog: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        idProduk: item.idProduk,
        namaProduk: item.namaProduk,
        tanggal: new Date().toISOString(),
        tipeAksi: 'PENAMBAHAN',
        alasan: 'BARANG_MASUK',
        satuanDipilih: item.namaSatuanDipilih,
        jumlahInput: qtyRestock,
        rasioSaatItu: rasio,
        totalPerubahanPcs: jumlahPcsTambahan,
        stokSebelum,
        stokSesudah,
        catatan: catatanUmum || 'Restock Massal Agen'
      });
    });

    setDaftarProduk(daftarProdukBaru);
    localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(daftarProdukBaru));
    setRiwayatRestock((prev) => [...logBaruList, ...prev]);
    setKeranjangRestock([]);
  };

  // Fungsi penyesuaian stok disatukan ke riwayatRestock dan mengembalikan status boolean
  const prosesPenyesuaianStok = ({ idProduk, qtyPcsKurang, alasan, catatan }) => {
    try {
      const KUNCI_STORAGE_PRODUK = 'pos_warung_daftar_produk';
      
      setDaftarProduk((prevProduk) => {
        const daftarBaru = prevProduk.map((produk) => {
          if (produk.idProduk === idProduk) {
            const stokLama = Number(produk.stokUtama) || 0;
            const stokBaru = Math.max(0, stokLama - qtyPcsKurang);

            return {
              ...produk,
              stokUtama: stokBaru
            };
          }
          return produk;
        });

        localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(daftarBaru));
        return daftarBaru;
      });

      const produkTarget = daftarProduk.find((p) => p.idProduk === idProduk);
      const namaProduk = produkTarget ? produkTarget.namaProduk : 'Produk';
      const stokSebelum = produkTarget ? Number(produkTarget.stokUtama) || 0 : 0;
      const stokSesudah = Math.max(0, stokSebelum - qtyPcsKurang);

      const logPenyesuaianBaru = {
        idLog: `OPNAME-${Date.now()}`,
        idProduk,
        namaProduk,
        tanggal: new Date().toISOString(),
        tipeAksi: 'PENGURANGAN',
        alasan: alasan || 'RUSAK',
        satuanDipilih: produkTarget?.satuanTerkecil || 'Pcs',
        jumlahInput: qtyPcsKurang,
        rasioSaatItu: 1,
        totalPerubahanPcs: qtyPcsKurang,
        stokSebelum,
        stokSesudah,
        catatan: catatan || 'Penyesuaian Stok Gudang'
      };

      setRiwayatRestock((prev) => [logPenyesuaianBaru, ...prev]);

      return true;
    } catch (e) {
      console.error('Gagal memproses penyesuaian stok:', e);
      return false;
    }
  };

  return {
    tabAktif,
    setTabAktif,
    daftarProduk,
    riwayatRestock,
    keranjangRestock,
    tambahKeKeranjangRestock,
    ubahItemKeranjang,
    hapusItemKeranjang,
    prosesRestockMassal,
    prosesPenyesuaianStok
  };
}