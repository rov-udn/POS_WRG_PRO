import React, { useState } from 'react';
import { formatQuantity, roundQuantity } from '../../utils/formatQuantity';

export default function QuantityInput({
  value,
  onChange,
  min = 0.001,
  className = ''
}) {
  const [draft, setDraft] = useState(null);
  const inputValue = draft?.value === value ? draft.text : formatQuantity(value);

  const simpanKuantitas = () => {
    const kuantitas = Number(inputValue);
    if (!Number.isFinite(kuantitas) || kuantitas < min) {
      setDraft(null);
      return;
    }

    onChange(roundQuantity(kuantitas));
    setDraft(null);
  };

  return (
    <input
      type="number"
      min={min}
      step="0.001"
      value={inputValue}
      onChange={(e) => setDraft({ value, text: e.target.value })}
      onBlur={simpanKuantitas}
      className={className}
      aria-label="Kuantitas"
    />
  );
}
