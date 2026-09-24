import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import type { KeyValueStorage } from '../lib/storage';
import { createAppStore } from '../store/appStore';
import { AppStoreProvider } from '../store/AppStoreProvider';

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
  };
}

/** Renders `ui` with a fresh store seeded with the example data (fixed date). */
export function renderWithStore(ui: ReactElement) {
  let n = 0;
  const store = createAppStore({
    storage: memoryStorage(),
    clock: () => new Date('2026-03-10T09:00:00.000Z'),
    makeId: () => `test-id-${++n}`,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStoreProvider store={store}>{children}</AppStoreProvider>
  );
  const result = render(ui, { wrapper });
  return { ...result, store };
}
