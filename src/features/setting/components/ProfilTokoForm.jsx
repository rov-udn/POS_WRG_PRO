import { useSettings } from '../hooks/useSettings';
import { Field, SectionCard, Textarea, TextInput } from './SettingFormFields';

export default function ProfilTokoForm() {
  const { settings, updateSettings } = useSettings();
  const profil = settings.profil;

  const updateProfil = (perubahan) => {
    updateSettings({ profil: { ...profil, ...perubahan } });
  };

  return (
    <SectionCard title="Informasi toko">
      <Field label="Nama toko">
        <TextInput
          value={profil.namaToko}
          onChange={(event) => updateProfil({ namaToko: event.target.value })}
        />
      </Field>
      <Field label="Alamat">
        <Textarea
          value={profil.alamat}
          onChange={(event) => updateProfil({ alamat: event.target.value })}
          rows={3}
        />
      </Field>
      <Field label="Nomor telepon">
        <TextInput
          type="tel"
          value={profil.noTelp}
          onChange={(event) => updateProfil({ noTelp: event.target.value })}
        />
      </Field>
    </SectionCard>
  );
}
