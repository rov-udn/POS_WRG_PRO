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

const pastikanAdminToko = async (storeId) => {
  const penggunaAktif = auth.currentUser;
  if (!penggunaAktif || !storeId) {
    throw new Error('Sesi admin tidak tersedia. Silakan masuk kembali.');
  }

  const snapshotAdmin = await getDocFromServer(doc(db, 'users', penggunaAktif.uid));
  const profilAdmin = snapshotAdmin.exists() ? snapshotAdmin.data() : null;

  if (profilAdmin?.role !== 'admin' || profilAdmin.store_id !== storeId) {
    throw new Error('Hanya admin toko yang dapat mengelola akun.');
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

export default function useManajemenKaryawan(storeId) {
  const [daftarAkun, setDaftarAkun] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [akunDiproses, setAkunDiproses] = useState('');
  const [pesanError, setPesanError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');

  const muatAkun = useCallback(async ({ clearError = false } = {}) => {
    if (clearError) setPesanError('');
    try {
      const uidAdmin = await pastikanAdminToko(storeId);
      const hasil = await getDocsFromServer(
        query(collection(db, 'users'), where('store_id', '==', storeId))
      );
      setDaftarAkun(
        hasil.docs
          .filter((dokumen) => dokumen.id !== uidAdmin && dokumen.id !== storeId)
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

  useEffect(() => {
    // This effect starts the initial asynchronous Firestore account fetch.
    // eslint-disable-next-line react/set-state-in-effect
    muatAkun();
  }, [muatAkun]);

  const ubahRole = async (akun, roleBaru) => {
    if (!['admin', 'karyawan'].includes(roleBaru) || roleBaru === akun.role) return;

    setAkunDiproses(akun.uid);
    setPesanError('');
    setPesanSukses('');
    try {
      const uidAdmin = await pastikanAdminToko(storeId);
      await pastikanAkunToko(akun.uid, storeId, uidAdmin);
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
      const uidAdmin = await pastikanAdminToko(storeId);
      await pastikanAkunToko(akun.uid, storeId, uidAdmin);
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

  return {
    daftarAkun,
    sedangMemuat,
    akunDiproses,
    pesanError,
    pesanSukses,
    muatAkun,
    ubahRole,
    hapusAkses
  };
}
