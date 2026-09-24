import type { AppData, Client, CompanyProfile, Quote } from './types';

export type Action =
  | { type: 'company/update'; company: CompanyProfile }
  | { type: 'client/save'; client: Client }
  | { type: 'client/delete'; id: string }
  | { type: 'quote/save'; quote: Quote }
  | { type: 'quote/delete'; id: string }
  | { type: 'data/replace'; data: AppData };

function upsert<T extends { id: string }>(list: readonly T[], entity: T): T[] {
  const index = list.findIndex((item) => item.id === entity.id);
  if (index === -1) return [...list, entity];
  const next = [...list];
  next[index] = entity;
  return next;
}

/** Pure state transitions for the whole app. IDs and timestamps come in via actions. */
export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'company/update':
      return { ...state, company: action.company };
    case 'client/save':
      return { ...state, clients: upsert(state.clients, action.client) };
    case 'client/delete': {
      if (!state.clients.some((c) => c.id === action.id)) return state;
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.id),
        // Keep the quotes, but unlink the removed client.
        quotes: state.quotes.map((q) => (q.clientId === action.id ? { ...q, clientId: null } : q)),
      };
    }
    case 'quote/save':
      return { ...state, quotes: upsert(state.quotes, action.quote) };
    case 'quote/delete':
      if (!state.quotes.some((q) => q.id === action.id)) return state;
      return { ...state, quotes: state.quotes.filter((q) => q.id !== action.id) };
    case 'data/replace':
      return action.data;
  }
}
