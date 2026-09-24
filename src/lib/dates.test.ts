import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatDateLong,
  formatDateShort,
  isExpired,
  parseISODate,
  toISODate,
} from './dates';

describe('dates', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('parses only real calendar dates', () => {
    expect(parseISODate('2026-02-28')).not.toBeNull();
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('26-2-3')).toBeNull();
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-15', 30)).toBe('2027-01-14');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(() => addDays('nope', 1)).toThrow(RangeError);
  });

  it('formats dates in Spanish', () => {
    expect(formatDateLong('2026-03-09')).toBe('9 de marzo de 2026');
    expect(formatDateShort('2026-03-09')).toBe('09/03/2026');
    expect(formatDateLong('')).toBe('—');
  });

  it('detects expired quotes', () => {
    expect(isExpired('2026-01-01', '2026-01-02')).toBe(true);
    expect(isExpired('2026-01-02', '2026-01-02')).toBe(false);
    expect(isExpired('', '2026-01-02')).toBe(false);
  });
});
