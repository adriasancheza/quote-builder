import { describe, expect, it } from 'vitest';
import { clamp, formatCurrency, formatPercent, roundCurrency, toFiniteNumber } from './money';

// Intl uses a narrow no-break space before the € sign; normalise for readable assertions.
const plain = (s: string) => s.replace(/\s/g, ' ');

describe('roundCurrency', () => {
  it('rounds to two decimals', () => {
    expect(roundCurrency(10.123)).toBe(10.12);
    expect(roundCurrency(10.126)).toBe(10.13);
  });

  it('rounds half away from zero despite floating point artefacts', () => {
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(2.675)).toBe(2.68);
    expect(roundCurrency(-1.005)).toBe(-1.01);
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
  });

  it('handles tiny, huge and non-finite values', () => {
    expect(roundCurrency(1e-7)).toBe(0);
    expect(roundCurrency(123456789.125)).toBe(123456789.13);
    expect(roundCurrency(Number.NaN)).toBe(0);
    expect(roundCurrency(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundCurrency(-0.001), 0)).toBe(true);
  });
});

describe('formatCurrency', () => {
  it('formats EUR with Spanish conventions', () => {
    // es-ES does not group four-digit numbers (minimum grouping digits = 2).
    expect(plain(formatCurrency(1234.5))).toBe('1234,50 €');
    expect(plain(formatCurrency(12345.5))).toBe('12.345,50 €');
    expect(plain(formatCurrency(0))).toBe('0,00 €');
    expect(plain(formatCurrency(-3.2))).toBe('-3,20 €');
  });
});

describe('formatPercent', () => {
  it('formats percentages with a comma decimal separator', () => {
    expect(plain(formatPercent(21))).toBe('21 %');
    expect(plain(formatPercent(7.5))).toBe('7,5 %');
  });
});

describe('toFiniteNumber / clamp', () => {
  it('parses numbers and Spanish decimal commas', () => {
    expect(toFiniteNumber('3,5')).toBe(3.5);
    expect(toFiniteNumber('2.25')).toBe(2.25);
    expect(toFiniteNumber(7)).toBe(7);
  });

  it('falls back for invalid input', () => {
    expect(toFiniteNumber('abc')).toBe(0);
    expect(toFiniteNumber(undefined, 1)).toBe(1);
    expect(toFiniteNumber(Number.NaN)).toBe(0);
  });

  it('clamps into a range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });
});
