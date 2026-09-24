import { useSyncExternalStore } from 'react';
import { parseHash, type Route } from '../lib/routes';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

/** Current route derived from `location.hash`, re-rendering on navigation. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return parseHash(hash);
}

export function navigate(hash: string) {
  window.location.hash = hash;
}
