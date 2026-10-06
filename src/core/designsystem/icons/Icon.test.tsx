import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Icon, ICON_PATHS, ORIGINAL_ICON_KEYS } from './Icon';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Icon', () => {
  it('renders the inline SVG set in placeholder mode', () => {
    const { container } = render(<Icon name="menu" size={24} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the original drawable as an img in original mode', async () => {
    vi.stubEnv('VITE_ASSET_MODE', 'original');
    vi.resetModules();
    const mod = await import('./Icon');
    const { container } = render(<mod.Icon name="menu" size={40} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/assets-original/icons/menu_btn.webp');
    expect(img?.getAttribute('width')).toBe('40');
  });

  it('falls back to SVG for icons without an original mapping', async () => {
    vi.stubEnv('VITE_ASSET_MODE', 'original');
    vi.resetModules();
    const mod = await import('./Icon');
    const { container } = render(<mod.Icon name="close" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('every mapped icon exists in the generated icon map', async () => {
    const assets = await import('../assets');
    for (const [name, semantic] of Object.entries(ORIGINAL_ICON_KEYS)) {
      expect(Object.keys(ICON_PATHS)).toContain(name);
      expect(assets.ICON_MAP[semantic as string], `${name} -> ${semantic}`).toBeDefined();
    }
  });
});
