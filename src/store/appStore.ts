import { toISODate } from '../lib/dates';
import { createId } from '../lib/id';
import { createQuote, duplicateQuote, type FactoryContext } from '../lib/quotes';
import { reducer, type Action } from '../lib/reducer';
import { createSeedData } from '../lib/seed';
import { STORAGE_KEY, loadData, saveData, type KeyValueStorage } from '../lib/storage';
import {
  createEmptyData,
  type AppData,
  type Client,
  type CompanyProfile,
  type Quote,
} from '../lib/types';

export interface StoreState {
  data: AppData;
  /** Set when the last write to storage failed (e.g. quota exceeded). */
  saveError: string | null;
  /** Informational message produced while loading (e.g. corrupt data recovered). */
  loadNotice: string | null;
}

export interface AppStore {
  getState: () => StoreState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: Action) => void;
  actions: ReturnType<typeof createActions>;
}

export interface StoreOptions {
  storage?: KeyValueStorage | null;
  /** Clock + id generator, injectable for tests. */
  clock?: () => Date;
  makeId?: () => string;
}

function getBrowserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // Storage can throw in privacy modes.
  }
}

export function createAppStore(options: StoreOptions = {}): AppStore {
  const storage = options.storage === undefined ? getBrowserStorage() : options.storage;
  const clock = options.clock ?? (() => new Date());
  const makeId = options.makeId ?? createId;
  const context = (): FactoryContext => {
    const date = clock();
    return { makeId, today: toISODate(date), now: date.toISOString() };
  };

  let state = initialState();
  const listeners = new Set<() => void>();

  function initialState(): StoreState {
    if (!storage) {
      const { today, now } = context();
      return {
        data: createSeedData(today, now),
        saveError: 'Este navegador no permite guardar datos: los cambios se perderán al cerrar.',
        loadNotice: null,
      };
    }
    const loaded = loadData(storage);
    if (loaded.status === 'ok') return { data: loaded.data, saveError: null, loadNotice: null };
    if (loaded.status === 'empty') {
      const { today, now } = context();
      const data = createSeedData(today, now);
      const saveError = persist(data);
      return { data, saveError, loadNotice: null };
    }
    // Corrupt data: keep a copy so nothing is lost, and start empty (no seed).
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw !== null) storage.setItem(`${STORAGE_KEY}:corrupt`, raw);
    } catch {
      /* best effort */
    }
    return {
      data: createEmptyData(),
      saveError: null,
      loadNotice: `No se pudieron leer los datos guardados (${loaded.error}). Se ha guardado una copia y se ha empezado de cero.`,
    };
  }

  function persist(data: AppData): string | null {
    if (!storage) return state.saveError;
    try {
      saveData(storage, data);
      return null;
    } catch {
      return 'No se han podido guardar los cambios: el almacenamiento del navegador está lleno. Prueba con un logotipo más ligero.';
    }
  }

  function dispatch(action: Action) {
    const data = reducer(state.data, action);
    if (data === state.data) return;
    state = { ...state, data, saveError: persist(data) };
    listeners.forEach((listener) => listener());
  }

  const store: AppStore = {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch,
    actions: createActions(dispatch, () => state, context),
  };
  return store;
}

function createActions(
  dispatch: (action: Action) => void,
  getState: () => StoreState,
  context: () => FactoryContext,
) {
  return {
    updateCompany: (company: CompanyProfile) => {
      dispatch({ type: 'company/update', company });
    },
    saveClient: (client: Omit<Client, 'id'> & { id?: string }): Client => {
      const saved: Client = { ...client, id: client.id ?? context().makeId() };
      dispatch({ type: 'client/save', client: saved });
      return saved;
    },
    deleteClient: (id: string) => {
      dispatch({ type: 'client/delete', id });
    },
    createQuote: (): Quote => {
      const quote = createQuote(getState().data.quotes, context());
      dispatch({ type: 'quote/save', quote });
      return quote;
    },
    saveQuote: (quote: Quote) => {
      dispatch({ type: 'quote/save', quote: { ...quote, updatedAt: context().now } });
    },
    duplicateQuote: (id: string): Quote | null => {
      const { quotes } = getState().data;
      const source = quotes.find((q) => q.id === id);
      if (!source) return null;
      const copy = duplicateQuote(source, quotes, context());
      dispatch({ type: 'quote/save', quote: copy });
      return copy;
    },
    deleteQuote: (id: string) => {
      dispatch({ type: 'quote/delete', id });
    },
    replaceData: (data: AppData) => {
      dispatch({ type: 'data/replace', data });
    },
  };
}
