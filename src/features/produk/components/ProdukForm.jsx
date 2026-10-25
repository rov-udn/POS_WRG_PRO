import React, { useState, useEffect } from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { REFERENSI_SATUAN_AWAL } from '../utils/produkUtils';
import { MASTER_KATEGORI_AWAL } from '../utils/kategoriReferensi';
import { buatIdSatuan, hitungHargaBeliSatuan, hitungStokUtama } from '../utils/produkUtils';

export default function ProdukForm({ isOpen, onClose, dataAwal, onSubmit }) {
  const [namaProduk, setNamaProduk] = useState(dataAwal?.namaProduk || '');
  const [kategori, setKategori] = useState(dataAwal?.kategori || MASTER_KATEGORI_AWAL[0].label);

  // Master Referensi Satuan & Kategori dari localStorage
  const [masterSatuan, setMasterSatuan] = useState(() => {
    const saved = localStorage.getItem('warung_master_satuan');
    return saved ? JSON.parse(saved) : REFERENSI_SATUAN_AWAL;
  });

  const [masterKategori, setMasterKategori] = useState(() => {
    const saved = localStorage.getItem('warung_master_kategori');
    return saved ? JSON.parse(saved) : MASTER_KATEGORI_AWAL;
  });

  // Default List Satuan: Buka dengan 1 Satuan Dasar (isBase: true) atau dari dataAwal
  const [listSatuan, setListSatuan] = useState(() => {
    if (dataAwal?.listSatuan && dataAwal.listSatuan.length > 0) {
      return dataAwal.listSatuan.map((s) => ({
        ...s,
        idSatuan: s.idSatuan || buatIdSatuan()
      }));
    }
    return [
      {
        idSatuan: buatIdSatuan(),
        namaSatuan: 'Pcs',
        barcode: '',
        hargaBeli: 0,
        hargaJual: 0,
        rasio: 1,
        isBase: true
      }
    ];
  });

  // State untuk Input Stok Awal berbasis pilihan Satuan
  const [satuanPilihanStokId, setSatuanPilihanStokId] = useState(() => {
    return listSatuan[0]?.idSatuan || '';
  });

  const [inputKuantitasStok, setInputKuantitasStok] = useState(() => {
    if (!dataAwal) return 0;
    const stokTotal = Number(dataAwal.stokUtama) || 0;
    const satuanTerbesar = listSatuan[0];
    const rasioTerbesar = Number(satuanTerbesar?.rasio) || 1;
    
    if (rasioTerbesar > 1 && stokTotal % rasioTerbesar === 0) {
      return stokTotal / rasioTerbesar;
    }
    return stokTotal;
  });

  // State Modal Tambah Satuan / Kategori Cepat
  const [modalTambahSatuanAktif, setModalTambahSatuanAktif] = useState(false);
  const [targetKategoriBaru, setTargetKategoriBaru] = useState('menengah');
  const [namaSatuanBaru, setNamaSatuanBaru] = useState('');

  const [modalTambahKategoriAktif, setModalTambahKategoriAktif] = useState(false);
  const [labelKategoriBaru, setLabelKategoriBaru] = useState('');

  useEffect(() => {
    localStorage.setItem('warung_master_satuan', JSON.stringify(masterSatuan));
  }, [masterSatuan]);

  useEffect(() => {
    localStorage.setItem('warung_master_kategori', JSON.stringify(masterKategori));
  }, [masterKategori]);

  // Logika otomatis konversi harga beli
  useEffect(() => {
    if (!listSatuan || listSatuan.length < 2) return;

    const itemTerbesar = listSatuan[0];
    const hargaBeliBesar = Number(itemTerbesar.hargaBeli) || 0;
    const rasioBesar = Number(itemTerbesar.rasio) || 1;

    let perluUpdate = false;
    const listBaru = listSatuan.map((satuan, index) => {
      if (index === 0) return satuan;

      const hargaOtomatis = hitungHargaBeliSatuan(
        hargaBeliBesar,
        rasioBesar,
        satuan.rasio
      );

      if (satuan.hargaBeli !== hargaOtomatis) {
        perluUpdate = true;
        return { ...satuan, hargaBeli: hargaOtomatis };
      }

      return satuan;
    });

    if (perluUpdate) {
      setListSatuan(listBaru);
    }
  }, [
    listSatuan[0]?.hargaBeli, 
    listSatuan[0]?.rasio, 
    JSON.stringify(listSatuan.map((s) => s.rasio))
  ]);

  const tambahSatuanGrosir = () => {
    const satuanBesarBaru = {
      idSatuan: buatIdSatuan(),
      namaSatuan: masterSatuan.besar[0] || 'Dus',
      barcode: '',
      hargaBeli: 0,
      hargaJual: 0,
      rasio: 24,
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
      rasio: 6,
      isBase: false
    };

    setListSatuan((prev) => {
      if (prev.length === 1) {
        return [satuanMenengahBaru, ...prev];
      }
      const satuanTerbesar = prev[0];
      const satuanDasar = prev[prev.length - 1];
      const satuanMenengah = prev.slice(1, prev.length - 1);
      return [satuanTerbesar, ...satuanMenengah, satuanMenengahBaru, satuanDasar];
    });
  };

  const ubahSatuan = (index, field, value) => {
    const listBaru = [...listSatuan];
    listBaru[index][field] = value;
    setListSatuan(listBaru);
  };

  const hapusSatuan = (index) => {
    if (listSatuan[index].isBase || listSatuan.length === 1) return;
    setListSatuan(listSatuan.filter((_, i) => i !== index));
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

  const satuanStokTerpilih = listSatuan.find((s) => s.idSatuan === satuanPilihanStokId) || listSatuan[0];
  const rasioStokTerpilih = satuanStokTerpilih?.rasio || 1;

  const totalStokUtamaHitung = hitungStokUtama(inputKuantitasStok, rasioStokTerpilih);

  const handleSubmit = (e) => {
    e.preventDefault();
    const satuanDasarObj = listSatuan.find((s) => s.isBase) || listSatuan[listSatuan.length - 1];
    const satuanTerkecil = satuanDasarObj ? satuanDasarObj.namaSatuan : 'Pcs';

    const dataForm = {
      ...(dataAwal?.idProduk && { idProduk: dataAwal.idProduk }),
      namaProduk,
      kategori,
      stokUtama: totalStokUtamaHitung,
      satuanTerkecil,
      listSatuan
    };
    onSubmit(dataForm);
  };

  const satuanDasarObj = listSatuan.find((s) => s.isBase) || listSatuan[listSatuan.length - 1];
  const namaSatuanTerkecil = satuanDasarObj?.namaSatuan || 'Pcs';

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

        {/* Daftar Satuan Barang */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h4 className="font-bold text-sm text-gray-800">Daftar Satuan Barang</h4>
            <div className="flex gap-2">
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

          {listSatuan.map((satuan, index) => {
            const isBaseItem = satuan.isBase || (listSatuan.length === 1);
            const isTerbesar = index === 0 && listSatuan.length > 1;

            let kategoriPilihan = 'kecil';
            let labelPosisi = 'Satuan Terkecil (Dasar)';

            if (listSatuan.length > 1) {
              if (index === 0) {
                kategoriPilihan = 'besar';
                labelPosisi = 'Satuan Terbesar (Utama)';
              } else if (index === listSatuan.length - 1) {
                kategoriPilihan = 'kecil';
                labelPosisi = 'Satuan Terkecil (Dasar)';
              } else {
                kategoriPilihan = 'menengah';
                labelPosisi = `Satuan Menengah ke-${index}`;
              }
            }

            const listOpsiSatuan = masterSatuan[kategoriPilihan] || [];

            return (
              <div
                key={`${satuan.idSatuan}-${index}`}
                className={`p-3 border rounded-lg space-y-3 ${
                  isBaseItem ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {labelPosisi}
                  </span>
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
                    label="Harga Beli"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={satuan.hargaBeli}
                    onChange={(e) => ubahSatuan(index, 'hargaBeli', Math.max(0, Number(e.target.value)))}
                    disabled={!isTerbesar && listSatuan.length > 1}
                  />
                  <Input
                    label="Harga Jual"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={satuan.hargaJual}
                    onChange={(e) => ubahSatuan(index, 'hargaJual', Math.max(0, Number(e.target.value)))}
                  />
                  <Input
                    label="Rasio (ke Pcs)"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={satuan.rasio}
                    onChange={(e) => ubahSatuan(index, 'rasio', Math.max(1, Number(e.target.value)))}
                    disabled={isBaseItem}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT STOK AWAL BERBASIS SATUAN */}
        <div className="border-t pt-4 space-y-2 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-800">
            Input Stok Awal
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Jumlah Kuantitas Fisik"
              type="number"
              min="0"
              placeholder="Contoh: 10"
              value={inputKuantitasStok}
              onChange={(e) => setInputKuantitasStok(Math.max(0, Number(e.target.value)))}
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Dalam Satuan Apa?
              </label>
              <select
                value={satuanPilihanStokId}
                onChange={(e) => setSatuanPilihanStokId(e.target.value)}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {listSatuan.map((s) => (
                  <option key={s.idSatuan} value={s.idSatuan}>
                    {s.namaSatuan} (Rasio: {s.rasio})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-100/70 px-3 py-2 rounded-md flex justify-between items-center">
            <span>Kalkulasi Otomatis Stok Utama:</span>
            <span className="text-sm font-bold">
              {inputKuantitasStok || 0} {satuanStokTerpilih?.namaSatuan} × {rasioStokTerpilih} = {totalStokUtamaHitung} {namaSatuanTerkecil}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" variant="primary" className="flex-1">
            Simpan Produk
          </Button>
          <Button type="button" variant="ghost" onClose={onClose}>
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