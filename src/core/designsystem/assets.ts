import { config } from '../config';
import iconMapRaw from '../../assets/catalog/icon-map.generated.json';

/**
 * Central asset resolver (plans/05 P-107). Every component resolves asset URLs
 * through this module so switching ASSET_MODE never requires touching call sites.
 *
 * - `original`    -> /assets-original/** (local dev only, never committed)
 * - `placeholder` -> /assets/**       (self-authored, safe to ship)
 */
export type AssetMode = 'original' | 'placeholder';

export const isOriginalMode = config.assetMode === 'original';
export const ASSET_BASE = isOriginalMode ? 'assets-original' : 'assets';

export interface IconAsset {
  field: string | null;
  id: string;
  resource: string;
  file: string | null;
  density: string | null;
}

export const ICON_MAP = iconMapRaw as Record<string, IconAsset>;

/** Absolute URL inside the active asset base. */
export function assetUrl(path: string): string {
  return `/${ASSET_BASE}/${path}`;
}

/** Original icon file for a semantic name, or null when not mapped. */
export function iconFile(semantic: string): string | null {
  return ICON_MAP[semantic]?.file ?? null;
}

/**
 * URL of the original raster/vector icon. Returns null in placeholder mode or
 * when the semantic name has no mapping so callers fall back to the SVG set.
 */
export function iconUrl(semantic: string): string | null {
  if (!isOriginalMode) return null;
  const file = iconFile(semantic);
  return file ? assetUrl(`icons/${file}`) : null;
}

export function uiUrl(file: string): string {
  return assetUrl(`ui/${file}`);
}

/** Ground/base artwork of the PlantBall (original webp vs placeholder svg). */
export function plantBallUrl(): string {
  return uiUrl(isOriginalMode ? 'plant_ball.webp' : 'plant_ball.svg');
}

export function groundPieceXmasUrl(): string {
  return uiUrl(isOriginalMode ? 'ground_piece_xmas.webp' : 'ground_piece_xmas.svg');
}

export function drawerLogoUrl(): string {
  return uiUrl(isOriginalMode ? 'web_logo.webp' : 'web_logo.svg');
}

export function soundCoverUrl(file: string): string {
  return assetUrl(`ui/sounds/${file}`);
}

/** Verified gid -> cover art mapping (drawable-xxhdpi sound_*.webp). */
const SOUND_COVERS: Record<number, string> = {
  0: 'sound_forest_rain.webp',
  1: 'sound_paris_cafe.webp',
  2: 'sound_thunder.webp',
  3: 'sound_time_square.webp',
  4: 'sound_night_forest.webp',
  5: 'sound_sandy_beach.webp',
  6: 'sound_lofi_i_6.webp',
  7: 'sound_lofi_i_7.webp',
  8: 'sound_lofi_i_8.webp',
  9: 'sound_lofi_ii_9.webp',
  10: 'sound_lofi_ii_10.webp',
  11: 'sound_lofi_ii_11.webp',
  12: 'sound_lofi_iii_12.webp',
  13: 'sound_lofi_iii_13.webp',
  14: 'sound_lofi_iii_14.webp',
  15: 'sound_crackling_fire.webp',
  16: 'sound_waterfall_white.webp',
  17: 'sound_waterfall_brown.webp',
  18: 'sound_japanese_garden.webp',
  19: 'sound_waterfall_pink.webp',
  20: 'ambient_sound_20.webp',
  21: 'sound_binaural_beats_8hz.webp',
  22: 'sound_binaural_beats_16hz.webp',
};

/** Cover art for an ambient sound gid (original mode only). */
export function soundCoverFor(gid: number): string | null {
  if (!isOriginalMode) return null;
  const file = SOUND_COVERS[gid];
  return file ? soundCoverUrl(file) : null;
}

export function landingUrl(): string {
  return assetUrl('ui/landing.html');
}

export function riveUrl(name: string): string {
  return assetUrl(`ui/${name}.riv`);
}

export function lottieUrl(name: string): string {
  return assetUrl(`ui/${name}.json`);
}

/** Tree artwork file name for the active mode (placeholder art is always SVG). */
export function treeFileName(name: string, ext?: string): string {
  if (ext) return `${name}.${ext}`;
  return `${name}.${isOriginalMode ? 'webp' : 'svg'}`;
}

export function treeUrl(gid: number, name: string, ext?: string): string {
  return assetUrl(`trees/${gid}/${treeFileName(name, ext)}`);
}

/**
 * Original tree art may still be PNG when ImageMagick was unavailable during
 * extraction; components retry with this URL on load error.
 */
export function treeFallbackUrl(gid: number, name: string): string | null {
  if (!isOriginalMode) return null;
  return assetUrl(`trees/${gid}/${name}.png`);
}

export function treeAnimUrl(gid: number, group: string, index: number): string {
  const idx = String(index).padStart(2, '0');
  return assetUrl(`trees/${gid}/anim/${group}_${idx}.webp`);
}

const SFX_FILES: Record<string, { original: string; placeholder: string }> = {
  click: { original: 'sounds/sfx/click.ogg', placeholder: 'sounds/sfx/click.wav' },
  slide: { original: 'sounds/sfx/slide.ogg', placeholder: 'sounds/sfx/slide.wav' },
  tree0: { original: 'sounds/sfx/tree0.ogg', placeholder: 'sounds/sfx/tree0.wav' },
  tree1: { original: 'sounds/sfx/tree1.ogg', placeholder: 'sounds/sfx/tree1.wav' },
  tree2: { original: 'sounds/sfx/tree2.ogg', placeholder: 'sounds/sfx/tree2.wav' },
  ring: { original: 'sounds/sfx/ring.ogg', placeholder: 'sounds/sfx/ring.wav' },
};

export function ambientSoundUrl(gid: number): string {
  return assetUrl(`sounds/ambient/${gid}.${isOriginalMode ? 'ogg' : 'wav'}`);
}

export function sfxUrl(name: string): string {
  const entry = SFX_FILES[name];
  if (!entry) throw new Error(`Unknown sfx: ${name}`);
  return assetUrl(isOriginalMode ? entry.original : entry.placeholder);
}

export const FONT_SOURCES = {
  regular: '/fonts/source_sans_pro_regular.ttf',
  semibold: '/fonts/source_sans_pro_semibold.ttf',
  bold: '/fonts/source_sans_pro_bold.ttf',
  black: '/fonts/source_sans_pro_black.ttf',
  numbers: '/fonts/roboto_medium_numbers.ttf',
} as const;
