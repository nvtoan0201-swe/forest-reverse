/**
 * Tree growth phase. Closed-form port of the documented behaviour:
 *   iMax = max(600, min(plantTime, 1800))
 *   raw  = past < iMax ? floor(past*3/iMax) : floor(past/1800)+2
 *   phase = clamp(raw, 0, 6)  → asset phase_1..phase_7
 */
export function treePhase(plantTimeSeconds: number, pastSeconds: number): number {
  const iMax = Math.max(600, Math.min(plantTimeSeconds, 1800));
  const raw =
    pastSeconds < iMax
      ? Math.floor((pastSeconds * 3) / iMax)
      : Math.floor(pastSeconds / 1800) + 2;
  return Math.min(6, Math.max(0, Math.floor(raw)));
}

/** Number of trees a session yields: countdown scales with duration, countup always 4. */
export function treeCount(mode: 'countdown' | 'countup', plantTimeSeconds: number): number {
  return mode === 'countup'
    ? 4
    : Math.min(4, Math.max(1, Math.floor(plantTimeSeconds / 1800)));
}

/** Countup: how many trees survive after stopping (iMin = clamp(floor(min/30),1,4)). */
export function countupSurvivors(elapsedSeconds: number): number {
  const minutes = Math.floor(elapsedSeconds / 60);
  return Math.min(4, Math.max(1, Math.floor(minutes / 30)));
}
