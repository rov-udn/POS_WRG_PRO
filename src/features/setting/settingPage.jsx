import { useState } from 'react';
import AkunKeamananSection from './components/AkunKeamananSection';
import BackupRestoreSection from './components/BackupRestoreSection';
import PajakLayananForm from './components/PajakLayananForm';
import PerangkatKasirForm from './components/PerangkatKasirForm';
import ProfilTokoForm from './components/ProfilTokoForm';
import PanduanShortcutKeyboard from './components/PanduanShortcutKeyboard';
import StrukNotaForm from './components/StrukNotaForm';
import TentangAplikasi from './components/TentangAplikasi';
import TambahKaryawanForm from './components/TambahKaryawanForm';
import PengaturanQuickButton from './components/PengaturanQuickButton';

const MENU_SETTING = [
  {
    id: 'profil',
    judul: 'Profil Toko',
    deskripsi: 'Atur nama, alamat, dan nomor telepon warung.',
    ikon: '🏪'
  },
  {
    id: 'nota',
    judul: 'Struk & Nota',
    deskripsi: 'Atur ukuran kertas, footer, dan logo nota.',
    ikon: '🧾'
  },
  {
    id: 'pajakLayanan',
    judul: 'Pajak & Biaya Layanan',
    deskripsi: 'Atur persentase pajak dan biaya layanan opsional.',
    ikon: '％'
  },
  {
    id: 'perangkat',
    judul: 'Perangkat Kasir',
    deskripsi: 'Atur printer thermal, lebar kertas, dan scanner.',
    ikon: '🖨️'
  },
  {
    id: 'quickButtons',
    judul: 'Tombol Cepat Eceran',
    deskripsi: 'Kelola nama, harga, dan target tombol cepat pada halaman Kasir.',
    ikon: '⚡'
  },
  {
    id: 'shortcut',
    judul: 'Panduan Shortcut Keyboard',
    deskripsi: 'Lihat tombol pintasan untuk mempercepat transaksi kasir.',
    ikon: '⌨️'
  },
  {
    id: 'keamanan',
    judul: 'Akun & Keamanan',
    deskripsi: 'Informasi pengaturan kata sandi dan keamanan akses.',
    ikon: '🔒'
  },
  {
    id: 'karyawan',
    judul: 'Manajemen Karyawan',
    deskripsi: 'Buat akun karyawan untuk toko Anda.',
    ikon: '👥'
  },
  {
    id: 'backup',
    judul: 'Backup & Pemulihan',
    deskripsi: 'Impor dan ekspor data aplikasi.',
    ikon: '🗄️'
  },
  {
    id: 'tentang',
    judul: 'Tentang Aplikasi',
    deskripsi: 'Informasi aplikasi POS Warung Pro dan versinya.',
    ikon: 'ℹ️'
  }
];

const MENU_SETTING_KARYAWAN = new Set([
  'nota',
  'perangkat',
  'shortcut',
  'tentang'
]);

function renderSubMenu(activeMenu, profil, roleAktif) {
  switch (activeMenu) {
    case 'profil':
      return <ProfilTokoForm />;
    case 'nota':
      return <StrukNotaForm />;
    case 'pajakLayanan':
      return <PajakLayananForm />;
    case 'perangkat':
      return <PerangkatKasirForm />;
    case 'quickButtons':
      if (roleAktif !== 'admin') return null;
      return <PengaturanQuickButton />;
    case 'shortcut':
      return <PanduanShortcutKeyboard />;
    case 'keamanan':
      return <AkunKeamananSection />;
    case 'karyawan':
      if (roleAktif !== 'admin') return null;
      if (!profil.store_id) {
        return (
          <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            ID Toko admin tidak tersedia. Akun karyawan belum dapat dibuat.
          </p>
        );
      }
      return <TambahKaryawanForm storeId={profil.store_id} />;
    case 'backup':
      return <BackupRestoreSection />;
    case 'tentang':
      return <TentangAplikasi />;
    default:
      return null;
  }
}

export default function SettingPage({
  profil,
  role,
  sedangMemuatProfil,
  pesanErrorProfil
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const roleAktif = String(role || profil?.role || '').trim().toLowerCase();
  const daftarMenu = MENU_SETTING.filter((menu) => (
    roleAktif === 'admin'
      ? true
      : MENU_SETTING_KARYAWAN.has(menu.id)
  ));
  const menuAktif = daftarMenu.find((menu) => menu.id === activeMenu);

  return (
    <div className="space-y-6">
      {pesanErrorProfil && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {pesanErrorProfil}
        </p>
      )}
      {sedangMemuatProfil && (
        <p role="status" className="text-sm text-gray-500">
          Memuat profil pengguna...
        </p>
      )}
      {!menuAktif ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola preferensi toko dan perangkat POS Anda.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {daftarMenu.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveMenu(menu.id)}
                className="group flex min-h-40 flex-col items-start rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <span
                  aria-hidden="true"
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700 transition group-hover:bg-blue-100"
                >
                  {menu.ikon}
                </span>
                <span className="font-semibold text-gray-900">{menu.judul}</span>
                <span className="mt-1 text-sm leading-5 text-gray-500">{menu.deskripsi}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setActiveMenu(null)}
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            ← Kembali ke Menu Pengaturan
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{menuAktif.judul}</h1>
            <p className="mt-1 text-sm text-gray-500">{menuAktif.deskripsi}</p>
          </div>
          {renderSubMenu(activeMenu, profil, roleAktif)}
          {activeMenu !== 'backup' && activeMenu !== 'keamanan' && activeMenu !== 'karyawan' && activeMenu !== 'shortcut' && activeMenu !== 'tentang' && activeMenu !== 'quickButtons' && (
            <p role="status" className="text-xs text-gray-500">
              Perubahan disimpan otomatis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
