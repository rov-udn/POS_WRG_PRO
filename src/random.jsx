<div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Page */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk & Gudang</h1>
          <p className="text-sm text-gray-500">Kelola daftar barang, stok, dan harga berjenjang</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
        >
          {showForm ? '← Kembali ke Daftar Barang' : '+ Tambah Barang Baru'}
        </button>
      </div>

      {/* Tampilan Form Input / Tabel Daftar Barang */}
      {showForm ? (
        <ProductFormContainer onSaveProduct={handleAddProduct} />
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Daftar Stok Gudang ({products.length} Items)</h3>
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Belum ada data barang di gudang. Klik <strong>"+ Tambah Barang Baru"</strong> untuk menginput.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b">
                  <tr>
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Modal Agen</th>
                    <th className="p-3">Level Kemasan (Harga Jual)</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">{item.nama}</td>
                      <td className="p-3 text-gray-600">
                        <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-3 font-medium">
                        Rp {Number(item.modalAgen).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.satuans?.map((sat) => (
                            <span
                              key={sat.level}
                              className="text-xs border px-2 py-1 rounded bg-blue-50 text-blue-900 border-blue-200"
                            >
                              <strong>L{sat.level} ({sat.namaSatuan}):</strong> Rp{' '}
                              {Number(sat.hargaJual).toLocaleString('id-ID')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteProduct(item.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-xs"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>