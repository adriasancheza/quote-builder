import { validateData } from './backup';
import type { AppData } from './types';

export const STORAGE_KEY = 'quote-builder:data';

/** Minimal subset of the Web Storage API, so tests can pass an in-memory fake. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type LoadResult =
  { status: 'empty' } | { status: 'ok'; data: AppData } | { status: 'corrupt'; error: string };

export function loadData(storage: KeyValueStorage): LoadResult {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null || raw === '') return { status: 'empty' };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', error: 'Los datos guardados no son un JSON válido.' };
  }
  const result = validateData(json);
  return result.ok
    ? { status: 'ok', data: result.data }
    : { status: 'corrupt', error: result.error };
}

/** Persists data. Throws if the browser rejects the write (e.g. quota exceeded). */
export function saveData(storage: KeyValueStorage, data: AppData): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
