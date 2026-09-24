import { describe, expect, it } from 'vitest';
import { createQuote, duplicateQuote, type FactoryContext } from './quotes';
import { reducer } from './reducer';
import { createSeedData } from './seed';
import { createEmptyData, type Quote } from './types';

function ctx(today = '2026-03-10'): FactoryContext {
  let n = 0;
  return { makeId: () => `id-${++n}`, today, now: `${today}T09:00:00.000Z` };
}

describe('createQuote', () => {
  it('creates a draft with the first number of the year and one empty line', () => {
    const quote = createQuote([], ctx());
    expect(quote.number).toBe('2026-0001');
    expect(quote.status).toBe('draft');
    expect(quote.issueDate).toBe('2026-03-10');
    expect(quote.validUntil).toBe('2026-04-09');
    expect(quote.items).toHaveLength(1);
    expect(quote.items[0]).toMatchObject({ quantity: 1, unitPrice: 0, discount: 0, vatRate: 21 });
  });

  it('numbers sequentially per year', () => {
    const first = createQuote([], ctx());
    const second = createQuote([first], ctx());
    expect(second.number).toBe('2026-0002');
    expect(createQuote([first, second], ctx('2027-01-02')).number).toBe('2027-0001');
  });
});

describe('duplicateQuote', () => {
  it('copies content into a new draft with a new number and fresh ids', () => {
    const source: Quote = {
      ...createQuote([], ctx('2026-01-01')),
      id: 'original',
      status: 'accepted',
      clientId: 'client-1',
      validUntil: '2026-01-16',
      notes: 'Condiciones',
    };
    const copy = duplicateQuote(source, [source], { ...ctx('2026-05-01'), makeId: () => 'new' });

    expect(copy.id).toBe('new');
    expect(copy.number).toBe('2026-0002');
    expect(copy.status).toBe('draft');
    expect(copy.clientId).toBe('client-1');
    expect(copy.notes).toBe('Condiciones');
    expect(copy.issueDate).toBe('2026-05-01');
    expect(copy.validUntil).toBe('2026-05-16'); // keeps the 15-day validity window
    expect(copy.items.map((i) => i.id)).toEqual(['new']);
    expect(copy.items[0]?.description).toBe(source.items[0]?.description);
  });
});

describe('reducer', () => {
  const seed = createSeedData('2026-03-10', '2026-03-10T09:00:00.000Z');

  it('upserts clients and quotes', () => {
    const client = { id: 'c2', name: 'Nuevo', taxId: '', email: '', phone: '', address: '' };
    const added = reducer(seed, { type: 'client/save', client });
    expect(added.clients).toHaveLength(2);
    const renamed = reducer(added, { type: 'client/save', client: { ...client, name: 'Otro' } });
    expect(renamed.clients).toHaveLength(2);
    expect(renamed.clients[1]?.name).toBe('Otro');
  });

  it('unlinks quotes when their client is deleted', () => {
    const next = reducer(seed, { type: 'client/delete', id: 'seed-client-1' });
    expect(next.clients).toHaveLength(0);
    expect(next.quotes[0]?.clientId).toBeNull();
  });

  it('returns the same state when deleting something that does not exist', () => {
    expect(reducer(seed, { type: 'quote/delete', id: 'missing' })).toBe(seed);
    expect(reducer(seed, { type: 'client/delete', id: 'missing' })).toBe(seed);
  });

  it('deletes quotes and replaces all data', () => {
    expect(reducer(seed, { type: 'quote/delete', id: 'seed-quote-1' }).quotes).toHaveLength(0);
    const empty = createEmptyData();
    expect(reducer(seed, { type: 'data/replace', data: empty })).toBe(empty);
  });
});
