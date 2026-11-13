import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import AppLayout from '../components/Layout/AppLayout';
import LoginPage from '../components/Layout/LoginPage';
import { auth } from '../constants/firebaseConfig';
import ProdukPage from '../features/produk/produkPage';
import GudangPage from '../features/gudang/GudangPage';
import KasirPage from '../features/kasir/KasirPage';
import BelanjaPage from '../features/belanja/BelanjaPage';
import RiwayatPage from '../features/riwayat/RiwayatPage';
import LaporanPage from '../features/laporan/LaporanPage';
import SettingPage from '../features/setting/settingPage';
import ApprovalPage from '../features/setting/ApprovalPage';
import useUserProfile from '../features/setting/hooks/useUserProfile';

const MENU_ADMIN = ['produk', 'gudang', 'kasir', 'belanja', 'history', 'laporan', 'setting'];
const MENU_KARYAWAN = ['kasir', 'history', 'setting'];
const MENU_SUPER_ADMIN = [...MENU_ADMIN, 'approval'];

export default function App() {
  const [menuAktif, setMenuAktif] = useState('produk');
  const [pesanErrorKeluar, setPesanErrorKeluar] = useState('');
  const { pengguna, profil, role, sedangMemuat, pesanError } = useUserProfile();

  const tanganiKeluar = async () => {
    setPesanErrorKeluar('');

    try {
      await signOut(auth);
      return true;
    } catch {
      setPesanErrorKeluar('Gagal keluar. Silakan coba lagi.');
      return false;
    }
  };

  const daftarMenuDiizinkan = role === 'super_admin'
    ? MENU_SUPER_ADMIN
    : role === 'admin'
    ? MENU_ADMIN
    : role === 'karyawan'
      ? MENU_KARYAWAN
      : [];
  const menuAwal = role === 'karyawan' ? 'kasir' : 'produk';
  const menuEfektif = daftarMenuDiizinkan.includes(menuAktif)
    ? menuAktif
    : menuAwal;

  const tanganiPilihMenu = (menu) => {
    if (daftarMenuDiizinkan.includes(menu)) setMenuAktif(menu);
  };

  const renderHalaman = () => {
    switch (menuEfektif) {
      case 'belanja':
        return <BelanjaPage key={profil.store_id} storeId={profil.store_id} />;
      case 'kasir':
        return <KasirPage profil={profil} pengguna={pengguna} />;
      case 'produk':
        return <ProdukPage key={profil.store_id} storeId={profil.store_id} />;
      case 'gudang':
        return <GudangPage key={profil.store_id} role={role} storeId={profil.store_id} />;
      case 'history':
        return <RiwayatPage profil={profil} pengguna={pengguna} />;
      case 'laporan':
        return <LaporanPage role={role} />;
      case 'setting':
        return (
          <SettingPage
            profil={profil}
            role={role}
            sedangMemuatProfil={sedangMemuat}
            pesanErrorProfil={pesanError}
          />
        );
      case 'approval':
        return <ApprovalPage />;
      default:
        return (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500 shadow-sm">
            <h2 className="text-lg font-bold text-gray-700 mb-2">Fitur Belum Tersedia</h2>
            <p className="text-sm">Halaman ini sedang dalam tahap pengembangan.</p>
          </div>
        );
    }
  };

  if (sedangMemuat) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Memuat aplikasi...</p>
      </main>
    );
  }

  if (!pengguna) {
    return <LoginPage />;
  }

  if (!profil || !daftarMenuDiizinkan.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <section className="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p role="alert" className="text-sm text-red-700">
            {profil?.status === 'pending'
              ? 'Akun Anda masih menunggu persetujuan Super Admin.'
              : pesanError || 'Profil atau role akun tidak valid. Hubungi admin toko.'}
          </p>
          <button
            type="button"
            onClick={tanganiKeluar}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Keluar
          </button>
          {pesanErrorKeluar && (
            <p role="alert" className="text-sm text-red-700">{pesanErrorKeluar}</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <AppLayout
      menuAktif={menuEfektif}
      onPilihMenu={tanganiPilihMenu}
      daftarMenuDiizinkan={daftarMenuDiizinkan}
      profil={profil}
      pengguna={pengguna}
      onKeluar={tanganiKeluar}
    >
      {pesanErrorKeluar && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {pesanErrorKeluar}
        </p>
      )}
      {renderHalaman()}
    </AppLayout>
  );
}