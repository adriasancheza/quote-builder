/**
 * Quote numbering: `YYYY-NNNN`, sequential and restarting every year
 * (e.g. `2026-0001`, `2026-0002`, … then `2027-0001`).
 */

const NUMBER_PATTERN = /^(\d{4})-(\d{4,})$/;

export interface ParsedQuoteNumber {
  year: number;
  sequence: number;
}

export function formatQuoteNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError(`Invalid year: ${year}`);
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError(`Invalid sequence: ${sequence}`);
  }
  return `${year}-${String(sequence).padStart(4, '0')}`;
}

export function parseQuoteNumber(value: string): ParsedQuoteNumber | null {
  const match = NUMBER_PATTERN.exec(value.trim());
  if (!match) return null;
  const sequence = Number(match[2]);
  if (sequence < 1) return null;
  return { year: Number(match[1]), sequence };
}

/**
 * Returns the next free number for `year`, i.e. the highest existing sequence
 * for that year plus one. Numbers from other years or with an unknown format
 * are ignored, and gaps are never reused.
 */
export function nextQuoteNumber(existing: Iterable<string>, year: number): string {
  let max = 0;
  for (const value of existing) {
    const parsed = parseQuoteNumber(value);
    if (parsed && parsed.year === year && parsed.sequence > max) max = parsed.sequence;
  }
  return formatQuoteNumber(year, max + 1);
}

/** Sort comparator: newest year first, then highest sequence first. */
export function compareQuoteNumbersDesc(a: string, b: string): number {
  const pa = parseQuoteNumber(a);
  const pb = parseQuoteNumber(b);
  if (pa && pb) return pb.year - pa.year || pb.sequence - pa.sequence;
  if (pa) return -1;
  if (pb) return 1;
  return b.localeCompare(a);
}
