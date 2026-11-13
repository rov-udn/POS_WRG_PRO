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
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../constants/firebaseConfig';

export default function useTambahKaryawan() {
  const [sedangMemuat, setSedangMemuat] = useState(false);

  const tambahKaryawan = async ({ nama, email, kataSandi, storeId }) => {
    const adminAktif = auth.currentUser;

    if (!adminAktif) {
      throw new Error('Sesi admin tidak tersedia. Silakan masuk kembali.');
    }

    setSedangMemuat(true);
    let aplikasiAuthSementara;
    let authSementara;
    let karyawanBaru;
    let profilTersimpan = false;

    try {
      const dokumenAdmin = await getDocFromServer(doc(db, 'users', adminAktif.uid));
      const profilAdmin = dokumenAdmin.exists() ? dokumenAdmin.data() : null;
      const storeIdAkun = String(profilAdmin?.store_id || '').trim();

      if (
        !['admin', 'super_admin'].includes(profilAdmin?.role) ||
        profilAdmin.status !== 'active' ||
        !storeIdAkun ||
        (storeId && storeId !== storeIdAkun)
      ) {
        throw new Error('Hanya admin atau Super Admin dengan ID toko valid yang dapat membuat akun karyawan.');
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
        store_id: storeIdAkun,
        status: 'active'
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
