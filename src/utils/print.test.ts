import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSeedData } from '../lib/seed';
import { pdfTitle, printQuote } from './print';

const seed = createSeedData('2026-03-10', '2026-03-10T09:00:00.000Z');
const quote = seed.quotes[0]!;
const client = seed.clients[0]!;

describe('pdfTitle', () => {
  it('includes the quote number and client name', () => {
    expect(pdfTitle(quote, client)).toBe('Presupuesto 2026-0001 - Panadería La Espiga Ficticia');
  });

  it('omits the client when there is none and strips invalid file name characters', () => {
    expect(pdfTitle(quote, null)).toBe('Presupuesto 2026-0001');
    expect(pdfTitle(quote, { ...client, name: 'A/B: "C"' })).toBe(
      'Presupuesto 2026-0001 - A-B- -C-',
    );
  });
});

describe('printQuote', () => {
  afterEach(() => vi.useRealTimers());

  it('sets the document title while printing and restores it afterwards', () => {
    vi.useFakeTimers();
    document.title = 'App';
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      expect(document.title).toBe('Presupuesto 2026-0001 - Panadería La Espiga Ficticia');
    });

    printQuote(quote, client);
    expect(print).toHaveBeenCalledOnce();

    window.dispatchEvent(new Event('afterprint'));
    expect(document.title).toBe('App');
    vi.runAllTimers();
    expect(document.title).toBe('App');
  });
});
