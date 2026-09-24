import { describe, expect, it } from 'vitest';
import { parseHash, paths } from './routes';

describe('parseHash', () => {
  it('defaults to the quotes list for an empty hash', () => {
    expect(parseHash('')).toEqual({ name: 'quotes' });
    expect(parseHash('#')).toEqual({ name: 'quotes' });
    expect(parseHash('#/')).toEqual({ name: 'quotes' });
  });

  it('parses top-level sections, ignoring trailing slashes', () => {
    expect(parseHash('#/quotes/')).toEqual({ name: 'quotes' });
    expect(parseHash('#/clients')).toEqual({ name: 'clients' });
    expect(parseHash('#/company')).toEqual({ name: 'company' });
    expect(parseHash('#/data')).toEqual({ name: 'data' });
  });

  it('parses a quote detail route and round-trips encoded ids', () => {
    expect(parseHash('#/quotes/abc-123')).toEqual({ name: 'quote', id: 'abc-123' });
    expect(parseHash(paths.quote('a b/c'))).toEqual({ name: 'quote', id: 'a b/c' });
  });

  it('returns notFound for unknown or too-deep paths', () => {
    expect(parseHash('#/nope')).toEqual({ name: 'notFound' });
    expect(parseHash('#/clients/1')).toEqual({ name: 'notFound' });
    expect(parseHash('#/quotes/1/extra')).toEqual({ name: 'notFound' });
  });
});
