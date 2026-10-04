import { SESSION_CLOSED_KEY, SESSION_SNAPSHOT_KEY } from '../../features/plant/domain/constants';
import type { PlantMode } from '../../data/types';

export interface OngoingSnapshot {
  plantId: number;
  startTime: number;
  endTime: number;
  plantTime: number;
  mode: PlantMode;
  speciesId: number;
  lastTickAt: number;
}

export function saveSnapshot(snapshot: OngoingSnapshot): void {
  try {
    localStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(snapshot));
    localStorage.removeItem(SESSION_CLOSED_KEY);
  } catch {
    // best-effort
  }
}

export function loadSnapshot(): OngoingSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as OngoingSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(SESSION_SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}

/**
 * pagehide/beforeunload marks the session as "closed". On next launch an
 * unfinished snapshot + closed flag means the app died mid-session → KILL_APP.
 */
export function markSessionClosed(): void {
  if (localStorage.getItem(SESSION_SNAPSHOT_KEY)) {
    localStorage.setItem(SESSION_CLOSED_KEY, '1');
  }
}

export function wasSessionClosed(): boolean {
  return localStorage.getItem(SESSION_CLOSED_KEY) === '1';
}

export function clearClosedFlag(): void {
  localStorage.removeItem(SESSION_CLOSED_KEY);
}
