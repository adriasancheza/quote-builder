import { describe, expect, it } from 'vitest';
import { calculateLine, calculateTotals, normaliseDiscount } from './calculations';
import type { LineItem } from './types';

let seq = 0;
function item(overrides: Partial<LineItem> = {}): LineItem {
  seq += 1;
  return {
    id: `item-${seq}`,
    description: 'Servicio',
    quantity: 1,
    unitPrice: 100,
    discount: 0,
    vatRate: 21,
    ...overrides,
  };
}

describe('calculateLine', () => {
  it('multiplies quantity by unit price', () => {
    expect(calculateLine(item({ quantity: 3, unitPrice: 19.99 }))).toEqual({
      gross: 59.97,
      discount: 0,
      net: 59.97,
    });
  });

  it('applies a percentage discount', () => {
    expect(calculateLine(item({ quantity: 2, unitPrice: 50, discount: 15 }))).toEqual({
      gross: 100,
      discount: 15,
      net: 85,
    });
  });

  it('supports a 100 % discount (free line)', () => {
    expect(calculateLine(item({ unitPrice: 80, discount: 100 })).net).toBe(0);
  });

  it('clamps out-of-range discounts', () => {
    expect(calculateLine(item({ unitPrice: 80, discount: 120 })).net).toBe(0);
    expect(calculateLine(item({ unitPrice: 80, discount: -10 })).net).toBe(80);
  });

  it('rounds each line to cents', () => {
    // 3 × 0.333 = 0.999 → 1.00; 10 % of 1.00 = 0.10
    expect(calculateLine(item({ quantity: 3, unitPrice: 0.333, discount: 10 }))).toEqual({
      gross: 1,
      discount: 0.1,
      net: 0.9,
    });
  });

  it('treats invalid numbers as zero', () => {
    expect(calculateLine(item({ quantity: Number.NaN, unitPrice: 10 })).net).toBe(0);
  });
});

describe('normaliseDiscount', () => {
  it('keeps values within 0–100', () => {
    expect(normaliseDiscount(12.5)).toBe(12.5);
    expect(normaliseDiscount(101)).toBe(100);
    expect(normaliseDiscount('x')).toBe(0);
  });
});

describe('calculateTotals', () => {
  it('returns all zeros and no VAT rows for zero items', () => {
    expect(calculateTotals([])).toEqual({
      gross: 0,
      discount: 0,
      base: 0,
      vatBreakdown: [],
      vat: 0,
      total: 0,
    });
  });

  it('computes a single-rate quote', () => {
    const totals = calculateTotals([item({ quantity: 2, unitPrice: 100 })]);
    expect(totals.base).toBe(200);
    expect(totals.vatBreakdown).toEqual([{ rate: 21, base: 200, vat: 42 }]);
    expect(totals.vat).toBe(42);
    expect(totals.total).toBe(242);
  });

  it('groups mixed VAT rates, sorted from highest to lowest', () => {
    const totals = calculateTotals([
      item({ unitPrice: 10, vatRate: 4 }),
      item({ unitPrice: 100, vatRate: 21 }),
      item({ unitPrice: 50, vatRate: 10 }),
      item({ unitPrice: 20, vatRate: 0 }),
      item({ unitPrice: 100, vatRate: 21 }),
    ]);
    expect(totals.vatBreakdown).toEqual([
      { rate: 21, base: 200, vat: 42 },
      { rate: 10, base: 50, vat: 5 },
      { rate: 4, base: 10, vat: 0.4 },
      { rate: 0, base: 20, vat: 0 },
    ]);
    expect(totals.base).toBe(280);
    expect(totals.vat).toBe(47.4);
    expect(totals.total).toBe(327.4);
  });

  it('reports gross and discount totals separately', () => {
    const totals = calculateTotals([
      item({ quantity: 1, unitPrice: 1000, discount: 10 }),
      item({ quantity: 4, unitPrice: 25, discount: 50, vatRate: 10 }),
    ]);
    expect(totals.gross).toBe(1100);
    expect(totals.discount).toBe(150);
    expect(totals.base).toBe(950);
    expect(totals.vatBreakdown).toEqual([
      { rate: 21, base: 900, vat: 189 },
      { rate: 10, base: 50, vat: 5 },
    ]);
    expect(totals.total).toBe(1144);
  });

  it('computes VAT on the aggregated base per rate (not per line)', () => {
    // Per line: 0.105 → 0.11 each, 0.33 in total. Aggregated: 1.5 × 21 % = 0.315 → 0.32.
    const lines = [0.5, 0.5, 0.5].map((unitPrice) => item({ unitPrice }));
    const totals = calculateTotals(lines);
    expect(totals.vatBreakdown).toEqual([{ rate: 21, base: 1.5, vat: 0.32 }]);
    expect(totals.total).toBe(1.82);
  });

  it('avoids floating point drift when summing many lines', () => {
    const lines = Array.from({ length: 10 }, () => item({ unitPrice: 0.1, vatRate: 0 }));
    expect(calculateTotals(lines).total).toBe(1);
  });

  it('omits rates whose base is zero (e.g. fully discounted lines)', () => {
    const totals = calculateTotals([
      item({ unitPrice: 100, vatRate: 21 }),
      item({ unitPrice: 30, vatRate: 10, discount: 100 }),
    ]);
    expect(totals.vatBreakdown.map((r) => r.rate)).toEqual([21]);
    expect(totals.discount).toBe(30);
    expect(totals.total).toBe(121);
  });

  it('supports negative lines (e.g. a credit or down payment)', () => {
    const totals = calculateTotals([
      item({ unitPrice: 500 }),
      item({ quantity: -1, unitPrice: 100, description: 'Anticipo' }),
    ]);
    expect(totals.base).toBe(400);
    expect(totals.vat).toBe(84);
    expect(totals.total).toBe(484);
  });
});
