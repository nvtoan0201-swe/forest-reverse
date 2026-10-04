const DEBUG = import.meta.env.DEV;

export const logger = {
  debug(...args: unknown[]): void {
    if (DEBUG) console.debug('[forest]', ...args);
  },
  info(...args: unknown[]): void {
    if (DEBUG) console.info('[forest]', ...args);
  },
  warn(...args: unknown[]): void {
    console.warn('[forest]', ...args);
  },
  error(...args: unknown[]): void {
    console.error('[forest]', ...args);
  },
};
