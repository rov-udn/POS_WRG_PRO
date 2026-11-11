const DAFTAR_SHORTCUT = [
  {
    tombol: ['F1', 'Ctrl+F'],
    keterangan: 'Memfokuskan kolom pencarian produk atau input scanner.',
    catatan: 'Ctrl+F juga berlaku dengan tombol Command di Mac.'
  },
  {
    tombol: ['F2'],
    keterangan: 'Membuka jendela pembayaran saat keranjang berisi item, atau mengonfirmasi pembayaran ketika jendela pembayaran aktif.'
  },
  {
    tombol: ['Enter'],
    keterangan: 'Memindai barcode dari kolom pencarian atau mengonfirmasi pembayaran saat fokus berada di input nominal.'
  },
  {
    tombol: ['Escape (Esc)'],
    keterangan: 'Menutup modal yang sedang aktif, seperti nota, pembayaran, atau daftar draf.'
  },
  {
    tombol: ['F4'],
    keterangan: 'Mengosongkan keranjang setelah konfirmasi.'
  }
];

function TombolShortcut({ tombol }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tombol.map((label) => (
        <kbd
          key={label}
          className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          {label}
        </kbd>
      ))}
    </div>
  );
}

export default function PanduanShortcutKeyboard() {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700 sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Panduan Shortcut Keyboard
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Tombol pintasan berikut sudah diatur secara default agar langsung pas dan nyaman
          dipakai untuk operasional harian di warung.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-700/70 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold sm:px-5">Tombol</th>
              <th scope="col" className="px-4 py-3 font-semibold sm:px-5">Fungsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {DAFTAR_SHORTCUT.map(({ tombol, keterangan, catatan }) => (
              <tr key={tombol.join('-')} className="align-top">
                <th scope="row" className="px-4 py-3 font-medium sm:px-5">
                  <TombolShortcut tombol={tombol} />
                </th>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-200 sm:px-5">
                  {keterangan}
                  {catatan && (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {catatan}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100 sm:px-5">
        Catatan: Shortcut F-key bekerja saat halaman Kasir aktif dan tidak sedang mengetik
        di kolom teks biasa. Enter tetap digunakan untuk input scanner; di modal pembayaran
        Enter pada nominal digunakan untuk konfirmasi.
      </p>
    </section>
  );
}
