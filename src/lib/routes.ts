/**
 * Minimal hash-based routing. Hash routes work on GitHub Pages without any
 * server-side rewrites, which keeps the app 100% static.
 */
export type Route =
  | { name: 'quotes' }
  | { name: 'quote'; id: string }
  | { name: 'clients' }
  | { name: 'company' }
  | { name: 'data' }
  | { name: 'notFound' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'quotes' };

  const [first, second, ...rest] = segments;
  if (rest.length > 0) return { name: 'notFound' };

  switch (first) {
    case 'quotes':
      return second ? { name: 'quote', id: decodeURIComponent(second) } : { name: 'quotes' };
    case 'clients':
      return second ? { name: 'notFound' } : { name: 'clients' };
    case 'company':
      return second ? { name: 'notFound' } : { name: 'company' };
    case 'data':
      return second ? { name: 'notFound' } : { name: 'data' };
    default:
      return { name: 'notFound' };
  }
}

export const paths = {
  quotes: () => '#/quotes',
  quote: (id: string) => `#/quotes/${encodeURIComponent(id)}`,
  clients: () => '#/clients',
  company: () => '#/company',
  data: () => '#/data',
};
