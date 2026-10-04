/**
 * Resolves tree artwork URLs by convention. Placeholder assets are generated
 * by scripts/extract-assets.mjs as <ext>; original mode may use webp.
 */
const EXTENSIONS = ['svg', 'webp', 'png'] as const;

export interface TreeAssetResolver {
  phaseUrl(gid: number, phase: number, skin?: 'default' | 'xmas'): string;
  deadUrl(gid: number): string;
  productUrl(gid: number): string;
  placeholderUrl(): string;
}

export class LocalTreeAssetResolver implements TreeAssetResolver {
  constructor(private base = 'assets/trees') {}

  private url(gid: number, name: string): string {
    // The resolver cannot probe the filesystem synchronously; the generated
    // manifest is always svg in placeholder mode and webp in original mode.
    const ext = import.meta.env.VITE_ASSET_MODE === 'original' ? 'webp' : 'svg';
    return `${this.base}/${gid}/${name}.${ext}`;
  }

  phaseUrl(gid: number, phase: number, skin: 'default' | 'xmas' = 'default'): string {
    const clamped = Math.min(7, Math.max(1, Math.floor(phase) + 1));
    const suffix = skin === 'xmas' ? '_christmas' : '';
    return this.url(gid, `phase_${clamped}${suffix}`);
  }

  deadUrl(gid: number): string {
    return this.url(gid, 'dead');
  }

  productUrl(gid: number): string {
    return this.url(gid, 'product');
  }

  /** Fallback used when a specific gid has no art. */
  placeholderUrl(): string {
    return `${this.base}/placeholder.svg`;
  }
}

export const EXT = EXTENSIONS;
