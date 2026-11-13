import useManajemenKaryawan from './hooks/useManajemenKaryawan';

const LABEL_ROLE = {
  admin: 'Admin',
  karyawan: 'Karyawan',
  super_admin: 'Super Admin'
};

export default function ApprovalPage() {
  const {
    daftarPendaftaranPending,
    sedangMemuatPendaftaran,
    akunDiproses,
    pesanErrorPendaftaran,
    pesanSuksesPendaftaran,
    muatPendaftaranPending,
    setujuiPendaftaran,
    hapusPendaftaranPending
  } = useManajemenKaryawan(undefined, 'super_admin');

  const tolakPendaftaran = (akun) => {
    const identitas = akun.nama || akun.email || 'akun ini';
    if (window.confirm(`Tolak dan hapus pendaftaran ${identitas}?`)) {
      hapusPendaftaranPending(akun);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Manajemen akun
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Approval</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tinjau dan proses pendaftaran akun baru.
          </p>
        </div>
        <button
          type="button"
          onClick={muatPendaftaranPending}
          disabled={sedangMemuatPendaftaran}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <span aria-hidden="true">↻</span>
          Muat ulang
        </button>
      </header>

      {pesanErrorPendaftaran && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{pesanErrorPendaftaran}</p>
          <button
            type="button"
            onClick={muatPendaftaranPending}
            disabled={sedangMemuatPendaftaran}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            Coba lagi
          </button>
        </div>
      )}

      {pesanSuksesPendaftaran && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {pesanSuksesPendaftaran}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Pendaftaran menunggu</h2>
            <p className="mt-1 text-sm text-gray-500">
              Akun belum dapat masuk sampai disetujui.
            </p>
          </div>
          {!sedangMemuatPendaftaran && !pesanErrorPendaftaran && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              {daftarPendaftaranPending.length}
            </span>
          )}
        </div>

        {sedangMemuatPendaftaran ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 px-5 py-14 text-sm text-gray-600"
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"
            />
            Memuat daftar pendaftaran...
          </div>
        ) : pesanErrorPendaftaran ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            Data pendaftaran belum dapat ditampilkan.
          </div>
        ) : daftarPendaftaranPending.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-2xl text-green-700"
            >
              ✓
            </span>
            <h3 className="mt-4 font-semibold text-gray-900">
              Belum ada pendaftaran akun baru
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Pendaftaran yang membutuhkan persetujuan akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Nama</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Role yang diminta</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daftarPendaftaranPending.map((akun) => (
                  <tr key={akun.uid} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                      {akun.nama || 'Nama belum tersedia'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {akun.email || 'Email belum tersedia'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                        {LABEL_ROLE[akun.role] || akun.role || 'Tidak ditentukan'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Menunggu persetujuan
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={akunDiproses === akun.uid}
                          onClick={() => setujuiPendaftaran(akun)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span aria-hidden="true">✓</span>
                          {akunDiproses === akun.uid ? 'Memproses...' : 'Setuju'}
                        </button>
                        <button
                          type="button"
                          disabled={akunDiproses === akun.uid}
                          onClick={() => tolakPendaftaran(akun)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span aria-hidden="true">×</span>
                          {akunDiproses === akun.uid ? 'Memproses...' : 'Tolak'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-gray-500">
        Menolak pendaftaran menghapus profil Firestore. Kredensial Firebase Authentication
        tidak dihapus dari aplikasi klien.
      </p>
    </section>
  );
}
