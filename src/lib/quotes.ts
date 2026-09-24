import { addDays } from './dates';
import { nextQuoteNumber } from './numbering';
import type { LineItem, Quote, QuoteStatus, VatRate } from './types';

export const DEFAULT_VALIDITY_DAYS = 30;
export const DEFAULT_VAT_RATE: VatRate = 21;

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

export const DEFAULT_TERMS =
  'Forma de pago: 50 % a la aceptación y 50 % a la entrega, mediante transferencia bancaria.';

/** Context injected into factories so they stay pure and testable. */
export interface FactoryContext {
  makeId: () => string;
  /** Today's date as `YYYY-MM-DD`. */
  today: string;
  /** Current timestamp (ISO). */
  now: string;
}

export function createLineItem(
  makeId: () => string,
  vatRate: VatRate = DEFAULT_VAT_RATE,
): LineItem {
  return { id: makeId(), description: '', quantity: 1, unitPrice: 0, discount: 0, vatRate };
}

function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4));
}

/** Creates a new draft quote with the next available number for the current year. */
export function createQuote(existing: readonly Quote[], ctx: FactoryContext): Quote {
  return {
    id: ctx.makeId(),
    number: nextQuoteNumber(
      existing.map((q) => q.number),
      yearOf(ctx.today),
    ),
    clientId: null,
    status: 'draft',
    issueDate: ctx.today,
    validUntil: addDays(ctx.today, DEFAULT_VALIDITY_DAYS),
    items: [createLineItem(ctx.makeId)],
    notes: DEFAULT_TERMS,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
}

/**
 * Copies a quote as a new draft: new id and number, today's date, same
 * validity window, and fresh ids for every line.
 */
export function duplicateQuote(
  source: Quote,
  existing: readonly Quote[],
  ctx: FactoryContext,
): Quote {
  const created = createQuote(existing, ctx);
  const validityDays = daysBetween(source.issueDate, source.validUntil) ?? DEFAULT_VALIDITY_DAYS;
  return {
    ...created,
    clientId: source.clientId,
    validUntil: addDays(ctx.today, validityDays),
    notes: source.notes,
    items: source.items.map((item) => ({ ...item, id: ctx.makeId() })),
  };
}

function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000);
}
