export function normalizeChileanRut(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.toUpperCase().replace(/[.\s]/g, "");
  const match = /^([0-9]{7,8})-?([0-9K])$/.exec(clean);
  if (!match) return null;
  let sum = 0;
  let factor = 2;
  for (const digit of [...match[1]].reverse()) {
    sum += Number(digit) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const remainder = 11 - (sum % 11);
  const check = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return check === match[2] ? `${match[1]}-${check}` : null;
}
