const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const longFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD` (no timezone shift). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses `YYYY-MM-DD` as a local date. Returns null when invalid. */
export function parseISODate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isISODate(value: unknown): value is string {
  return typeof value === 'string' && parseISODate(value) !== null;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseISODate(isoDate);
  if (!date) throw new RangeError(`Invalid ISO date: ${isoDate}`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function formatDateLong(isoDate: string): string {
  const date = parseISODate(isoDate);
  return date ? longFormatter.format(date) : '—';
}

export function formatDateShort(isoDate: string): string {
  const date = parseISODate(isoDate);
  return date ? shortFormatter.format(date) : '—';
}

/** True when `validUntil` is strictly before `today` (both ISO dates). */
export function isExpired(validUntil: string, today: string): boolean {
  return isISODate(validUntil) && isISODate(today) && validUntil < today;
}
