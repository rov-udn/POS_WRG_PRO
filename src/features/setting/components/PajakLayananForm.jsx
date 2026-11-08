import { useSettings } from '../hooks/useSettings';
import { Field, SectionCard, TextInput, Toggle } from './SettingFormFields';

export default function PajakLayananForm() {
  const { settings, updateSettings } = useSettings();
  const pajakLayanan = settings.pajakLayanan || {};

  const updatePajakLayanan = (perubahan) => {
    updateSettings({ pajakLayanan: { ...pajakLayanan, ...perubahan } });
  };

  return (
    <SectionCard title="Pajak dan biaya layanan">
      <Toggle
        label="Aktifkan pajak"
        checked={pajakLayanan.aktifkanPajak}
        onChange={(event) => updatePajakLayanan({ aktifkanPajak: event.target.checked })}
      />
      <Field label="Persentase pajak (%)">
        <TextInput
          type="number"
          min="0"
          max="100"
          value={pajakLayanan.persentasePajak ?? 0}
          onChange={(event) =>
            updatePajakLayanan({ persentasePajak: Number(event.target.value) })
          }
        />
      </Field>
      <Toggle
        label="Aktifkan biaya layanan"
        checked={pajakLayanan.aktifkanBiayaLayanan}
        onChange={(event) =>
          updatePajakLayanan({ aktifkanBiayaLayanan: event.target.checked })
        }
      />
      <Field label="Nama biaya layanan">
        <TextInput
          value={pajakLayanan.namaBiayaLayanan || ''}
          onChange={(event) =>
            updatePajakLayanan({ namaBiayaLayanan: event.target.value })
          }
        />
      </Field>
      <Field label="Nominal biaya layanan (Rp)">
        <TextInput
          type="number"
          min="0"
          value={pajakLayanan.nominalBiayaLayanan ?? 0}
          onChange={(event) =>
            updatePajakLayanan({ nominalBiayaLayanan: Number(event.target.value) })
          }
        />
      </Field>
    </SectionCard>
  );
}
