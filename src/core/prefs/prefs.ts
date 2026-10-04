import type { UDKey } from './UDKeys';

const PREFIX = 'forest:';
const listeners = new Set<(key: UDKey) => void>();

function storageKey(key: UDKey): string {
  return `${PREFIX}${key}`;
}

export const prefs = {
  get<T>(key: UDKey, fallback: T): T {
    try {
      const raw = localStorage.getItem(storageKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: UDKey, value: T): void {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch {
      // storage full / private mode: preferences are best-effort
    }
    listeners.forEach((fn) => fn(key));
  },
  remove(key: UDKey): void {
    localStorage.removeItem(storageKey(key));
    listeners.forEach((fn) => fn(key));
  },
  subscribe(fn: (key: UDKey) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
