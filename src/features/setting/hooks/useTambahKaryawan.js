import { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../constants/firebaseConfig';

export default function useTambahKaryawan() {
  const [sedangMemuat, setSedangMemuat] = useState(false);

  const tambahKaryawan = async ({ nama, email, kataSandi, storeId }) => {
    const adminAktif = auth.currentUser;

    if (!adminAktif || !storeId) {
      throw new Error('Sesi admin tidak tersedia. Silakan masuk kembali.');
    }

    setSedangMemuat(true);
    let aplikasiAuthSementara;
    let authSementara;
    let karyawanBaru;
    let profilTersimpan = false;

    try {
      const dokumenAdmin = await getDoc(doc(db, 'users', adminAktif.uid));
      const profilAdmin = dokumenAdmin.exists() ? dokumenAdmin.data() : null;

      if (profilAdmin?.role !== 'admin' || profilAdmin.store_id !== storeId) {
        throw new Error('Hanya admin toko yang dapat membuat akun karyawan.');
      }

      aplikasiAuthSementara = initializeApp(
        auth.app.options,
        `pendaftaran-karyawan-${Date.now()}`
      );
      authSementara = getAuth(aplikasiAuthSementara);
      await setPersistence(authSementara, inMemoryPersistence);

      const hasilPendaftaran = await createUserWithEmailAndPassword(
        authSementara,
        email,
        kataSandi
      );
      karyawanBaru = hasilPendaftaran.user;

      await setDoc(doc(db, 'users', karyawanBaru.uid), {
        uid: karyawanBaru.uid,
        email: karyawanBaru.email,
        nama: nama.trim(),
        role: 'karyawan',
        store_id: storeId
      });
      profilTersimpan = true;
    } catch (error) {
      if (karyawanBaru && !profilTersimpan) {
        try {
          await deleteUser(karyawanBaru);
        } catch (errorPenghapusan) {
          console.error('Gagal membatalkan pembuatan akun karyawan:', errorPenghapusan);
        }
      }
      throw error;
    } finally {
      try {
        if (authSementara) await signOut(authSementara);
      } finally {
        if (aplikasiAuthSementara) await deleteApp(aplikasiAuthSementara);
        setSedangMemuat(false);
      }
    }
  };

  return { tambahKaryawan, sedangMemuat };
}
