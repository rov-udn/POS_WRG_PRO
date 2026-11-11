export const KUNCI_STORAGE_SHIFT = 'pos_warung_shift_data';
const KUNCI_STORAGE_TRANSAKSI = 'pos_warung_transactions';

function bacaDataShift() {
  const data = localStorage.getItem(KUNCI_STORAGE_SHIFT);
  if (!data) return { shiftAktif: {}, shiftTertutup: [] };

  const hasil = JSON.parse(data);
  if (
    !hasil ||
    typeof hasil !== 'object' ||
    !hasil.shiftAktif ||
    !Array.isArray(hasil.shiftTertutup)
  ) {
    throw new Error('Format data shift tidak valid.');
  }
  return hasil;
}

export function mulaiShiftJikaBelumAda(idKasir, namaKasir) {
  if (!idKasir) throw new Error('Identitas kasir tidak tersedia.');

  const dataShift = bacaDataShift();
  if (dataShift.shiftAktif[idKasir]) return dataShift.shiftAktif[idKasir];

  const shiftBaru = {
    idShift: `SHIFT-${Date.now()}-${idKasir}`,
    idKasir,
    namaKasir,
    mulai: new Date().toISOString(),
    cashStart: 0
  };
  dataShift.shiftAktif[idKasir] = shiftBaru;
  localStorage.setItem(KUNCI_STORAGE_SHIFT, JSON.stringify(dataShift));
  return shiftBaru;
}

export function tutupShift({ idKasir, cashActual }) {
  if (!idKasir || !Number.isSafeInteger(cashActual) || cashActual < 0) {
    throw new Error('Data penutupan shift tidak valid.');
  }

  const dataShift = bacaDataShift();
  const shiftAktif = dataShift.shiftAktif[idKasir];
  if (!shiftAktif) throw new Error('Shift aktif tidak ditemukan.');

  const transaksi = JSON.parse(localStorage.getItem(KUNCI_STORAGE_TRANSAKSI) || '[]');
  if (!Array.isArray(transaksi)) throw new Error('Format data transaksi tidak valid.');

  const waktuMulai = new Date(shiftAktif.mulai).getTime();
  const waktuTutup = Date.now();
  const transaksiShift = transaksi.filter((item) => {
    const waktuTransaksi = new Date(item.tanggal).getTime();
    return Number.isFinite(waktuTransaksi) && waktuTransaksi >= waktuMulai && waktuTransaksi <= waktuTutup;
  });

  const totalTunaiMasuk = transaksiShift.reduce((total, item) => {
    if (item.tipeTransaksi === 'RETUR_TUKAR') {
      return total + (Number(item.arusKasMasuk) || 0);
    }
    return total + (item.metodePembayaran === 'CASH' ? Number(item.totalBayar) || 0 : 0);
  }, 0);
  const kasKeluar = transaksiShift.reduce(
    (total, item) => total + (Number(item.arusKasKeluar) || 0),
    0
  );
  const cashExpected = shiftAktif.cashStart + totalTunaiMasuk - kasKeluar;
  const rekapShift = {
    idShift: shiftAktif.idShift,
    idKasir: shiftAktif.idKasir,
    namaKasir: shiftAktif.namaKasir,
    waktuMulai: shiftAktif.mulai,
    waktuTutup: new Date(waktuTutup).toISOString(),
    cashStart: shiftAktif.cashStart,
    totalTunaiMasuk,
    kasKeluar,
    cashExpected,
    cashActual,
    selisih: cashActual - cashExpected
  };

  dataShift.shiftTertutup = [rekapShift, ...dataShift.shiftTertutup];
  delete dataShift.shiftAktif[idKasir];
  localStorage.setItem(KUNCI_STORAGE_SHIFT, JSON.stringify(dataShift));
  return rekapShift;
}

export function ambilShiftTertutup() {
  return bacaDataShift().shiftTertutup;
}
