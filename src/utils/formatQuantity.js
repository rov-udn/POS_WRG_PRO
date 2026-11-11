const QUANTITY_PRECISION = 1000;

const toNumber = (value) => {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundQuantity = (value) => {
  const number = toNumber(value);
  const adjusted = number + Math.sign(number) * Number.EPSILON;
  return Math.round(adjusted * QUANTITY_PRECISION) / QUANTITY_PRECISION;
};

export const roundPreciseQuantity = (value) => {
  const number = toNumber(value);
  return Number(number.toPrecision(12));
};

export const formatQuantity = (value) => {
  const rounded = roundQuantity(value);
  if (Object.is(rounded, -0)) return '0';
  const formatted = rounded.toFixed(3);
  return formatted.replace(/\.?0+$/, '');
};

export const calculateSubtotal = (price, quantity) => {
  const priceInCents = Math.round(toNumber(price) * 100);
  const quantityInThousandths = Math.round(roundQuantity(quantity) * QUANTITY_PRECISION);
  return Math.round((priceInCents * quantityInThousandths) / (100 * QUANTITY_PRECISION));
};
