import { useCallback, useEffect, useState } from 'react';
import { auth, db } from '../../../constants/firebaseConfig';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  updateDoc,
  where
} from 'firebase/firestore';

const pastikanPengelolaToko = async (storeId) => {
  const penggunaAktif = auth.currentUser;
  if (!penggunaAktif) {
    throw new Error('Sesi pengelola toko tidak tersedia. Silakan masuk kembali.');
  }

  const snapshotPengelola = await getDocFromServer(doc(db, 'users', penggunaAktif.uid));
  const profilPengelola = snapshotPengelola.exists() ? snapshotPengelola.data() : null;
  const storeIdAktif = String(profilPengelola?.store_id || '').trim();

  if (
    !['admin', 'super_admin'].includes(profilPengelola?.role) ||
    profilPengelola.status !== 'active' ||
    !storeIdAktif ||
    (storeId && storeId !== storeIdAktif)
  ) {
    throw new Error('Hanya admin atau Super Admin pada toko terkait yang dapat mengelola akun.');
  }

  return { uid: penggunaAktif.uid, storeId: storeIdAktif };
};

const pastikanSuperAdmin = async () => {
  const penggunaAktif = auth.currentUser;
  if (!penggunaAktif) {
    throw new Error('Sesi Super Admin tidak tersedia. Silakan masuk kembali.');
  }

  const snapshotAdmin = await getDocFromServer(doc(db, 'users', penggunaAktif.uid));
  if (
    !snapshotAdmin.exists() ||
    snapshotAdmin.data().role !== 'super_admin' ||
    snapshotAdmin.data().status !== 'active'
  ) {
    throw new Error('Hanya Super Admin yang dapat memproses pendaftaran akun.');
  }

  return penggunaAktif.uid;
};

const pastikanAkunToko = async (akunUid, storeId, uidAdmin) => {
  if (!akunUid || akunUid === storeId || akunUid === uidAdmin) {
    throw new Error('Akun admin utama tidak dapat dikelola dari daftar ini.');
  }

  const snapshotAkun = await getDocFromServer(doc(db, 'users', akunUid));
  if (!snapshotAkun.exists() || snapshotAkun.data().store_id !== storeId) {
    throw new Error('Akun tidak ditemukan di toko ini. Muat ulang daftar akun.');
  }
};

export default function useManajemenKaryawan(storeId, roleAktif) {
  const [daftarAkun, setDaftarAkun] = useState([]);
  const [daftarPendaftaranPending, setDaftarPendaftaranPending] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangMemuatPendaftaran, setSedangMemuatPendaftaran] = useState(true);
  const [akunDiproses, setAkunDiproses] = useState('');
  const [pesanError, setPesanError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');
  const [pesanErrorPendaftaran, setPesanErrorPendaftaran] = useState('');
  const [pesanSuksesPendaftaran, setPesanSuksesPendaftaran] = useState('');

  const muatAkun = useCallback(async ({ clearError = false } = {}) => {
    if (clearError) setPesanError('');
    setSedangMemuat(true);
    try {
      const { uid: uidPengelola, storeId: storeIdAktif } = await pastikanPengelolaToko(storeId);
      const hasil = await getDocsFromServer(
        query(collection(db, 'users'), where('store_id', '==', storeIdAktif))
      );
      setDaftarAkun(
        hasil.docs
          .filter((dokumen) => dokumen.id !== uidPengelola && dokumen.id !== storeIdAktif)
          .map((dokumen) => ({
            uid: dokumen.id,
            ...dokumen.data(),
            role: dokumen.data().role === 'admin' ? 'admin' : 'karyawan'
          }))
      );
    } catch (error) {
      console.error('Gagal memuat daftar akun toko:', error);
      setPesanError(error.message || 'Daftar akun gagal dimuat. Silakan coba lagi.');
    } finally {
      setSedangMemuat(false);
    }
  }, [storeId]);

  const muatPendaftaranPending = useCallback(async () => {
    setSedangMemuatPendaftaran(true);
    setPesanErrorPendaftaran('');
    try {
      await pastikanSuperAdmin();
      const hasil = await getDocsFromServer(
        query(collection(db, 'users'), where('status', '==', 'pending'))
      );
      setDaftarPendaftaranPending(
        hasil.docs.map((dokumen) => ({
          uid: dokumen.id,
          ...dokumen.data()
        }))
      );
    } catch (error) {
      console.error('Gagal memuat pendaftaran yang menunggu persetujuan:', error);
      setPesanErrorPendaftaran(
        error.message || 'Daftar pendaftaran gagal dimuat. Silakan coba lagi.'
      );
    } finally {
      setSedangMemuatPendaftaran(false);
    }
  }, []);

  useEffect(() => {
    if (roleAktif === 'super_admin' && !storeId) {
      // Start the server-backed pending-account fetch.
      // eslint-disable-next-line react/set-state-in-effect
      muatPendaftaranPending();
      return;
    }
    // This effect starts the initial asynchronous Firestore account fetch.
    // eslint-disable-next-line react/set-state-in-effect
    muatAkun();
  }, [muatAkun, muatPendaftaranPending, roleAktif, storeId]);

  const ubahRole = async (akun, roleBaru) => {
    if (!['admin', 'karyawan'].includes(roleBaru) || roleBaru === akun.role) return;

    setAkunDiproses(akun.uid);
    setPesanError('');
    setPesanSukses('');
    try {
      const { uid: uidPengelola, storeId: storeIdAktif } = await pastikanPengelolaToko(storeId);
      await pastikanAkunToko(akun.uid, storeIdAktif, uidPengelola);
      await updateDoc(doc(db, 'users', akun.uid), { role: roleBaru });
      setDaftarAkun((sebelumnya) => sebelumnya.map((item) => (
        item.uid === akun.uid ? { ...item, role: roleBaru } : item
      )));
      setPesanSukses(`Role ${akun.nama || akun.email || 'akun'} diubah menjadi ${roleBaru}.`);
      await muatAkun();
    } catch (error) {
      console.error('Gagal mengubah role akun:', error);
      setPesanError(error.message || 'Role akun gagal diubah. Silakan coba lagi.');
    } finally {
      setAkunDiproses('');
    }
  };

  const hapusAkses = async (akun) => {
    setAkunDiproses(akun.uid);
    setPesanError('');
    setPesanSukses('');
    try {
      const { uid: uidPengelola, storeId: storeIdAktif } = await pastikanPengelolaToko(storeId);
      await pastikanAkunToko(akun.uid, storeIdAktif, uidPengelola);
      await deleteDoc(doc(db, 'users', akun.uid));
      setDaftarAkun((sebelumnya) => sebelumnya.filter((item) => item.uid !== akun.uid));
      setPesanSukses(
        `Akses aplikasi untuk ${akun.nama || akun.email || 'akun'} telah dicabut.`
      );
      await muatAkun();
    } catch (error) {
      console.error('Gagal mencabut akses akun:', error);
      setPesanError(error.message || 'Akses akun gagal dicabut. Silakan coba lagi.');
    } finally {
      setAkunDiproses('');
    }
  };

  const setujuiPendaftaran = async (akun) => {
    setAkunDiproses(akun.uid);
    setPesanErrorPendaftaran('');
    setPesanSuksesPendaftaran('');
    try {
      const uidSuperAdmin = await pastikanSuperAdmin();
      if (!akun.uid || akun.uid === uidSuperAdmin) {
        throw new Error('Akun Super Admin tidak dapat diproses sebagai pendaftaran.');
      }

      const referensiAkun = doc(db, 'users', akun.uid);
      const snapshotAkun = await getDocFromServer(referensiAkun);
      if (!snapshotAkun.exists() || snapshotAkun.data().status !== 'pending') {
        throw new Error('Pendaftaran sudah tidak menunggu persetujuan. Muat ulang daftar.');
      }

      await updateDoc(referensiAkun, { status: 'active' });
      setDaftarPendaftaranPending((sebelumnya) => (
        sebelumnya.filter((item) => item.uid !== akun.uid)
      ));
      setPesanSuksesPendaftaran(
        `Pendaftaran ${akun.nama || akun.email || 'akun'} berhasil disetujui.`
      );
    } catch (error) {
      console.error('Gagal menyetujui pendaftaran akun:', error);
      setPesanErrorPendaftaran(error.message || 'Pendaftaran gagal disetujui. Silakan coba lagi.');
    } finally {
      setAkunDiproses('');
    }
  };

  const hapusPendaftaranPending = async (akun) => {
    setAkunDiproses(akun.uid);
    setPesanErrorPendaftaran('');
    setPesanSuksesPendaftaran('');
    try {
      const uidSuperAdmin = await pastikanSuperAdmin();
      if (!akun.uid || akun.uid === uidSuperAdmin) {
        throw new Error('Akun Super Admin tidak dapat dihapus dari daftar pendaftaran.');
      }

      const referensiAkun = doc(db, 'users', akun.uid);
      const snapshotAkun = await getDocFromServer(referensiAkun);
      if (!snapshotAkun.exists() || snapshotAkun.data().status !== 'pending') {
        throw new Error('Akun tidak lagi berstatus pending. Muat ulang daftar.');
      }

      await deleteDoc(referensiAkun);
      setDaftarPendaftaranPending((sebelumnya) => (
        sebelumnya.filter((item) => item.uid !== akun.uid)
      ));
      setPesanSuksesPendaftaran(
        `Profil pendaftaran ${akun.nama || akun.email || 'akun'} telah dihapus.`
      );
    } catch (error) {
      console.error('Gagal menghapus pendaftaran akun:', error);
      setPesanErrorPendaftaran(error.message || 'Pendaftaran gagal dihapus. Silakan coba lagi.');
    } finally {
      setAkunDiproses('');
    }
  };

  return {
    daftarAkun,
    daftarPendaftaranPending,
    sedangMemuat,
    sedangMemuatPendaftaran,
    akunDiproses,
    pesanError,
    pesanSukses,
    pesanErrorPendaftaran,
    pesanSuksesPendaftaran,
    muatAkun,
    muatPendaftaranPending,
    ubahRole,
    hapusAkses,
    setujuiPendaftaran,
    hapusPendaftaranPending
  };
}
