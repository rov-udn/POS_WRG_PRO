import { useState } from 'react';
import { Field, SectionCard, TextInput } from './SettingFormFields';
import useTambahKaryawan from '../hooks/useTambahKaryawan';
import useManajemenKaryawan from '../hooks/useManajemenKaryawan';

const PESAN_ERROR_PENDAFTARAN = {
  'auth/email-already-in-use': 'Email ini sudah digunakan. Gunakan email lain.',
  'auth/weak-password': 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/operation-not-allowed': 'Pendaftaran email dan kata sandi belum diaktifkan.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa jaringan Anda.',
  'permission-denied': 'Anda tidak memiliki izin untuk membuat akun karyawan.',
  'unauthenticated': 'Sesi Anda berakhir. Silakan masuk kembali.',
  'unavailable': 'Layanan sedang tidak tersedia. Periksa koneksi lalu coba lagi.'
};

export default function TambahKaryawanForm({ storeId, role }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [pesanError, setPesanError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');
  const { tambahKaryawan, sedangMemuat } = useTambahKaryawan();
  const {
    daftarAkun,
    sedangMemuat: sedangMemuatDaftar,
    akunDiproses,
    pesanError: pesanErrorDaftar,
    pesanSukses: pesanSuksesDaftar,
    daftarPendaftaranPending,
    sedangMemuatPendaftaran,
    pesanErrorPendaftaran,
    pesanSuksesPendaftaran,
    muatAkun,
    ubahRole,
    hapusAkses,
    setujuiPendaftaran,
    hapusPendaftaranPending
  } = useManajemenKaryawan(storeId, role);

  const tanganiPendaftaran = async (event) => {
    event.preventDefault();
    setPesanError('');
    setPesanSukses('');

    try {
      await tambahKaryawan({ nama, email, kataSandi, storeId });
      setNama('');
      setEmail('');
      setKataSandi('');
      setPesanSukses('Akun karyawan berhasil dibuat.');
      await muatAkun({ clearError: true });
    } catch (error) {
      console.error('Gagal menambahkan karyawan:', error);
      setPesanError(
        PESAN_ERROR_PENDAFTARAN[error.code]
          || error.message
          || 'Akun karyawan gagal dibuat. Silakan coba lagi.'
      );
    }
  };

  if (role === 'super_admin') {
    return (
      <SectionCard title="Persetujuan pendaftaran akun">
        <p className="text-sm text-gray-600">
          Setujui akun agar dapat masuk ke aplikasi, atau hapus profil pendaftaran yang tidak dikenal.
        </p>

        {pesanErrorPendaftaran && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {pesanErrorPendaftaran}
          </p>
        )}
        {pesanSuksesPendaftaran && (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {pesanSuksesPendaftaran}
          </p>
        )}

        {sedangMemuatPendaftaran ? (
          <p role="status" className="text-sm text-gray-500">Memuat pendaftaran pending...</p>
        ) : pesanErrorPendaftaran ? null : daftarPendaftaranPending.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            Tidak ada pendaftaran yang menunggu persetujuan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-3 py-2">Nama</th>
                  <th scope="col" className="px-3 py-2">Email</th>
                  <th scope="col" className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daftarPendaftaranPending.map((akun) => (
                  <tr key={akun.uid}>
                    <td className="px-3 py-3 font-medium text-gray-800">
                      {akun.nama || '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{akun.email || '—'}</td>
                    <td className="space-x-2 px-3 py-3">
                      <button
                        type="button"
                        disabled={akunDiproses === akun.uid}
                        onClick={() => setujuiPendaftaran(akun)}
                        className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {akunDiproses === akun.uid ? 'Memproses...' : 'Setujui'}
                      </button>
                      <button
                        type="button"
                        disabled={akunDiproses === akun.uid}
                        onClick={() => {
                          const identitas = akun.nama || akun.email || 'akun ini';
                          if (window.confirm(
                            `Hapus profil pendaftaran ${identitas}? Kredensial Firebase Authentication tidak dihapus dari sini.`
                          )) {
                            hapusPendaftaranPending(akun);
                          }
                        }}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Tolak / Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs leading-5 text-gray-500">
          Tindakan hapus menghapus profil Firestore. Penghapusan kredensial Firebase Authentication
          memerlukan backend tepercaya dan tidak dilakukan oleh aplikasi klien ini.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Tambah karyawan">
        <form className="space-y-4" onSubmit={tanganiPendaftaran}>
          <Field label="Nama Lengkap">
            <TextInput
              type="text"
              autoComplete="name"
              required
              disabled={sedangMemuat}
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </Field>

          <Field label="Email">
            <TextInput
              type="email"
              autoComplete="email"
              required
              disabled={sedangMemuat}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
            />
          </Field>

          <Field label="Kata Sandi">
            <TextInput
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              disabled={sedangMemuat}
              value={kataSandi}
              onChange={(event) => setKataSandi(event.target.value)}
              placeholder="Masukkan kata sandi"
            />
          </Field>

          <Field label="Role">
            <select
              defaultValue="karyawan"
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800"
            >
              <option value="karyawan">Karyawan</option>
            </select>
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
            disabled={sedangMemuat}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sedangMemuat ? 'Membuat akun...' : 'Tambah Karyawan'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Akun toko">
        <p className="text-sm text-gray-600">
          Kelola role akun yang terhubung ke toko ini. Akun admin utama tidak ditampilkan
          dan tidak dapat dihapus dari daftar ini.
        </p>

        {pesanErrorDaftar && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {pesanErrorDaftar}
          </p>
        )}
        {pesanSuksesDaftar && (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {pesanSuksesDaftar}
          </p>
        )}

        {sedangMemuatDaftar ? (
          <p role="status" className="text-sm text-gray-500">Memuat daftar akun...</p>
        ) : pesanErrorDaftar ? null : daftarAkun.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            Belum ada akun tambahan untuk toko ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-3 py-2">Nama</th>
                  <th scope="col" className="px-3 py-2">Email</th>
                  <th scope="col" className="px-3 py-2">Role</th>
                  <th scope="col" className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daftarAkun.map((akun) => (
                  <tr key={akun.uid}>
                    <td className="px-3 py-3 font-medium text-gray-800">
                      {akun.nama || '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{akun.email || '—'}</td>
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Role untuk ${akun.nama || akun.email || akun.uid}`}
                        value={akun.role}
                        disabled={akunDiproses === akun.uid}
                        onChange={(event) => ubahRole(akun, event.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 disabled:opacity-60"
                      >
                        <option value="karyawan">Karyawan</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={akunDiproses === akun.uid}
                        onClick={() => {
                          const identitas = akun.nama || akun.email || 'akun ini';
                          if (window.confirm(
                            `Cabut akses aplikasi untuk ${identitas}? Kredensial Firebase Authentication tidak dihapus dari sini.`
                          )) {
                            hapusAkses(akun);
                          }
                        }}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {akunDiproses === akun.uid ? 'Memproses...' : 'Cabut akses'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs leading-5 text-gray-500">
          Mencabut akses menghapus profil akun dari Firestore sehingga akun tidak dapat
          menggunakan aplikasi. Penghapusan kredensial Firebase Authentication memerlukan
          backend tepercaya dan tidak dilakukan oleh aplikasi klien ini.
        </p>
      </SectionCard>
    </div>
  );
}
