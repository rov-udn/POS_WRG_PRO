export const cekPotensiRugiSatuan = (produk) => {
  if (!Array.isArray(produk?.listSatuan)) return false;

  return produk.listSatuan.some(
    (satuan) => satuan?.hargaJual <= satuan?.hargaBeli
  );
};

export const filterProdukRugi = (daftarProduk = []) => {
  return daftarProduk.filter(cekPotensiRugiSatuan);
};

export const filterProdukKurangLengkap = (daftarProduk = []) => {
  return daftarProduk.filter((produk) => {
    const kategoriKosong = typeof produk?.kategori !== 'string'
      || produk.kategori.trim() === '';
    const satuanTidakLengkap = !Array.isArray(produk?.listSatuan)
      || produk.listSatuan.length === 0
      || produk.listSatuan.some((satuan) => {
        const hargaBeli = Number(satuan?.hargaBeli);
        const hargaJual = Number(satuan?.hargaJual);

        return !Number.isFinite(hargaBeli)
          || hargaBeli <= 0
          || !Number.isFinite(hargaJual)
          || hargaJual <= 0;
      });

    return kategoriKosong || satuanTidakLengkap;
  });
};
