const INFORMASI_APLIKASI = [
  { label: 'Nama aplikasi', nilai: 'POS Warung Pro' },
  { label: 'Versi', nilai: 'v1.0.0 Stable' }
];

export default function TentangAplikasi() {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white p-5 dark:border-gray-700 dark:from-blue-950/50 dark:to-gray-800 sm:p-6">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-sm"
        >
          🏪
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            POS Warung Pro
          </h2>
          <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300">
            v1.0.0 Stable
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
          Aplikasi kasir yang dirancang khusus untuk membantu pencatatan transaksi,
          pengelolaan stok barang, dan mendukung operasional harian warung dengan lebih
          praktis.
        </p>

        <dl className="grid gap-3 sm:grid-cols-2">
          {INFORMASI_APLIKASI.map(({ label, nilai }) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700/50"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {nilai}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
