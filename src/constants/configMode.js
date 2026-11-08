export const KUNCI_STORAGE_MODE = 'pos_warung_mode_aplikasi';

export const ATURAN_MODE = {
  simple: {
    lihatStok: false,
    ubahStok: false,
    validasiStok: false,
    kirimAntreanRestock: false,
    ubahHargaBeli: true
  },
  full: {
    lihatStok: true,
    ubahStok: true,
    validasiStok: true,
    kirimAntreanRestock: true,
    ubahHargaBeli: true
  }
};
