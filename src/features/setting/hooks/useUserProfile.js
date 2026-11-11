import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../constants/firebaseConfig';

export default function useUserProfile() {
  const [pengguna, setPengguna] = useState(null);
  const [profil, setProfil] = useState(null);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [pesanError, setPesanError] = useState('');

  useEffect(() => {
    let masihAktif = true;
    let generasiAuth = 0;
    let berhentiMendengarkanProfil;

    const berhentiMendengarkan = onIdTokenChanged(auth, async (penggunaAktif) => {
      if (!masihAktif) return;

      const generasiSaatIni = ++generasiAuth;
      berhentiMendengarkanProfil?.();
      berhentiMendengarkanProfil = null;
      setSedangMemuat(true);
      setPesanError('');
      setPengguna(penggunaAktif);

      if (!penggunaAktif) {
        setProfil(null);
        setSedangMemuat(false);
        return;
      }

      setProfil(null);

      try {
        const referensiProfil = doc(db, 'users', penggunaAktif.uid);
        const profilTersimpan = await getDocFromServer(referensiProfil);

        if (!masihAktif || generasiSaatIni !== generasiAuth) return;

        if (profilTersimpan.exists()) {
          setProfil(profilTersimpan.data());
        } else {
          setProfil(null);
          setPesanError('Profil akun tidak ditemukan di penyimpanan.');
        }

        berhentiMendengarkanProfil = onSnapshot(
          referensiProfil,
          { includeMetadataChanges: true },
          (snapshot) => {
            if (
              !masihAktif ||
              generasiSaatIni !== generasiAuth ||
              snapshot.metadata.fromCache
            ) {
              return;
            }

            if (snapshot.exists()) {
              setProfil(snapshot.data());
              setPesanError('');
            } else {
              setProfil(null);
              setPesanError('Profil akun tidak ditemukan di penyimpanan.');
            }
          },
          (error) => {
            console.error('Gagal menyinkronkan perubahan profil pengguna:', error);
            if (masihAktif && generasiSaatIni === generasiAuth) {
              setProfil(null);
              setPesanError('Profil akun gagal disinkronkan. Silakan coba lagi.');
            }
          }
        );
      } catch (error) {
        console.error('Gagal memuat profil pengguna:', error);
        if (masihAktif && generasiSaatIni === generasiAuth) {
          setProfil(null);
          setPesanError('Profil akun gagal dimuat. Silakan coba lagi.');
        }
      } finally {
        if (masihAktif && generasiSaatIni === generasiAuth) {
          setSedangMemuat(false);
        }
      }
    });

    return () => {
      masihAktif = false;
      generasiAuth += 1;
      berhentiMendengarkanProfil?.();
      berhentiMendengarkan();
    };
  }, []);

  return {
    pengguna,
    profil,
    role: profil
      ? (['admin', 'super_admin'].includes(profil.role) ? profil.role : 'karyawan')
      : null,
    sedangMemuat,
    pesanError
  };
}
