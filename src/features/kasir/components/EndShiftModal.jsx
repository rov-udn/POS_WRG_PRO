import React, { useEffect, useRef, useState } from 'react';
import BaseModal from '../../../components/ui/BaseModal';

const PECAHAN_UANG = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
const PESAN_BERHASIL =
  'Shift berhasil ditutup. Data rekonsiliasi kas telah terkunci dan dikirim ke Laporan Admin.';

function formatRupiah(nilai) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(nilai);
}

export default function EndShiftModal({ isOpen, onClose, onLogout, onSimpan }) {
  const [modeHitung, setModeHitung] = useState('total');
  const [totalFisik, setTotalFisik] = useState('');
  const [jumlahPecahan, setJumlahPecahan] = useState({});
  const [pesanError, setPesanError] = useState('');
  const [berhasil, setBerhasil] = useState(false);
  const [gagalLogout, setGagalLogout] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const totalHitungan = modeHitung === 'total'
    ? Number(totalFisik)
    : PECAHAN_UANG.reduce(
      (total, pecahan) => total + pecahan * (Number(jumlahPecahan[pecahan]) || 0),
      0
    );

  const ubahPecahan = (pecahan, nilai) => {
    setJumlahPecahan((sebelumnya) => ({ ...sebelumnya, [pecahan]: nilai }));
  };

  const simpanShift = async (event) => {
    event.preventDefault();
    const inputTidakValid = modeHitung === 'total'
      ? totalFisik === '' || !Number.isSafeInteger(totalHitungan) || totalHitungan < 0
      : Object.values(jumlahPecahan).some(
        (nilai) => nilai !== '' && (!Number.isSafeInteger(Number(nilai)) || Number(nilai) < 0)
      );

    if (inputTidakValid || !Number.isSafeInteger(totalHitungan) || totalHitungan < 0) {
      setPesanError('Masukkan jumlah uang fisik yang valid.');
      return;
    }

    setPesanError('');
    try {
      await onSimpan(totalHitungan);
      setBerhasil(true);
      timerRef.current = window.setTimeout(async () => {
        const logoutBerhasil = await onLogout();
        if (!logoutBerhasil) setGagalLogout(true);
      }, 1200);
    } catch (error) {
      console.error('Gagal mengunci rekap penutupan shift:', error);
      setPesanError('Shift gagal ditutup. Periksa penyimpanan lalu coba kembali.');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={berhasil ? () => {} : onClose}
      title={berhasil ? 'Shift Ditutup' : 'Tutup Shift'}
      subtitle={berhasil ? '' : 'Masukkan hasil hitung uang tunai fisik di laci.'}
      size="md"
    >
      {berhasil ? (
        <div className="space-y-4">
          <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium leading-6 text-green-800">
            {PESAN_BERHASIL}
          </p>
          {gagalLogout && (
            <p role="alert" className="text-sm text-red-700">
              Shift sudah ditutup, tetapi akun gagal keluar otomatis. Silakan coba tombol Keluar.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={simpanShift} className="space-y-5">
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setModeHitung('total')}
              className={`flex-1 rounded-md px-3 py-2 ${modeHitung === 'total' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
            >
              Input Total
            </button>
            <button
              type="button"
              onClick={() => setModeHitung('pecahan')}
              className={`flex-1 rounded-md px-3 py-2 ${modeHitung === 'pecahan' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
            >
              Hitung per Pecahan
            </button>
          </div>

          {modeHitung === 'total' ? (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-700">Total uang tunai fisik (Rp)</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={totalFisik}
                onChange={(event) => setTotalFisik(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Masukkan total hasil hitung"
                required
              />
            </label>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Jumlah lembar/keping uang fisik</p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {PECAHAN_UANG.map((pecahan) => (
                  <label key={pecahan} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
                    <span className="text-sm font-medium text-gray-700">{formatRupiah(pecahan)}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={jumlahPecahan[pecahan] || ''}
                      onChange={(event) => ubahPecahan(pecahan, event.target.value)}
                      className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right"
                      aria-label={`Jumlah pecahan ${formatRupiah(pecahan)}`}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {modeHitung === 'pecahan' && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              Total hitungan fisik: {formatRupiah(totalHitungan)}
            </p>
          )}
          {pesanError && <p role="alert" className="text-sm text-red-700">{pesanError}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Simpan &amp; Akhiri Shift
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
