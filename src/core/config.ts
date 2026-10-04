/**
 * Global, compile-time constants. Everything tunable lives here (docs/02 §8).
 * Values come from the parity spec (docs/01, docs/05) but the app never
 * depends on private data at runtime.
 */
export const config = {
  fastPlant: import.meta.env.VITE_FAST_PLANT === '1',
  killOnTabHidden: false,
  maxPlantSecondsDefault: 7200,
  maxPlantSecondsThreeHours: 10800,
  assetMode: (import.meta.env.VITE_ASSET_MODE ?? 'placeholder') as 'original' | 'placeholder',
  dailyFocusLimitFree: 180,
  tickIntervalMs: 1000,
  devPanel: import.meta.env.DEV,
  version: 'web-0.1.0-mvp',
} as const;

export const FAST_PLANT_DIVISOR = 60;

/** In fast-plant mode every duration is divided so E2E tests run in seconds. */
export function effectivePlantSeconds(requestedSeconds: number): number {
  return config.fastPlant ? Math.max(5, Math.round(requestedSeconds / FAST_PLANT_DIVISOR)) : requestedSeconds;
}
