import { getDB } from './db/database';

/** Minimal local analytics: ring buffer of events, never sent anywhere. */
const MAX_EVENTS = 500;
const buffer: string[] = [];

export function track(name: string, data?: Record<string, unknown>): void {
  buffer.push(name);
  if (buffer.length > MAX_EVENTS) buffer.shift();
  try {
    void getDB().eventLog.add({ name, at: Date.now(), data: data ? JSON.stringify(data) : undefined });
  } catch {
    // logging must never break the app
  }
}

export function recentEvents(): readonly string[] {
  return buffer;
}
