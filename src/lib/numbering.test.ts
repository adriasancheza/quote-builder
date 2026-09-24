import { describe, expect, it } from 'vitest';
import {
  compareQuoteNumbersDesc,
  formatQuoteNumber,
  nextQuoteNumber,
  parseQuoteNumber,
} from './numbering';

describe('formatQuoteNumber', () => {
  it('pads the sequence to four digits', () => {
    expect(formatQuoteNumber(2026, 1)).toBe('2026-0001');
    expect(formatQuoteNumber(2026, 42)).toBe('2026-0042');
  });

  it('grows beyond four digits when needed', () => {
    expect(formatQuoteNumber(2026, 12345)).toBe('2026-12345');
  });

  it('rejects invalid input', () => {
    expect(() => formatQuoteNumber(2026, 0)).toThrow(RangeError);
    expect(() => formatQuoteNumber(2026, 1.5)).toThrow(RangeError);
    expect(() => formatQuoteNumber(26, 1)).toThrow(RangeError);
  });
});

describe('parseQuoteNumber', () => {
  it('parses valid numbers', () => {
    expect(parseQuoteNumber('2026-0007')).toEqual({ year: 2026, sequence: 7 });
    expect(parseQuoteNumber(' 2025-10000 ')).toEqual({ year: 2025, sequence: 10000 });
  });

  it('returns null for anything else', () => {
    expect(parseQuoteNumber('')).toBeNull();
    expect(parseQuoteNumber('P-2026-0001')).toBeNull();
    expect(parseQuoteNumber('2026-01')).toBeNull();
    expect(parseQuoteNumber('2026-0000')).toBeNull();
  });
});

describe('nextQuoteNumber', () => {
  it('starts at 0001 when there are no quotes', () => {
    expect(nextQuoteNumber([], 2026)).toBe('2026-0001');
  });

  it('continues from the highest sequence of the same year', () => {
    expect(nextQuoteNumber(['2026-0001', '2026-0003', '2026-0002'], 2026)).toBe('2026-0004');
  });

  it('restarts every year', () => {
    expect(nextQuoteNumber(['2025-0010', '2025-0011'], 2026)).toBe('2026-0001');
    expect(nextQuoteNumber(['2025-0010', '2026-0002'], 2026)).toBe('2026-0003');
  });

  it('does not reuse gaps left by deleted quotes', () => {
    expect(nextQuoteNumber(['2026-0001', '2026-0005'], 2026)).toBe('2026-0006');
  });

  it('ignores malformed numbers', () => {
    expect(nextQuoteNumber(['borrador', '2026-9', ''], 2026)).toBe('2026-0001');
  });
});

describe('compareQuoteNumbersDesc', () => {
  it('sorts newest first across years', () => {
    const sorted = ['2025-0009', '2026-0002', 'x', '2026-0010'].sort(compareQuoteNumbersDesc);
    expect(sorted).toEqual(['2026-0010', '2026-0002', '2025-0009', 'x']);
  });
});
