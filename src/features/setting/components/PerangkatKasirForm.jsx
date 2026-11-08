import { useSettings } from '../hooks/useSettings';
import { Field, SectionCard, Select, Toggle } from './SettingFormFields';

export default function PerangkatKasirForm() {
  const { settings, updateSettings } = useSettings();
  const perangkat = settings.perangkat || {};

  const updatePerangkat = (perubahan) => {
    updateSettings({ perangkat: { ...perangkat, ...perubahan } });
  };

  return (
    <SectionCard title="Perangkat kasir">
      <Field label="Jenis koneksi printer thermal">
        <Select
          value={perangkat.tipePrinter || 'bluetooth'}
          onChange={(event) => updatePerangkat({ tipePrinter: event.target.value })}
        >
          <option value="bluetooth">Bluetooth</option>
          <option value="usb">USB</option>
          <option value="network">Jaringan</option>
        </Select>
      </Field>
      <Field label="Lebar kertas printer">
        <Select
          value={perangkat.lebarKertas || '58mm'}
          onChange={(event) => updatePerangkat({ lebarKertas: event.target.value })}
        >
          <option value="58mm">58 mm</option>
          <option value="80mm">80 mm</option>
        </Select>
      </Field>
      <Toggle
        label="Cetak struk otomatis"
        checked={perangkat.autoCetakStruk ?? true}
        onChange={(event) => updatePerangkat({ autoCetakStruk: event.target.checked })}
      />
      <Toggle
        label="Scanner barcode terhubung"
        checked={perangkat.scannerAktif}
        onChange={(event) => updatePerangkat({ scannerAktif: event.target.checked })}
      />
    </SectionCard>
  );
}
