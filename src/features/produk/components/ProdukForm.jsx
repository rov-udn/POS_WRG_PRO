import React, { useState, useEffect } from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { REFERENSI_SATUAN_AWAL } from '../utils/produkUtils';
import { MASTER_KATEGORI_AWAL } from '../utils/kategoriReferensi';
import {
  buatIdSatuan,
  hitungHargaBeliSatuan,
  hitungStokUtama,
  normalisasiRasioSatuan,
  normalisasiVarianProduk
} from '../utils/produkUtils';
import { cekPotensiRugiSatuan } from '../utils/cekRugi';
import { Alert } from '../../../components/ui/Alert';
import { useAppMode } from '../../../hooks/useAppMode';

const dapatkanSatuanDasarProduk = (produk, listSatuan) => {
  const satuanDasarTersimpan = listSatuan.find((satuan) => satuan.isBase === true);
  if (satuanDasarTersimpan) return satuanDasarTersimpan;

  const namaSatuanTerkecil = String(produk?.satuanTerkecil || '').trim().toLocaleLowerCase('id-ID');
  const satuanTerkecilTersimpan = listSatuan.find(
    (satuan) => String(satuan.namaSatuan || '').trim().toLocaleLowerCase('id-ID') === namaSatuanTerkecil
  );
  if (satuanTerkecilTersimpan) return satuanTerkecilTersimpan;

  return listSatuan.reduce((terkecil, satuan) => {
    const rasio = Number(satuan.rasio);
    if (!Number.isFinite(rasio) || rasio <= 0) return terkecil;
    return !terkecil || rasio < Number(terkecil.rasio) ? satuan : terkecil;
  }, null) || listSatuan[0];
};

const buatListSatuanForm = (produk) => {
  const listSatuanAwal = Array.isArray(produk?.listSatuan)
    ? produk.listSatuan.map((satuan) => ({
        ...satuan,
        idSatuan: satuan.idSatuan || buatIdSatuan()
      }))
    : [];
  const listSatuan = listSatuanAwal.length > 0
    ? listSatuanAwal
    : [{
        idSatuan: buatIdSatuan(),
        namaSatuan: 'Pcs',
        barcode: '',
        hargaBeli: 0,
        hargaJual: 0,
        rasio: 1,
        isBase: true
      }];

  return normalisasiRasioSatuan(
    listSatuan,
    dapatkanSatuanDasarProduk(produk, listSatuan)?.idSatuan
  );
};

const dapatkanIdSatuanDasarAwal = (produk) => {
  const listSatuan = Array.isArray(produk?.listSatuan) ? produk.listSatuan : [];
  return dapatkanSatuanDasarProduk(produk, listSatuan)?.idSatuan || null;
};

export default function ProdukForm({ isOpen, onClose, dataAwal, onSubmit }) {
  const { isFullMode } = useAppMode();
  const [namaProduk, setNamaProduk] = useState(dataAwal?.namaProduk ?? '');
  const [kategori, setKategori] = useState(
    dataAwal ? dataAwal.kategori ?? '' : MASTER_KATEGORI_AWAL[0].label
  );
  const [punyaVarian, setPunyaVarian] = useState(dataAwal?.punyaVarian === true);
  const [inputVarian, setInputVarian] = useState(() =>
    normalisasiVarianProduk(dataAwal?.varian).join(', ')
  );

  // Master Referensi Satuan & Kategori dari localStorage
  const [masterSatuan, setMasterSatuan] = useState(() => {
    const saved = localStorage.getItem('warung_master_satuan');
    return saved ? JSON.parse(saved) : REFERENSI_SATUAN_AWAL;
  });

  const [masterKategori, setMasterKategori] = useState(() => {
    const saved = localStorage.getItem('warung_master_kategori');
    return saved ? JSON.parse(saved) : MASTER_KATEGORI_AWAL;
  });

  const [listSatuan, setListSatuan] = useState(() => buatListSatuanForm(dataAwal));
  const [jumlahStokAwal, setJumlahStokAwal] = useState(0);
  const [idSatuanStokAwal, setIdSatuanStokAwal] = useState(() =>
    listSatuan.find((satuan) => satuan.isBase)?.idSatuan || ''
  );

  const [idSatuanAcuanModal, setIdSatuanAcuanModal] = useState(() => {
    const satuanAcuanHarga = listSatuan.find(
      (satuan) => satuan.isAcuanHargaModal === true
    );
    const satuanDasar = listSatuan.find((satuan) => satuan.isBase);
    return satuanAcuanHarga?.idSatuan || satuanDasar?.idSatuan || listSatuan[0]?.idSatuan || '';
  });

  const [idSatuanDasarAwal, setIdSatuanDasarAwal] = useState(() =>
    dapatkanIdSatuanDasarAwal(dataAwal)
  );

  // State Modal Tambah Satuan / Kategori Cepat
  const [modalTambahSatuanAktif, setModalTambahSatuanAktif] = useState(false);
  const [targetKategoriBaru, setTargetKategoriBaru] = useState('menengah');
  const [namaSatuanBaru, setNamaSatuanBaru] = useState('');

  const [modalTambahKategoriAktif, setModalTambahKategoriAktif] = useState(false);
  const [labelKategoriBaru, setLabelKategoriBaru] = useState('');

  useEffect(() => {
    const listSatuanAwal = buatListSatuanForm(dataAwal);
    const satuanDasarAwal = listSatuanAwal.find((satuan) => satuan.isBase);
    const satuanAcuanHargaAwal = listSatuanAwal.find(
      (satuan) => satuan.isAcuanHargaModal === true
    ) || satuanDasarAwal;

    setNamaProduk(dataAwal?.namaProduk ?? '');
    setKategori(dataAwal ? dataAwal.kategori ?? '' : MASTER_KATEGORI_AWAL[0].label);
    setPunyaVarian(dataAwal?.punyaVarian === true);
    setInputVarian(normalisasiVarianProduk(dataAwal?.varian).join(', '));
    setListSatuan(listSatuanAwal);
    setIdSatuanAcuanModal(
      satuanAcuanHargaAwal?.idSatuan || listSatuanAwal[0]?.idSatuan || ''
    );
    setIdSatuanDasarAwal(dapatkanIdSatuanDasarAwal(dataAwal));
    setModalTambahSatuanAktif(false);
    setTargetKategoriBaru('menengah');
    setNamaSatuanBaru('');
    setModalTambahKategoriAktif(false);
    setLabelKategoriBaru('');
    setJumlahStokAwal(0);
    setIdSatuanStokAwal(satuanDasarAwal?.idSatuan || '');
  }, [dataAwal, isOpen]);

  useEffect(() => {
    localStorage.setItem('warung_master_satuan', JSON.stringify(masterSatuan));
  }, [masterSatuan]);

  useEffect(() => {
    localStorage.setItem('warung_master_kategori', JSON.stringify(masterKategori));
  }, [masterKategori]);

  const satuanDasarAktif = listSatuan.find((satuan) => satuan.isBase) || listSatuan[0];
  const namaSatuanDasar = satuanDasarAktif?.namaSatuan || 'Pcs';
  const satuanAcuanModal = listSatuan.find(
    (satuan) => satuan.idSatuan === idSatuanAcuanModal
  ) || satuanDasarAktif;
  const rasioAcuanModal = Number(satuanAcuanModal?.rasio) > 0
    ? Number(satuanAcuanModal.rasio)
    : 1;
  const listSatuanDenganHarga = listSatuan.map((satuan) => ({
    ...satuan,
    rasio: satuan.isBase ? 1 : satuan.rasio === '' ? '' : Number(satuan.rasio) || 1,
    hargaBeli: satuan.idSatuan === satuanAcuanModal?.idSatuan
      ? Number(satuanAcuanModal?.hargaBeli) || 0
      : hitungHargaBeliSatuan(
          satuanAcuanModal?.hargaBeli,
          rasioAcuanModal,
          Number(satuan.rasio) > 0 ? Number(satuan.rasio) : 1
        )
  }));

  const tambahSatuanGrosir = () => {
    const satuanBesarBaru = {
      idSatuan: buatIdSatuan(),
      namaSatuan: masterSatuan.besar[0] || 'Dus',
      barcode: '',
      hargaBeli: 0,
      hargaJual: 0,
      rasio: '',
      isBase: false
    };

    setListSatuan((prev) => [satuanBesarBaru, ...prev]);
  };

  const tambahSatuanMenengah = () => {
    const satuanMenengahBaru = {
      idSatuan: buatIdSatuan(),
      namaSatuan: masterSatuan.menengah[0] || 'Pack',
      barcode: '',
      hargaBeli: 0,
      hargaJual: 0,
      rasio: '',
      isBase: false
    };

    setListSatuan((prev) => {
      const indexDasar = prev.findIndex((satuan) => satuan.isBase);
      return [
        ...prev.slice(0, indexDasar),
        satuanMenengahBaru,
        ...prev.slice(indexDasar)
      ];
    });
  };

  const ubahSatuan = (index, field, value) => {
    setListSatuan((prev) =>
      prev.map((satuan, i) => (i === index ? { ...satuan, [field]: value } : satuan))
    );
  };

  const pilihSatuanDasar = (idSatuan) => {
    if (idSatuan === satuanDasarAktif?.idSatuan) return;

    setListSatuan(
      normalisasiRasioSatuan(listSatuan, idSatuan).map((satuan) => {
        const rasioSebelumnya = listSatuan.find(
          (item) => item.idSatuan === satuan.idSatuan
        )?.rasio;
        return {
          ...satuan,
          ...(!satuan.isBase && rasioSebelumnya === '' && { rasio: '' })
        };
      })
    );
  };

  const hapusSatuan = (index) => {
    if (listSatuan[index].isBase || listSatuan.length === 1) return;
    const satuanDihapus = listSatuan[index];
    if (
      Number(dataAwal?.stokUtama) > 0 &&
      satuanDihapus.idSatuan === idSatuanDasarAwal
    ) {
      alert('Satuan dasar lama tidak dapat dihapus saat stok produk masih tersedia.');
      return;
    }
    if (satuanDihapus.idSatuan === idSatuanAcuanModal) {
      setIdSatuanAcuanModal(satuanDasarAktif?.idSatuan || '');
    }
    setListSatuan((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimpanSatuanCepat = (e) => {
    e.preventDefault();
    if (!namaSatuanBaru.trim()) return;

    const formatted = namaSatuanBaru.trim();
    setMasterSatuan((prev) => {
      if (prev[targetKategoriBaru].includes(formatted)) return prev;
      return {
        ...prev,
        [targetKategoriBaru]: [...prev[targetKategoriBaru], formatted]
      };
    });

    setNamaSatuanBaru('');
    setModalTambahSatuanAktif(false);
  };

  const handleSimpanKategoriCepat = (e) => {
    e.preventDefault();
    if (!labelKategoriBaru.trim()) return;

    const formattedLabel = labelKategoriBaru.trim();
    const formattedId = formattedLabel.toLowerCase().replace(/\s+/g, '_');

    if (masterKategori.some((item) => item.id === formattedId)) return;

    setMasterKategori((prev) => [...prev, { id: formattedId, label: formattedLabel }]);
    setKategori(formattedLabel);
    setLabelKategoriBaru('');
    setModalTambahKategoriAktif(false);
  };

  const rasioSatuanDasarAwalSaatIni =
    listSatuan.find((satuan) => satuan.idSatuan === idSatuanDasarAwal)?.rasio || 1;
  const stokAwalTerkonversi = hitungStokUtama(
    dataAwal?.stokUtama || 0,
    rasioSatuanDasarAwalSaatIni
  );
  const satuanStokAwal = listSatuan.find(
    (satuan) => satuan.idSatuan === idSatuanStokAwal
  ) || satuanDasarAktif;

  const handleSubmit = (e) => {
    e.preventDefault();
    const stokAwalProdukBaru = isFullMode
      ? hitungStokUtama(jumlahStokAwal, satuanStokAwal?.rasio)
      : 20;
    const dataForm = {
      ...(dataAwal?.idProduk && { idProduk: dataAwal.idProduk }),
      namaProduk,
      kategori,
      punyaVarian,
      varian: punyaVarian ? normalisasiVarianProduk(inputVarian) : [],
      stokUtama: dataAwal ? stokAwalTerkonversi : stokAwalProdukBaru,
      satuanTerkecil: namaSatuanDasar,
      listSatuan: normalisasiRasioSatuan(
        listSatuanDenganHarga,
        satuanDasarAktif?.idSatuan
      ).map((satuan) => ({
        ...satuan,
        hargaBeli: Number(satuan.hargaBeli) || 0,
        hargaJual: Number(satuan.hargaJual) || 0,
        isBase: satuan.isBase === true,
        isAcuanHargaModal: satuan.idSatuan === idSatuanAcuanModal,
        rasio: satuan.isBase
          ? 1
          : Number.isFinite(Number(satuan.rasio)) && Number(satuan.rasio) > 0
            ? Number(satuan.rasio)
            : 1
      }))
    };
    onSubmit(dataForm);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={dataAwal ? 'Edit Produk' : 'Tambah Produk Baru'}
      subtitle="Kelola informasi produk dan multi-satuan barang."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Produk & Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Produk"
            placeholder="Contoh: Kopi Susu Pouch 1L"
            value={namaProduk}
            onChange={(e) => setNamaProduk(e.target.value)}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Kategori</label>
            <div className="flex gap-2">
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                required
                className="flex-1 rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="" disabled>Pilih kategori</option>
                {kategori && !masterKategori.some((item) => item.label === kategori) && (
                  <option value={kategori}>{kategori}</option>
                )}
                {masterKategori.map((item) => (
                  <option key={item.id} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setModalTambahKategoriAktif(true)}
                className="px-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold text-gray-700 transition-colors"
                title="Tambah kategori baru"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={punyaVarian}
              onChange={(e) => setPunyaVarian(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Produk ini memiliki Varian (Rasa / Warna / Ukuran)
          </label>

          {punyaVarian && (
            <div className="space-y-1.5">
              <Input
                label="Daftar Varian"
                placeholder="Contoh: Manis, Original, Pedas atau Merah, Hitam"
                value={inputVarian}
                onChange={(e) => setInputVarian(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Contoh: Manis, Original, Pedas atau Merah, Hitam (pisahkan dengan koma)
              </p>
            </div>
          )}
        </div>

        {/* Daftar Satuan Barang */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h4 className="font-bold text-sm text-gray-800">Daftar Satuan Barang</h4>
              <p className="text-xs text-gray-500 mt-1">
                Pilih satuan dasar. Rasio dan harga beli satuan lain mengikuti acuan ini;
                harga jual tetap dapat diatur per satuan.
              </p>
            </div>
            <div className="flex gap-3">
              {listSatuan.length === 1 ? (
                <Button type="button" variant="info" size="xs" onClick={tambahSatuanGrosir}>
                  + Tambah Grosir (Dus/Ball)
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="xs" onClick={tambahSatuanMenengah}>
                  + Tambah Satuan Menengah
                </Button>
              )}
            </div>
          </div>

          {listSatuanDenganHarga.map((satuan, index) => {
            const isBaseItem = satuan.isBase;
            const satuanBerpotensiRugi = cekPotensiRugiSatuan({ listSatuan: [satuan] });
            const rasioBelumDiisi = !isBaseItem && satuan.rasio === '';
            const rasio = rasioBelumDiisi ? null : Number(satuan.rasio) || 1;
            const kategoriPilihan = isBaseItem ? 'kecil' : rasio > 1 ? 'besar' : 'menengah';
            const labelPosisi = isBaseItem
              ? 'Satuan Dasar'
              : rasioBelumDiisi
                ? 'Rasio belum diisi'
                : rasio > 1
                ? 'Lebih besar dari satuan dasar'
                : rasio < 1
                  ? 'Lebih kecil dari satuan dasar'
                  : 'Satuan setara';
            const listOpsiSatuan = Array.from(
              new Set([...Object.values(masterSatuan).flat(), satuan.namaSatuan])
            );

            return (
              <div
                key={`${satuan.idSatuan}-${index}`}
                className={`p-3 border rounded-lg space-y-3 ${
                  isBaseItem ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {labelPosisi}{!isBaseItem && !rasioBelumDiisi && ` (${rasio}×)`}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <label className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="satuan-dasar"
                        checked={isBaseItem}
                        onChange={() => pilihSatuanDasar(satuan.idSatuan)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Jadikan satuan dasar
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="acuan-harga-modal"
                        checked={satuan.idSatuan === idSatuanAcuanModal}
                        onChange={() => setIdSatuanAcuanModal(satuan.idSatuan)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      Jadikan acuan harga modal
                    </label>
                    {!isBaseItem && listSatuan.length > 1 && (
                      <button
                        type="button"
                        onClick={() => hapusSatuan(index)}
                        className="text-xs text-red-600 hover:underline font-medium"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nama Satuan</label>
                    <div className="flex gap-2">
                      <select
                        value={satuan.namaSatuan}
                        onChange={(e) => ubahSatuan(index, 'namaSatuan', e.target.value)}
                        required
                        className="flex-1 rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        {listOpsiSatuan.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetKategoriBaru(kategoriPilihan);
                          setModalTambahSatuanAktif(true);
                        }}
                        className="px-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold text-gray-700 transition-colors"
                        title="Tambah pilihan satuan baru"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Barcode"
                    placeholder="Scan / Ketik Barcode"
                    value={satuan.barcode}
                    onChange={(e) => ubahSatuan(index, 'barcode', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label={isBaseItem ? 'Harga Beli Satuan Dasar' : 'Harga Beli'}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={satuan.hargaBeli}
                    onChange={(e) => ubahSatuan(index, 'hargaBeli', Math.max(0, Number(e.target.value)))}
                    disabled={satuan.idSatuan !== idSatuanAcuanModal}
                  />
                  <Input
                    label={`Harga Jual per ${satuan.namaSatuan}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={satuan.hargaJual}
                    onChange={(e) => ubahSatuan(index, 'hargaJual', Math.max(0, Number(e.target.value)))}
                  />
                  <Input
                    label={`Rasio (ke ${namaSatuanDasar})`}
                    type="number"
                    placeholder={isBaseItem ? '1' : 'Masukkan rasio'}
                    value={isBaseItem ? 1 : satuan.rasio}
                    min="0.000000001"
                    step="any"
                    onChange={(e) => ubahSatuan(index, 'rasio', e.target.value)}
                    required
                    disabled={isBaseItem}
                  />
                </div>

                {satuanBerpotensiRugi && (
                  <Alert variant="warning">
                    Potensi rugi: harga jual {satuan.namaSatuan} lebih kecil atau sama dengan harga beli.
                  </Alert>
                )}
              </div>
            );
          })}
        </div>

        {isFullMode && !dataAwal && (
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-bold text-gray-800">Stok Awal</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Jumlah Stok Awal"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={jumlahStokAwal}
                onChange={(e) => setJumlahStokAwal(e.target.value)}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pilih Satuan
                </label>
                <select
                  value={satuanStokAwal?.idSatuan || ''}
                  onChange={(e) => setIdSatuanStokAwal(e.target.value)}
                  className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {listSatuan.map((satuan) => (
                    <option key={satuan.idSatuan} value={satuan.idSatuan}>
                      {satuan.namaSatuan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" variant="primary" className="flex-1">
            Simpan Produk
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
      {/* MODAL TAMBAH SATUAN CEPAT */}
      <BaseModal
        isOpen={modalTambahSatuanAktif}
        onClose={() => setModalTambahSatuanAktif(false)}
        title="Tambah Pilihan Satuan Baru"
        subtitle={`Tambahkan nama satuan baru untuk kategori ${targetKategoriBaru}.`}
        size="sm"
      >
        <form onSubmit={handleSimpanSatuanCepat} className="space-y-4">
          <Input
            label="Nama Satuan Baru"
            placeholder="Contoh: Renteng, Bal, Botol"
            value={namaSatuanBaru}
            onChange={(e) => setNamaSatuanBaru(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" className="flex-1">
              Simpan Satuan
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalTambahSatuanAktif(false)}>
              Batal
            </Button>
          </div>
        </form>
      </BaseModal>

      {/* MODAL TAMBAH KATEGORI CEPAT */}
      <BaseModal
        isOpen={modalTambahKategoriAktif}
        onClose={() => setModalTambahKategoriAktif(false)}
        title="Tambah Kategori Baru"
        subtitle="Tambahkan kategori produk baru sesuai kebutuhan warung."
        size="sm"
      >
        <form onSubmit={handleSimpanKategoriCepat} className="space-y-4">
          <Input
            label="Nama Kategori Baru"
            placeholder="Contoh: Perlengkapan Mandi, Elektronik"
            value={labelKategoriBaru}
            onChange={(e) => setLabelKategoriBaru(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" className="flex-1">
              Simpan Kategori
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalTambahKategoriAktif(false)}>
              Batal
            </Button>
          </div>
        </form>
      </BaseModal>
    </BaseModal>
  );
}