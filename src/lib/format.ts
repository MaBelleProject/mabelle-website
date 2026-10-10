// Strips insignificant trailing zeros from a decimal value for display ("7.4300" → "7.43", "2.000" → "2").
// Works on the string form so DECIMAL columns aren't run through float rounding.
export const trimZeros = (value: string | number): string => {
  const s = String(value).trim();
  return /^-?\d+\.\d+$/.test(s) ? s.replace(/\.?0+$/, "") : s;
};
