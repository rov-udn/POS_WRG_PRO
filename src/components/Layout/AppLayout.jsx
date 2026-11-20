import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { AppModeProvider, useAppMode } from '../../hooks/useAppMode';
import useMenuNotifications from '../../hooks/useMenuNotifications';
import { useSettings } from '../../features/setting/hooks/useSettings';
import EndShiftModal from '../../features/kasir/components/EndShiftModal';
import { mulaiShiftJikaBelumAda, tutupShift } from '../../features/laporan/utils/shiftStorage';
import { sinkronkanProdukPending } from '../../lib/services/produkSyncService';
import { sinkronkanPenjualanPending } from '../../lib/services/transaksiSyncService';
import {
  bacaArrayStorageKasir,
  buatKunciStorageKasir,
  EVENT_TRANSAKSI_KASIR_DIPERBARUI
} from '../../features/kasir/utils/kasirStorage';

const DAFTAR_MENU = [
  { id: 'produk', label: 'Produk', ikon: '📦' },
  { id: 'gudang', label: 'Gudang', ikon: '🏬' },
  { id: 'kasir', label: 'Kasir', ikon: '🛒' },
  { id: 'belanja', label: 'Belanja', ikon: '📝' },
  { id: 'history', label: 'Riwayat', ikon: '📜' },
  { id: 'laporan', label: 'Laporan', ikon: '📊' },
  { id: 'setting', label: 'Pengaturan', ikon: '⚙️' },
  { id: 'approval', label: 'Approval', ikon: '✅' }
];
const PENANDA_BACK_KELUAR = '__posWrgDoubleBackExit';
const STATUS_SYNC_KOSONG = {
  pending: 0,
  syncing: 0,
  synced: 0,
  failed: 0,
  error: false
};

function bacaRingkasanSinkronisasi(kunciTransaksi, storeId) {
  try {
    const transaksi = bacaArrayStorageKasir(kunciTransaksi, 'Riwayat transaksi');
    return transaksi
      .filter((item) => item.store_id === storeId && item.tipeTransaksi !== 'RETUR_TUKAR')
      .reduce((ringkasan, item) => {
        if (Object.prototype.hasOwnProperty.call(ringkasan, item.statusSync)) {
          ringkasan[item.statusSync] += 1;
        }
        return ringkasan;
      }, { ...STATUS_SYNC_KOSONG });
  } catch (error) {
    console.error('Gagal membaca ringkasan sinkronisasi transaksi:', error);
    return { ...STATUS_SYNC_KOSONG, error: true };
  }
}

export default function AppLayout({
  children,
  menuAktif,
  onPilihMenu,
  daftarMenuDiizinkan,
  profil,
  pengguna,
  onKeluar
}) {
  const [modalTutupShift, setModalTutupShift] = useState(false);
  const [pesanErrorShift, setPesanErrorShift] = useState('');
  const [tampilkanToastKeluar, setTampilkanToastKeluar] = useState(false);
  const kunciStorageTransaksi = buatKunciStorageKasir('transactions', {
    storeId: profil?.store_id
  });
  const [statusSinkronisasiTransaksi, setStatusSinkronisasiTransaksi] = useState(
    () => bacaRingkasanSinkronisasi(kunciStorageTransaksi, profil?.store_id)
  );
  const backPertamaRef = useRef(false);
  const timerBackRef = useRef(null);
  const daftarMenu = DAFTAR_MENU.filter((menu) => daftarMenuDiizinkan.includes(menu.id));
  const menuSaatIni = daftarMenu.find((menu) => menu.id === menuAktif);
  const judulHalaman = menuSaatIni ? menuSaatIni.label : 'POS Warung';
  const { settings } = useSettings();
  const notifikasi = useMenuNotifications(profil.store_id);
  const daftarMenuDenganNotifikasi = daftarMenu.map((menu) => {
    if (menu.id === 'belanja') {
      return {
        ...menu,
        badgeCount: notifikasi.belanja,
        badgeLabel: `${notifikasi.belanja} draf belanja belum diselesaikan`
      };
    }
    if (menu.id === 'gudang') {
      return {
        ...menu,
        badgeCount: notifikasi.gudang,
        badgeLabel: `${notifikasi.gudang} tugas gudang atau produk perlu ditindaklanjuti`
      };
    }
    if (menu.id === 'produk') {
      return {
        ...menu,
        badgeCount: notifikasi.produk,
        badgeLabel: `${notifikasi.produk} produk perlu dilengkapi atau diperiksa harganya`
      };
    }
    if (menu.id === 'setting') {
      return {
        ...menu,
        badgeDot: notifikasi.setting,
        badgeLabel: 'Informasi profil toko belum lengkap'
      };
    }
    return menu;
  });
  const namaToko = settings.profil.namaToko;
  const namaPengguna = profil.nama || profil.email || 'Pengguna';
  const labelRole = profil.role === 'super_admin'
    ? 'Super Admin'
    : profil.role === 'admin'
      ? 'Admin'
      : 'Karyawan';
  const isKasir = profil.role === 'karyawan';

  useEffect(() => {
    const muatRingkasan = () => {
      setStatusSinkronisasiTransaksi(
        bacaRingkasanSinkronisasi(kunciStorageTransaksi, profil?.store_id)
      );
    };
    const tanganiStorage = (event) => {
      if (event.key && event.key !== kunciStorageTransaksi) return;
      muatRingkasan();
    };

    muatRingkasan();
    window.addEventListener('storage', tanganiStorage);
    window.addEventListener(EVENT_TRANSAKSI_KASIR_DIPERBARUI, muatRingkasan);
    return () => {
      window.removeEventListener('storage', tanganiStorage);
      window.removeEventListener(EVENT_TRANSAKSI_KASIR_DIPERBARUI, muatRingkasan);
    };
  }, [kunciStorageTransaksi, profil?.store_id]);

  const kirimAntreanTransaksiManual = () => {
    if (!profil?.store_id || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    sinkronkanPenjualanPending(profil.store_id).catch((error) => {
      console.error('Gagal mengirim antrean transaksi secara manual.', error);
      setStatusSinkronisasiTransaksi((sebelumnya) => ({ ...sebelumnya, error: true }));
    });
  };

  useEffect(() => {
    if (!profil?.store_id) return undefined;

    const cobaSinkronkanProduk = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      sinkronkanProdukPending(profil.store_id).catch((error) => {
        console.error('Gagal melanjutkan sinkronisasi produk tertunda.', error);
      });
      sinkronkanPenjualanPending(profil.store_id).catch((error) => {
        console.error('Gagal melanjutkan sinkronisasi transaksi penjualan tertunda.', error);
      });
    };

    window.addEventListener('online', cobaSinkronkanProduk);
    cobaSinkronkanProduk();
    return () => window.removeEventListener('online', cobaSinkronkanProduk);
  }, [profil?.store_id]);

  useEffect(() => {
    const tandaiRiwayatAplikasi = () => {
      window.history.pushState(
        { [PENANDA_BACK_KELUAR]: true },
        '',
        window.location.href
      );
    };

    if (!window.history.state?.[PENANDA_BACK_KELUAR]) {
      tandaiRiwayatAplikasi();
    }

    const tanganiBack = () => {
      if (backPertamaRef.current) {
        window.clearTimeout(timerBackRef.current);
        timerBackRef.current = null;
        backPertamaRef.current = false;
        setTampilkanToastKeluar(false);
        return;
      }

      backPertamaRef.current = true;
      setTampilkanToastKeluar(true);
      tandaiRiwayatAplikasi();
      timerBackRef.current = window.setTimeout(() => {
        backPertamaRef.current = false;
        timerBackRef.current = null;
        setTampilkanToastKeluar(false);
      }, 2000);
    };

    window.addEventListener('popstate', tanganiBack);
    return () => {
      window.removeEventListener('popstate', tanganiBack);
      window.clearTimeout(timerBackRef.current);
      timerBackRef.current = null;
      backPertamaRef.current = false;
      setTampilkanToastKeluar(false);
    };
  }, []);

  useEffect(() => {
    if (!isKasir || !pengguna?.uid) return;
    try {
      mulaiShiftJikaBelumAda(pengguna.uid, namaPengguna);
    } catch (error) {
      console.error('Gagal menyiapkan shift kasir:', error);
    }
  }, [isKasir, pengguna?.uid, namaPengguna]);

  const simpanDanTutupShift = (cashActual) => {
    tutupShift({ idKasir: pengguna.uid, cashActual, storeId: profil.store_id });
  };
  const bukaModalTutupShift = () => {
    try {
      mulaiShiftJikaBelumAda(pengguna.uid, namaPengguna);
      setPesanErrorShift('');
      setModalTutupShift(true);
    } catch (error) {
      console.error('Gagal membuka proses tutup shift:', error);
      setPesanErrorShift('Shift belum dapat disiapkan. Periksa penyimpanan sebelum melanjutkan.');
    }
  };

  return (
    <AppModeProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar untuk Layar Besar (Desktop) */}
        <Sidebar
          namaToko={namaToko}
          daftarMenu={daftarMenuDenganNotifikasi}
          menuAktif={menuAktif}
          onPilihMenu={onPilihMenu}
          namaPengguna={namaPengguna}
          labelRole={labelRole}
          onKeluar={onKeluar}
          onTutupShift={bukaModalTutupShift}
          isKasir={isKasir}
          statusSinkronisasiTransaksi={statusSinkronisasiTransaksi}
          onKirimAntreanTransaksi={kirimAntreanTransaksiManual}
        />

        {/* Konten Utama */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header
            judulHalaman={judulHalaman}
            namaToko={namaToko}
            namaPengguna={namaPengguna}
            labelRole={labelRole}
            onKeluar={onKeluar}
            onTutupShift={bukaModalTutupShift}
            isKasir={isKasir}
          />

          <main className="flex-1 p-4 max-w-5xl w-full mx-auto">
            {pesanErrorShift && isKasir && (
              <p role="alert" className="mb-4 text-sm text-red-700">{pesanErrorShift}</p>
            )}
            {children}
          </main>
        </div>

        {/* Navigasi Bawah untuk Layar HP (Mobile) */}
        <BottomNavigation
          daftarMenu={daftarMenuDenganNotifikasi}
          menuAktif={menuAktif}
          onPilihMenu={onPilihMenu}
        />
        {tampilkanToastKeluar && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg md:bottom-6"
          >
            Tekan sekali lagi untuk keluar
          </div>
        )}
        {isKasir && (
          <EndShiftModal
            key={modalTutupShift ? 'open' : 'closed'}
            isOpen={modalTutupShift}
            onClose={() => setModalTutupShift(false)}
            onLogout={onKeluar}
            onSimpan={simpanDanTutupShift}
          />
        )}
        <ModeTransitionOverlay />
      </div>
    </AppModeProvider>
  );
}


function ModeTransitionOverlay() {
  const { sedangMengubahMode } = useAppMode();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!sedangMengubahMode}
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-gray-50/90 backdrop-blur-sm transition-opacity duration-150 ${
        sedangMengubahMode ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {sedangMengubahMode && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg">
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"
          />
          <span className="text-sm font-semibold text-gray-700">
            Menyesuaikan mode aplikasi...
          </span>
        </div>
      )}
    </div>
  );
}