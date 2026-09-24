import { useState, type ReactNode } from 'react';
import { createAppStore, type AppStore } from './appStore';
import { AppStoreContext } from './context';

interface AppStoreProviderProps {
  children: ReactNode;
  /** Inject a pre-built store (tests). Defaults to one backed by localStorage. */
  store?: AppStore;
}

export function AppStoreProvider({ children, store: injected }: AppStoreProviderProps) {
  const [store] = useState(() => injected ?? createAppStore());
  return <AppStoreContext value={store}>{children}</AppStoreContext>;
}
