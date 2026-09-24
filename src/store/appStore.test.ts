import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, type KeyValueStorage } from '../lib/storage';
import { createAppStore } from './appStore';

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage: KeyValueStorage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
  };
  return { storage, map };
}

const clock = () => new Date('2026-03-10T09:00:00.000Z');

function idFactory() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('createAppStore', () => {
  it('seeds example data on first run and persists it', () => {
    const { storage, map } = memoryStorage();
    const store = createAppStore({ storage, clock, makeId: idFactory() });
    const { data } = store.getState();
    expect(data.company.name).not.toBe('');
    expect(data.quotes).toHaveLength(1);
    expect(data.quotes[0]?.number).toBe('2026-0001');
    expect(map.has(STORAGE_KEY)).toBe(true);
  });

  it('does not seed when data already exists', () => {
    const { storage } = memoryStorage();
    const first = createAppStore({ storage, clock, makeId: idFactory() });
    first.actions.deleteQuote('seed-quote-1');
    const second = createAppStore({ storage, clock, makeId: idFactory() });
    expect(second.getState().data.quotes).toHaveLength(0);
  });

  it('keeps a copy of corrupt data and starts empty', () => {
    const { storage, map } = memoryStorage({ [STORAGE_KEY]: '{broken' });
    const store = createAppStore({ storage, clock });
    expect(store.getState().data.quotes).toHaveLength(0);
    expect(store.getState().loadNotice).toMatch(/copia/);
    expect(map.get(`${STORAGE_KEY}:corrupt`)).toBe('{broken');
  });

  it('creates, duplicates and deletes quotes, notifying subscribers', () => {
    const { storage } = memoryStorage();
    const store = createAppStore({ storage, clock, makeId: idFactory() });
    let notifications = 0;
    store.subscribe(() => notifications++);

    const created = store.actions.createQuote();
    expect(created.number).toBe('2026-0002');
    const copy = store.actions.duplicateQuote(created.id);
    expect(copy?.number).toBe('2026-0003');
    store.actions.deleteQuote(created.id);

    expect(store.getState().data.quotes.map((q) => q.number)).toEqual(['2026-0001', '2026-0003']);
    expect(notifications).toBe(3);
  });

  it('reports a save error when storage is full', () => {
    const { storage } = memoryStorage();
    const store = createAppStore({ storage, clock, makeId: idFactory() });
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
    store.actions.createQuote();
    expect(store.getState().saveError).toMatch(/almacenamiento/);
  });
});
