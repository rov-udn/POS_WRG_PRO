import { useState, useEffect, useRef } from 'react';
import { useAppMode } from '../../../hooks/useAppMode';
import { roundPreciseQuantity } from '../../../utils/formatQuantity';
import {
  apakahProdukBerubahDariSnapshot,
  beriTahuProdukDiperbarui,
  buatSnapshotProdukTransaksi,
  EVENT_PRODUK_DIPERBARUI,
  hitungRasioSatuanKeBasisSaatIni
} from '../../produk/utils/produkUtils';
import { beriTahuMenuNotificationsDiperbarui } from '../../../utils/menuNotifications';
import { buatKunciStorageProduk } from '../../produk/utils/produkStorage';

const KUNCI_STORAGE_RESTOCK = 'pos_warung_restock_logs';
const KUNCI_STORAGE_ANTREAN = 'pos_warung_antrean_restock';
const KUNCI_STORAGE_KERANJANG_RESTOCK = 'pos_warung_keranjang_restock';

function ambilKeranjangRestockTersimpan() {
  try {
    const data = localStorage.getItem(KUNCI_STORAGE_KERANJANG_RESTOCK);
    const keranjang = data ? JSON.parse(data) : [];
    return Array.isArray(keranjang) ? keranjang : [];
  } catch (error) {
    console.error('Gagal memuat keranjang restock tersimpan:', error);
    return [];
  }
}

export function useGudang({ storeId, onAntreanRestockDiterima } = {}) {
  const KUNCI_STORAGE_PRODUK = buatKunciStorageProduk(storeId);
  const { fitur } = useAppMode();
  const [tabAktif, setTabAktif] = useState('stok'); // 'stok', 'riwayat'
  const [keranjangRestock, setKeranjangRestock] = useState(ambilKeranjangRestockTersimpan);
  const antreanGagalTerakhir = useRef('');
  
  // Data produk dari localStorage
  const [daftarProduk, setDaftarProduk] = useState(() => {
    try {
      if (!KUNCI_STORAGE_PRODUK) return [];
      const data = localStorage.getItem(KUNCI_STORAGE_PRODUK);
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
      if (
        event.key === KUNCI_STORAGE_PRODUK ||
        event.key === KUNCI_STORAGE_ANTREAN
      ) {
        muatProdukTerbaru();
      }
    };

    window.addEventListener('storage', tanganiStorage);
    window.addEventListener(EVENT_PRODUK_DIPERBARUI, muatProdukTerbaru);
    return () => {
      window.removeEventListener('storage', tanganiStorage);
      window.removeEventListener(EVENT_PRODUK_DIPERBARUI, muatProdukTerbaru);
    };
  }, [KUNCI_STORAGE_PRODUK]);

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

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_STORAGE_KERANJANG_RESTOCK, JSON.stringify(keranjangRestock));
      beriTahuMenuNotificationsDiperbarui();
    } catch (error) {
      console.error('Gagal menyimpan keranjang restock:', error);
    }
  }, [keranjangRestock]);

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
        snapshotProduk: buatSnapshotProdukTransaksi(produk),
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
    const rawAntrean = localStorage.getItem(KUNCI_STORAGE_ANTREAN);

    if (rawAntrean) {
      try {
        const daftarKiriman = JSON.parse(rawAntrean);

        if (Array.isArray(daftarKiriman) && daftarKiriman.length > 0) {
          const sisaAntreanGagal = [];
          let adaItemDiterima = false;
          const snapshotKeranjangPerSatuan = new Map(
            keranjangRestock.map((item) => [
              `${item.idProduk}:${item.idSatuanDipilih}`,
              item.snapshotProduk
            ])
          );

          daftarKiriman.forEach((kiriman) => {
            const itemGagalPerKiriman = [];

            kiriman.items.forEach((itemAgen) => {
              const produkMaster = daftarProduk.find((p) => p.idProduk === itemAgen.idProduk);

              if (produkMaster) {
                const listSatuan = produkMaster.listSatuan || [];
                const satuanDipilih = listSatuan.find((s) => s.idSatuan === itemAgen.idSatuan) || listSatuan[0] || {};
                const rasioAktif = hitungRasioSatuanKeBasisSaatIni(itemAgen, produkMaster);
                const snapshotTidakAman =
                  fitur.ubahStok &&
                  (rasioAktif === null || !itemAgen.snapshotProduk);
                const kunciSatuan = `${itemAgen.idProduk}:${itemAgen.idSatuan}`;
                const adaSnapshotTersimpan = snapshotKeranjangPerSatuan.has(kunciSatuan);
                const snapshotBerbeda =
                  fitur.ubahStok &&
                  adaSnapshotTersimpan &&
                  JSON.stringify(snapshotKeranjangPerSatuan.get(kunciSatuan)) !==
                    JSON.stringify(itemAgen.snapshotProduk);

                if (snapshotTidakAman || snapshotBerbeda) {
                  itemGagalPerKiriman.push(itemAgen);
                  return;
                }
                if (!adaSnapshotTersimpan) {
                  snapshotKeranjangPerSatuan.set(kunciSatuan, itemAgen.snapshotProduk);
                }
                adaItemDiterima = true;

                setKeranjangRestock((prev) => {
                  const eksisIndex = prev.findIndex(
                    (k) => k.idProduk === itemAgen.idProduk && k.idSatuanDipilih === itemAgen.idSatuan
                  );

                  if (eksisIndex > -1) {
                    const baru = [...prev];
                    baru[eksisIndex] = fitur.ubahStok
                      ? {
                          ...baru[eksisIndex],
                          qtyRestock: roundPreciseQuantity(
                            Number(baru[eksisIndex].qtyRestock) + Number(itemAgen.qty)
                          )
                        }
                      : {
                          ...baru[eksisIndex],
                          hargaBeliBaru: Number(itemAgen.hargaBeli) || Number(satuanDipilih.hargaBeli) || 0,
                          updateHargaBeli: true
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
                      rasioDipilih: rasioAktif ?? (Number(itemAgen.rasio) || 1),
                      snapshotProduk: itemAgen.snapshotProduk || null,
                      hargaBeliMaster: Number(satuanDipilih.hargaBeli) || 0,
                      hargaBeliBaru: Number(itemAgen.hargaBeli) || Number(satuanDipilih.hargaBeli) || 0,
                      qtyRestock: fitur.ubahStok ? itemAgen.qty : 0,
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
            const antreanGagal = JSON.stringify(sisaAntreanGagal);
            if (antreanGagal !== antreanGagalTerakhir.current) {
              antreanGagalTerakhir.current = antreanGagal;
              alert(
                '❌ Sebagian antrean restock belum dapat diproses karena data snapshot produk atau satuannya tidak aman. Antrean dipertahankan agar tidak hilang; periksa master produk lalu kirim ulang.'
              );
            }
          } else {
            localStorage.removeItem(KUNCI_STORAGE_ANTREAN);
            beriTahuMenuNotificationsDiperbarui();
            antreanGagalTerakhir.current = '';
          }
          
          if (adaItemDiterima) onAntreanRestockDiterima?.();
        }
      } catch (e) {
        console.error("Gagal menyerap data antrean restock:", e);
      }
    }
  }, [daftarProduk, fitur.ubahStok, keranjangRestock, onAntreanRestockDiterima]);

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
    if (keranjangRestock.length === 0) return false;
    if (!KUNCI_STORAGE_PRODUK) {
      alert('ID toko aktif tidak tersedia. Restock belum diproses.');
      return false;
    }

    let produkTerkini;
    try {
      produkTerkini = JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]');
    } catch (error) {
      console.error('Gagal membaca produk terbaru sebelum restock:', error);
      alert('❌ Data produk terbaru tidak dapat dibaca. Restock belum diproses.');
      return false;
    }

    const itemDenganRasioValid = keranjangRestock.map((item) => {
      const produkTerkiniItem = produkTerkini.find((produk) => produk.idProduk === item.idProduk);
      return {
        item,
        produk: produkTerkiniItem,
        rasioAktif: produkTerkiniItem
          ? hitungRasioSatuanKeBasisSaatIni(item, produkTerkiniItem)
          : null
      };
    });
    const itemProdukTidakDitemukan = itemDenganRasioValid.find(({ produk }) => !produk);
    if (itemProdukTidakDitemukan) {
      alert(
          `❌ Produk "${itemProdukTidakDitemukan.item.namaProduk}" tidak ditemukan di master terbaru. Restock belum diproses.`
      );
      return false;
    }

    const itemTidakValid = itemDenganRasioValid.find(
      ({ item, produk, rasioAktif }) =>
        fitur.ubahStok &&
        Number(item.qtyRestock) > 0 &&
        (!produk || rasioAktif === null)
    );
    if (itemTidakValid) {
      alert(
        `❌ Satuan restock "${itemTidakValid.item.namaSatuanDipilih}" untuk produk "${itemTidakValid.item.namaProduk}" tidak dapat dikonversi ke basis terbaru. Hapus item lalu tambahkan kembali.`
      );
      return false;
    }

    const itemUsang = itemDenganRasioValid.filter(
      ({ item, produk }) =>
        apakahProdukBerubahDariSnapshot(item.snapshotProduk, produk)
    );
    if (
      itemUsang.length > 0 &&
      !window.confirm(
        `Master produk berubah saat keranjang restock dibuat: ${itemUsang.map(({ item }) => item.namaProduk).join(', ')}. Kuantitas tetap memakai snapshot keranjang dan stok dikonversi ke basis terbaru. Lanjutkan?`
      )
    ) {
      return false;
    }

    let daftarProdukBaru = [...produkTerkini];
    const logBaruList = [];

    itemDenganRasioValid.forEach(({ item, rasioAktif }) => {
      const produkTarget = daftarProdukBaru.find((p) => p.idProduk === item.idProduk);
      if (!produkTarget) return;

      const qtyRestock = Number(item.qtyRestock) || 0;
      const rasio = (rasioAktif ?? Number(item.rasioDipilih)) || 1;
      const jumlahPcsTambahan = fitur.ubahStok
        ? roundPreciseQuantity(qtyRestock * rasio)
        : 0;
      const stokSebelum = Number(produkTarget.stokUtama) || 0;
      const stokSesudah = roundPreciseQuantity(stokSebelum + jumlahPcsTambahan);

      daftarProdukBaru = daftarProdukBaru.map((p) => {
        if (p.idProduk === item.idProduk) {
          const listSatuanBaru = p.listSatuan.map((sat) => {
            const perluUpdateHarga =
              (fitur.ubahStok ? item.updateHargaBeli : fitur.ubahHargaBeli) &&
              Number(item.hargaBeliBaru) > 0;

            if (sat.idSatuan === item.idSatuanDipilih && perluUpdateHarga) {
              return { ...sat, hargaBeli: Number(item.hargaBeliBaru) };
            }
            return sat;
          });

          return {
            ...p,
            ...(fitur.ubahStok && { stokUtama: stokSesudah }),
            listSatuan: listSatuanBaru
          };
        }
        return p;
      });

      if (fitur.ubahStok) {
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
      }
    });

    setDaftarProduk(daftarProdukBaru);
    localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(daftarProdukBaru));
    beriTahuProdukDiperbarui();
    if (fitur.ubahStok) {
      setRiwayatRestock((prev) => [...logBaruList, ...prev]);
    }
    setKeranjangRestock([]);
    return true;
  };

  // Fungsi penyesuaian stok disatukan ke riwayatRestock dan mengembalikan status boolean
  const prosesPenyesuaianStok = ({ idProduk, qtyPcsKurang, alasan, catatan }) => {
    if (!fitur.ubahStok) return false;
    if (!KUNCI_STORAGE_PRODUK) {
      alert('ID toko aktif tidak tersedia. Penyesuaian stok belum diproses.');
      return false;
    }

    try {
      const produkTerkini = JSON.parse(localStorage.getItem(KUNCI_STORAGE_PRODUK) || '[]');
      const produkTarget = produkTerkini.find((p) => p.idProduk === idProduk);
      if (!produkTarget) {
        alert('❌ Produk tidak ditemukan. Penyesuaian stok belum diproses.');
        return false;
      }

      const stokSebelum = Number(produkTarget.stokUtama) || 0;
      const jumlahPengurangan = roundPreciseQuantity(Math.max(0, Number(qtyPcsKurang) || 0));
      const stokSesudah = Math.max(0, roundPreciseQuantity(stokSebelum - jumlahPengurangan));
      const daftarBaru = produkTerkini.map((produk) =>
        produk.idProduk === idProduk
          ? { ...produk, stokUtama: stokSesudah }
          : produk
      );
      localStorage.setItem(KUNCI_STORAGE_PRODUK, JSON.stringify(daftarBaru));
      setDaftarProduk(daftarBaru);
      beriTahuProdukDiperbarui();

      const namaProduk = produkTarget ? produkTarget.namaProduk : 'Produk';

      const logPenyesuaianBaru = {
        idLog: `OPNAME-${Date.now()}`,
        idProduk,
        namaProduk,
        tanggal: new Date().toISOString(),
        tipeAksi: 'PENGURANGAN',
        alasan: alasan || 'RUSAK',
        satuanDipilih: produkTarget?.satuanTerkecil || 'Pcs',
        jumlahInput: jumlahPengurangan,
        rasioSaatItu: 1,
        totalPerubahanPcs: jumlahPengurangan,
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