import { createContext, use, useSyncExternalStore } from 'react';
import type { AppStore, StoreState } from './appStore';

export const AppStoreContext = createContext<AppStore | null>(null);

function useStore(): AppStore {
  const store = use(AppStoreContext);
  if (!store) throw new Error('useAppState/useAppActions must be used inside <AppStoreProvider>');
  return store;
}

/** Subscribes to the whole store state (data + persistence status). */
export function useAppState(): StoreState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Stable action creators (identity never changes). */
export function useAppActions(): AppStore['actions'] {
  return useStore().actions;
}
