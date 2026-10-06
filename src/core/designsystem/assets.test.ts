import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadWithMode(mode: 'original' | 'placeholder') {
  vi.stubEnv('VITE_ASSET_MODE', mode);
  vi.resetModules();
  return import('./assets');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('asset resolver (placeholder mode)', () => {
  it('uses the public placeholder base and svg trees', async () => {
    const assets = await loadWithMode('placeholder');
    expect(assets.ASSET_BASE).toBe('assets');
    expect(assets.treeUrl(7, 'dead')).toBe('/assets/trees/7/dead.svg');
    expect(assets.treeFallbackUrl(7, 'dead')).toBeNull();
    expect(assets.sfxUrl('click')).toBe('/assets/sounds/sfx/click.wav');
    expect(assets.ambientSoundUrl(3)).toBe('/assets/sounds/ambient/3.wav');
    expect(assets.iconUrl('menu')).toBeNull();
  });
});

describe('asset resolver (original mode)', () => {
  it('uses the local-only base and original file names', async () => {
    const assets = await loadWithMode('original');
    expect(assets.ASSET_BASE).toBe('assets-original');
    expect(assets.iconUrl('menu')).toBe('/assets-original/icons/menu_btn.webp');
    expect(assets.iconFile('modeFocusOn')).toBe('ic_focus_mode.svg');
    expect(assets.treeUrl(7, 'phase_1')).toBe('/assets-original/trees/7/phase_1.webp');
    expect(assets.treeFallbackUrl(7, 'phase_1')).toBe('/assets-original/trees/7/phase_1.png');
    expect(assets.sfxUrl('tree1')).toBe('/assets-original/sounds/sfx/tree1.ogg');
    expect(assets.ambientSoundUrl(0)).toBe('/assets-original/sounds/ambient/0.ogg');
    expect(assets.landingUrl()).toBe('/assets-original/ui/landing.html');
    expect(assets.uiUrl('plant_ball.webp')).toBe('/assets-original/ui/plant_ball.webp');
  });

  it('throws for unknown sfx names', async () => {
    const assets = await loadWithMode('original');
    expect(() => assets.sfxUrl('nope')).toThrow(/Unknown sfx/);
  });
});
