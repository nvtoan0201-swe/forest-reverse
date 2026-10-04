import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

if (typeof window !== 'undefined') {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  window.HTMLCanvasElement.prototype.getContext = (() => null) as never;
}
