import { useSettings } from '../hooks/useSettings';
import { Field, SectionCard, Select, Textarea, Toggle } from './SettingFormFields';

export default function StrukNotaForm() {
  const { settings, updateSettings } = useSettings();
  const nota = settings.nota;

  const updateNota = (perubahan) => {
    updateSettings({ nota: { ...nota, ...perubahan } });
  };

  return (
    <SectionCard title="Tampilan struk dan nota">
      <Field label="Ukuran kertas">
        <Select
          value={nota.ukuranKertas}
          onChange={(event) => updateNota({ ukuranKertas: event.target.value })}
        >
          <option value="58mm">58 mm</option>
          <option value="80mm">80 mm</option>
        </Select>
      </Field>
      <Field label="Pesan footer">
        <Textarea
          value={nota.pesanFooter}
          onChange={(event) => updateNota({ pesanFooter: event.target.value })}
          rows={3}
        />
      </Field>
      <Toggle
        label="Tampilkan logo pada nota"
        checked={nota.tampilkanLogo}
        onChange={(event) => updateNota({ tampilkanLogo: event.target.checked })}
      />
    </SectionCard>
  );
}
