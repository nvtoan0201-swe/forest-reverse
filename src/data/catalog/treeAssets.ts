import { isOriginalMode, treeUrl } from '../../core/designsystem/assets';

export interface TreeAssetResolver {
  phaseUrl(gid: number, phase: number, skin?: 'default' | 'xmas'): string;
  deadUrl(gid: number): string;
  productUrl(gid: number): string;
  placeholderUrl(): string;
  fallbackUrl(gid: number, name: string): string | null;
}

export class LocalTreeAssetResolver implements TreeAssetResolver {
  private url(gid: number, name: string): string {
    return treeUrl(gid, name);
  }

  phaseUrl(gid: number, phase: number, skin: 'default' | 'xmas' = 'default'): string {
    const clamped = Math.min(7, Math.max(1, Math.floor(phase) + 1));
    const name = skin === 'xmas' ? `phase_${clamped}_christmas` : `phase_${clamped}`;
    return this.url(gid, name);
  }

  deadUrl(gid: number): string {
    return this.url(gid, 'dead');
  }

  productUrl(gid: number): string {
    return this.url(gid, 'product');
  }

  /** Fallback used when a specific gid has no art. */
  placeholderUrl(): string {
    return isOriginalMode ? this.url(0, 'phase_1') : `${'assets'}/trees/placeholder.svg`;
  }

  /** Original-mode trees may be PNG when WebP conversion was unavailable. */
  fallbackUrl(gid: number, name: string): string | null {
    if (!isOriginalMode) return null;
    return treeUrl(gid, name, 'png');
  }
}

export const EXT = ['svg', 'webp', 'png'] as const;
