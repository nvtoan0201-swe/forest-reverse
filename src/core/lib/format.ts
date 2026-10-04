export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

/** mm:ss from a count of seconds (clamped at zero). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(sec)}`;
  return `${pad2(m)}:${pad2(sec)}`;
}

export function formatMinutes(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatTimeOfDay(epochMs: number, locale = 'en'): string {
  return new Date(epochMs).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDayHeader(epochMs: number, locale = 'en'): string {
  return new Date(epochMs).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function startOfDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(epochMs: number, days: number): number {
  const d = new Date(epochMs);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function dayKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
