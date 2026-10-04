import { useCallback, useSyncExternalStore } from 'react';
import type { UDKey } from './UDKeys';
import { prefs } from './prefs';

function subscribe(callback: () => void): () => void {
  return prefs.subscribe(() => callback());
}

function readRaw(key: UDKey): string | null {
  try {
    return localStorage.getItem(`forest:${key}`);
  } catch {
    return null;
  }
}

/** Reactive preference hook (localStorage-backed, JSON values). */
export function usePref<T>(key: UDKey, fallback: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key));
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  const setValue = useCallback((next: T) => prefs.set(key, next), [key]);
  return [value, setValue];
}
