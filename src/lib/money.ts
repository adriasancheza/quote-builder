const eurFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

const percentFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

/**
 * Rounds to cents using "round half away from zero" and avoids binary
 * floating point artefacts (e.g. `1.005` → `1.01`, not `1.00`).
 * Non-finite input becomes 0 and `-0` is normalised to `0`.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  // Shift the decimal point via the string representation to avoid 1.005 * 100 = 100.4999…
  const shifted = Number(`${abs}e2`);
  const cents = Number.isFinite(shifted) ? Math.round(shifted) : Math.round(abs * 100);
  const result = (sign * cents) / 100;
  return result === 0 ? 0 : result;
}

/** Formats an amount as EUR using Spanish conventions, e.g. `1.234,50 €`. */
export function formatCurrency(value: number): string {
  return eurFormatter.format(roundCurrency(value));
}

/** Formats a percentage number (already in 0–100 scale), e.g. `21 %`. */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)} %`;
}

/** Coerces unknown input into a finite number (fallback 0). */
export function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
