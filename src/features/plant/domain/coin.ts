/**
 * Coin economy. Formula kept identical to the documented original:
 *   (m < 25 ? 1 : 4) + floor(m / 5) + floor(max(m - 30, 0) / 30) * 5
 */
export function coins(startMs: number, endMs: number): number {
  const minutes = Math.floor((endMs - startMs) / 1000 / 60);
  return (
    (minutes < 25 ? 1 : 4) +
    Math.floor(minutes / 5) +
    Math.floor(Math.max(minutes - 30, 0) / 30) * 5
  );
}

export type BoostRatio = 0 | 1 | 2 | 3;

export function withBoost(base: number, ratio: BoostRatio): number {
  return base * Math.max(1, ratio);
}

export function coinsForPlant(plantTimeSeconds: number, ratio: BoostRatio = 0): number {
  return withBoost(coins(0, plantTimeSeconds * 1000), ratio);
}
