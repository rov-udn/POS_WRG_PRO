import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { auth } from '../../../constants/firebaseConfig';
import { Field, SectionCard, TextInput } from './SettingFormFields';

const PESAN_ERROR_KATA_SANDI = {
  'auth/invalid-credential': 'Kata sandi saat ini tidak sesuai.',
  'auth/wrong-password': 'Kata sandi saat ini tidak sesuai.',
  'auth/weak-password': 'Kata sandi baru terlalu lemah. Gunakan minimal 6 karakter.',
  'auth/requires-recent-login': 'Sesi Anda sudah terlalu lama. Silakan keluar lalu masuk kembali.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa jaringan Anda.',
  'auth/operation-not-allowed': 'Perubahan kata sandi belum diaktifkan untuk akun ini.'
};

export default function AkunKeamananSection() {
  const user = auth.currentUser;
  const [kataSandiSaatIni, setKataSandiSaatIni] = useState('');
  const [kataSandiBaru, setKataSandiBaru] = useState('');
  const [konfirmasiKataSandiBaru, setKonfirmasiKataSandiBaru] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');

  const dapatMengubahKataSandi = Boolean(
    user?.email && user.providerData.some((penyedia) => penyedia.providerId === 'password')
  );

  const tanganiUbahKataSandi = async (event) => {
    event.preventDefault();
    setPesanError('');
    setPesanSukses('');

    if (kataSandiBaru !== konfirmasiKataSandiBaru) {
      setPesanError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (!user || !dapatMengubahKataSandi) {
      setPesanError('Akun ini tidak mendukung perubahan kata sandi melalui email.');
      return;
    }

    setSedangMemuat(true);

    try {
      const kredensial = EmailAuthProvider.credential(user.email, kataSandiSaatIni);
      await reauthenticateWithCredential(user, kredensial);
      await updatePassword(user, kataSandiBaru);
      setKataSandiSaatIni('');
      setKataSandiBaru('');
      setKonfirmasiKataSandiBaru('');
      setPesanSukses('Kata sandi berhasil diperbarui.');
    } catch (error) {
      setPesanError(
        PESAN_ERROR_KATA_SANDI[error.code]
          || 'Kata sandi gagal diperbarui. Silakan periksa data dan coba lagi.'
      );
    } finally {
      setSedangMemuat(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Informasi akun">
        {user ? (
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email akun</dt>
              <dd className="mt-1 break-all text-sm text-gray-900">{user.email || 'Tidak tersedia'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ID Toko (UID akun)</dt>
              <dd className="mt-1 break-all font-mono text-sm text-gray-900">
                {user.uid}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-600">
            Informasi akun tidak tersedia. Silakan masuk kembali.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Ubah kata sandi">
        {!dapatMengubahKataSandi && user && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Akun ini tidak menggunakan metode masuk email dan kata sandi, sehingga kata sandi tidak dapat diubah di sini.
          </p>
        )}

        <form className="space-y-4" onSubmit={tanganiUbahKataSandi}>
          <Field label="Kata sandi saat ini">
            <TextInput
              type="password"
              autoComplete="current-password"
              required
              disabled={!dapatMengubahKataSandi || sedangMemuat}
              value={kataSandiSaatIni}
              onChange={(event) => setKataSandiSaatIni(event.target.value)}
              placeholder="Masukkan kata sandi saat ini"
            />
          </Field>

          <Field label="Kata sandi baru">
            <TextInput
              type="password"
              autoComplete="new-password"
              required
              disabled={!dapatMengubahKataSandi || sedangMemuat}
              value={kataSandiBaru}
              onChange={(event) => setKataSandiBaru(event.target.value)}
              placeholder="Masukkan kata sandi baru"
            />
          </Field>

          <Field label="Konfirmasi kata sandi baru">
            <TextInput
              type="password"
              autoComplete="new-password"
              required
              disabled={!dapatMengubahKataSandi || sedangMemuat}
              value={konfirmasiKataSandiBaru}
              onChange={(event) => setKonfirmasiKataSandiBaru(event.target.value)}
              placeholder="Masukkan kembali kata sandi baru"
            />
          </Field>

          {pesanError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {pesanError}
            </p>
          )}
          {pesanSukses && (
            <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {pesanSukses}
            </p>
          )}

          <button
            type="submit"
            disabled={!dapatMengubahKataSandi || sedangMemuat}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sedangMemuat ? 'Memperbarui kata sandi...' : 'Simpan kata sandi baru'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
