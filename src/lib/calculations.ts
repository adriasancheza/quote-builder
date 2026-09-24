import { clamp, roundCurrency, toFiniteNumber } from './money';
import type { LineItem, VatRate } from './types';

export interface LineAmounts {
  /** quantity × unit price, before discount. */
  gross: number;
  /** Amount deducted by the line discount. */
  discount: number;
  /** Taxable amount of the line (gross − discount). */
  net: number;
}

export interface VatBreakdownRow {
  rate: VatRate;
  /** Sum of the net amounts of all lines with this rate. */
  base: number;
  /** VAT due for this rate (computed on the aggregated base). */
  vat: number;
}

export interface QuoteTotals {
  gross: number;
  discount: number;
  /** Total taxable base (sum of line nets). */
  base: number;
  vatBreakdown: VatBreakdownRow[];
  vat: number;
  total: number;
}

/** Normalises a discount into the 0–100 range. Invalid input counts as 0 %. */
export function normaliseDiscount(discount: unknown): number {
  return clamp(toFiniteNumber(discount), 0, 100);
}

/** Computes the amounts of a single line, rounded to cents. */
export function calculateLine(
  item: Pick<LineItem, 'quantity' | 'unitPrice' | 'discount'>,
): LineAmounts {
  const quantity = toFiniteNumber(item.quantity);
  const unitPrice = toFiniteNumber(item.unitPrice);
  const gross = roundCurrency(quantity * unitPrice);
  const discount = roundCurrency((gross * normaliseDiscount(item.discount)) / 100);
  const net = roundCurrency(gross - discount);
  return { gross, discount, net };
}

/**
 * Computes quote totals.
 *
 * VAT is calculated per rate on the aggregated base of all lines sharing that
 * rate (the usual approach on Spanish invoices/quotes), and each amount is
 * rounded to cents. Rates whose base is zero are omitted from the breakdown.
 * The breakdown is sorted from the highest to the lowest rate.
 */
export function calculateTotals(items: readonly LineItem[]): QuoteTotals {
  let gross = 0;
  let discount = 0;
  const bases = new Map<VatRate, number>();

  for (const item of items) {
    const line = calculateLine(item);
    gross += line.gross;
    discount += line.discount;
    bases.set(item.vatRate, (bases.get(item.vatRate) ?? 0) + line.net);
  }

  const vatBreakdown: VatBreakdownRow[] = [...bases.entries()]
    .map(([rate, base]) => {
      const roundedBase = roundCurrency(base);
      return { rate, base: roundedBase, vat: roundCurrency((roundedBase * rate) / 100) };
    })
    .filter((row) => row.base !== 0)
    .sort((a, b) => b.rate - a.rate);

  const base = roundCurrency(vatBreakdown.reduce((sum, row) => sum + row.base, 0));
  const vat = roundCurrency(vatBreakdown.reduce((sum, row) => sum + row.vat, 0));

  return {
    gross: roundCurrency(gross),
    discount: roundCurrency(discount),
    base,
    vatBreakdown,
    vat,
    total: roundCurrency(base + vat),
  };
}
