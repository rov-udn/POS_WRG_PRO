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
import { useAppMode } from '../../../hooks/useAppMode';
import { Alert } from '../../../components/ui/Alert';
import { roundPreciseQuantity } from '../../../utils/formatQuantity';

export default function ProdukForm({ isOpen, onClose, dataAwal, onSubmit }) {
  const { fitur } = useAppMode();
  const [namaProduk, setNamaProduk] = useState(dataAwal?.namaProduk || '');
  const [kategori, setKategori] = useState(dataAwal?.kategori || MASTER_KATEGORI_AWAL[0].label);
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

  const [listSatuan, setListSatuan] = useState(() => {
    if (dataAwal?.listSatuan && dataAwal.listSatuan.length > 0) {
      const satuanTersimpan = dataAwal.listSatuan.map((s) => ({
        ...s,
        idSatuan: s.idSatuan || buatIdSatuan()
      }));
      return normalisasiRasioSatuan(satuanTersimpan);
    }
    return normalisasiRasioSatuan([
      {
        idSatuan: buatIdSatuan(),
        namaSatuan: 'Pcs',
        barcode: '',
        hargaBeli: 0,
        hargaJual: 0,
        rasio: 1,
        isBase: true
      }
    ]);
  });

  const [idSatuanDasarAwal] = useState(() => {
    const listAwal = dataAwal?.listSatuan || [];
    return listAwal.find((satuan) => satuan.isBase)?.idSatuan ||
      listAwal[listAwal.length - 1]?.idSatuan ||
      null;
  });

  const [satuanPilihanStokId, setSatuanPilihanStokId] = useState(() => {
    return listSatuan.find((satuan) => satuan.isBase)?.idSatuan || listSatuan[0]?.idSatuan || '';
  });

  const [inputKuantitasStok, setInputKuantitasStok] = useState(() => {
    if (!fitur.ubahStok || !dataAwal) return 0;
    return roundPreciseQuantity(Number(dataAwal.stokUtama) || 0);
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

  const satuanDasarAktif = listSatuan.find((satuan) => satuan.isBase) || listSatuan[0];
  const listSatuanDenganHarga = listSatuan.map((satuan) => ({
    ...satuan,
    rasio: satuan.isBase ? 1 : satuan.rasio === '' ? '' : Number(satuan.rasio) || 1,
    hargaBeli: satuan.isBase
      ? Number(satuan.hargaBeli) || 0
      : hitungHargaBeliSatuan(
          satuanDasarAktif?.hargaBeli,
          satuanDasarAktif?.rasio || 1,
          satuan.rasio
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
    const hargaBeliAcuan = listSatuan.find(
      (satuan) => satuan.idSatuan === idSatuan
    )?.hargaBeli;

    setListSatuan(
      normalisasiRasioSatuan(listSatuan, idSatuan).map((satuan) => {
        const rasioSebelumnya = listSatuan.find(
          (item) => item.idSatuan === satuan.idSatuan
        )?.rasio;
        return {
          ...satuan,
          ...(satuan.idSatuan === idSatuan && { hargaBeli: hargaBeliAcuan }),
          ...(!satuan.isBase && rasioSebelumnya === '' && { rasio: '' })
        };
      })
    );
  };

  const hapusSatuan = (index) => {
    if (listSatuan[index].isBase || listSatuan.length === 1) return;
    if (
      Number(dataAwal?.stokUtama) > 0 &&
      listSatuan[index].idSatuan === idSatuanDasarAwal
    ) {
      alert('Satuan dasar lama tidak dapat dihapus saat stok produk masih tersedia.');
      return;
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

  const satuanStokTerpilih = listSatuan.find((s) => s.idSatuan === satuanPilihanStokId) || listSatuan[0];
  const rasioStokTerpilih = satuanStokTerpilih?.rasio || 1;

  const totalStokUtamaHitung = fitur.ubahStok
    ? hitungStokUtama(inputKuantitasStok, rasioStokTerpilih)
    : Number(dataAwal?.stokUtama) || 0;
  const rasioSatuanDasarAwalSaatIni =
    listSatuan.find((satuan) => satuan.idSatuan === idSatuanDasarAwal)?.rasio || 1;
  const stokAwalTerkonversi = hitungStokUtama(
    dataAwal?.stokUtama || 0,
    rasioSatuanDasarAwalSaatIni
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const namaSatuanDasar = satuanDasarAktif?.namaSatuan || 'Pcs';

    const dataForm = {
      ...(dataAwal?.idProduk && { idProduk: dataAwal.idProduk }),
      namaProduk,
      kategori,
      punyaVarian,
      varian: punyaVarian ? normalisasiVarianProduk(inputVarian) : [],
      stokUtama: fitur.ubahStok
        ? totalStokUtamaHitung
        : stokAwalTerkonversi,
      satuanTerkecil: namaSatuanDasar,
      listSatuan: normalisasiRasioSatuan(
        listSatuanDenganHarga,
        satuanDasarAktif?.idSatuan
      ).map((satuan) => ({
        ...satuan,
        hargaBeli: Number(satuan.hargaBeli) || 0,
        hargaJual: Number(satuan.hargaJual) || 0,
        rasio: satuan.isBase
          ? 1
          : Number.isFinite(Number(satuan.rasio)) && Number(satuan.rasio) > 0
            ? Number(satuan.rasio)
            : 1
      }))
    };
    onSubmit(dataForm);
  };

  const namaSatuanDasar = satuanDasarAktif?.namaSatuan || 'Pcs';

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
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {labelPosisi}{!isBaseItem && !rasioBelumDiisi && ` (${rasio}×)`}
                  </span>
                  <div className="flex items-center gap-3">
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
                    disabled={!isBaseItem}
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

        {fitur.lihatStok && (
        <div className="border-t pt-4 space-y-2 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-800">
            Input Stok Awal
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Jumlah Kuantitas Fisik"
              type="number"
              min="0"
              step="0.001"
              placeholder="Contoh: 10"
              value={inputKuantitasStok}
              onChange={(e) => setInputKuantitasStok(e.target.value)}
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
              {inputKuantitasStok || 0} {satuanStokTerpilih?.namaSatuan} × {rasioStokTerpilih} = {totalStokUtamaHitung} {namaSatuanDasar}
            </span>
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