import { useState } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';

const PESAN_ERROR_AUTENTIKASI = {
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/invalid-credential': 'Email atau kata sandi salah.',
  'auth/user-not-found': 'Akun dengan email tersebut tidak ditemukan.',
  'auth/wrong-password': 'Email atau kata sandi salah.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa jaringan Anda.',
  'auth/operation-not-allowed': 'Pendaftaran email dan kata sandi belum diaktifkan.',
  'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
  'auth/weak-password': 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.',
  'auth/missing-email': 'Masukkan email akun Anda.',
  'permission-denied': 'Tidak dapat menyimpan profil akun. Periksa izin Firestore.',
  'unavailable': 'Layanan sedang tidak tersedia. Periksa koneksi lalu coba lagi.'
};

export default function LoginPage({ onLoginBerhasil }) {
  const [mode, setMode] = useState('login');
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [konfirmasiKataSandi, setKonfirmasiKataSandi] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState('');
  const [resetPasswordAktif, setResetPasswordAktif] = useState(false);
  const [sedangMengirimReset, setSedangMengirimReset] = useState(false);
  const [pesanResetPassword, setPesanResetPassword] = useState('');
  const [pesanErrorResetPassword, setPesanErrorResetPassword] = useState('');

  const tanganiResetKataSandi = async (event) => {
    event.preventDefault();
    setPesanResetPassword('');
    setPesanErrorResetPassword('');

    const emailReset = email.trim();
    if (!emailReset) {
      setPesanErrorResetPassword('Masukkan email akun yang ingin dipulihkan.');
      return;
    }

    setSedangMengirimReset(true);
    try {
      await sendPasswordResetEmail(auth, emailReset);
      setPesanResetPassword(
        'Tautan pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.'
      );
    } catch (error) {
      console.error('Gagal mengirim tautan reset kata sandi:', error);
      setPesanErrorResetPassword(
        PESAN_ERROR_AUTENTIKASI[error.code]
          || 'Tautan pemulihan gagal dikirim. Silakan periksa email dan coba lagi.'
      );
    } finally {
      setSedangMengirimReset(false);
    }
  };

  const tanganiPengiriman = async (event) => {
    event.preventDefault();
    setPesanError('');

    if (mode === 'daftar' && kataSandi !== konfirmasiKataSandi) {
      setPesanError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSedangMemuat(true);
    let penggunaBaru;
    let profilTersimpan = false;

    try {
      await setPersistence(auth, browserLocalPersistence);
      let hasilLogin;

      if (mode === 'daftar') {
        hasilLogin = await createUserWithEmailAndPassword(auth, email, kataSandi);
        penggunaBaru = hasilLogin.user;

        await setDoc(doc(db, 'users', penggunaBaru.uid), {
          uid: penggunaBaru.uid,
          email: penggunaBaru.email,
          nama: nama.trim(),
          role: 'admin',
          store_id: penggunaBaru.uid,
          status: 'pending'
        });
        profilTersimpan = true;

        await signOut(auth);
        setPesanError('Akun Anda masih menunggu persetujuan dari Super Admin.');
        return;
      } else {
        hasilLogin = await signInWithEmailAndPassword(auth, email, kataSandi);

        // Pengecekan status akun di Firestore
        const userDocRef = doc(db, 'users', hasilLogin.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.status === 'pending') {
            await signOut(auth);
            setPesanError('Akun Anda masih menunggu persetujuan dari Super Admin.');
            setSedangMemuat(false);
            return;
          }
        }
      }

      onLoginBerhasil?.(hasilLogin.user);
    } catch (error) {
      console.error('Error Auth:', error);
      if (penggunaBaru && !profilTersimpan) {
        try {
          await deleteUser(penggunaBaru);
        } catch (errorPenghapusan) {
          console.error('Gagal membatalkan pendaftaran akun:', errorPenghapusan);
        } finally {
          await signOut(auth);
        }
      }
      setPesanError(
        PESAN_ERROR_AUTENTIKASI[error.code]
          || (mode === 'daftar'
            ? 'Pendaftaran gagal. Silakan coba lagi.'
            : 'Login gagal. Silakan coba lagi.')
      );
    } finally {
      setSedangMemuat(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">POS Warung</h1>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'daftar' ? 'Buat akun admin baru' : 'Masuk ke akun Anda'}
          </p>
        </div>

        <form className="space-y-5" onSubmit={tanganiPengiriman}>
          {mode === 'daftar' && (
            <div className="space-y-2">
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
                Nama Lengkap / Nama Warung
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                autoComplete="name"
                required
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                placeholder="Masukkan nama lengkap atau toko"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="kata-sandi" className="block text-sm font-medium text-gray-700">
              Kata sandi
            </label>
            <input
              id="kata-sandi"
              name="kata-sandi"
              type="password"
              autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
              required
              value={kataSandi}
              onChange={(event) => setKataSandi(event.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {mode === 'daftar' && (
            <div className="space-y-2">
              <label htmlFor="konfirmasi-kata-sandi" className="block text-sm font-medium text-gray-700">
                Konfirmasi kata sandi
              </label>
              <input
                id="konfirmasi-kata-sandi"
                name="konfirmasi-kata-sandi"
                type="password"
                autoComplete="new-password"
                required
                value={konfirmasiKataSandi}
                onChange={(event) => setKonfirmasiKataSandi(event.target.value)}
                placeholder="Masukkan kembali kata sandi"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {pesanError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {pesanError}
            </p>
          )}

          <button
            type="submit"
            disabled={sedangMemuat}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sedangMemuat
              ? (mode === 'daftar' ? 'Sedang mendaftar...' : 'Sedang masuk...')
              : (mode === 'daftar' ? 'Daftar Sebagai Admin' : 'Masuk')}
          </button>

          {mode === 'login' && (
            <div className="text-center">
              <button
                type="button"
                disabled={sedangMemuat || sedangMengirimReset}
                onClick={() => {
                  setResetPasswordAktif((aktif) => !aktif);
                  setPesanResetPassword('');
                  setPesanErrorResetPassword('');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Lupa Kata Sandi?
              </button>
            </div>
          )}
        </form>

        {mode === 'login' && resetPasswordAktif && (
          <form
            className="mt-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-left"
            onSubmit={tanganiResetKataSandi}
          >
            <label htmlFor="email-reset" className="block text-sm font-medium text-gray-700">
              Email akun yang ingin dipulihkan
            </label>
            <input
              id="email-reset"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {pesanErrorResetPassword && (
              <p role="alert" className="text-sm text-red-700">
                {pesanErrorResetPassword}
              </p>
            )}
            {pesanResetPassword && (
              <p role="status" className="text-sm text-green-700">
                {pesanResetPassword}
              </p>
            )}
            <button
              type="submit"
              disabled={sedangMengirimReset}
              className="w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sedangMengirimReset ? 'Mengirim tautan...' : 'Kirim tautan pemulihan'}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-gray-600">
          {mode === 'daftar' ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button
            type="button"
            disabled={sedangMemuat}
            onClick={() => {
              setMode(mode === 'daftar' ? 'login' : 'daftar');
              setPesanError('');
              setResetPasswordAktif(false);
              setPesanResetPassword('');
              setPesanErrorResetPassword('');
            }}
            className="font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed"
          >
            {mode === 'daftar' ? 'Masuk' : 'Daftar'}
          </button>
        </p>
      </section>
    </main>
  );
}