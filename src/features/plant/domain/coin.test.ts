import { describe, expect, it } from 'vitest';
import { coins, withBoost, coinsForPlant } from './coin';

describe('coins', () => {
  it('matches the documented formula', () => {
    expect(coins(0, 10 * 60_000)).toBe(3);
    expect(coins(0, 25 * 60_000)).toBe(9);
    expect(coins(0, 60 * 60_000)).toBe(21);
    expect(coins(0, 120 * 60_000)).toBe(43);
  });

  it('handles sub-minute sessions', () => {
    expect(coins(0, 30_000)).toBe(1);
  });

  it('applies boost ratio', () => {
    expect(withBoost(9, 0)).toBe(9);
    expect(withBoost(9, 2)).toBe(18);
    expect(withBoost(9, 3)).toBe(27);
  });

  it('coinsForPlant uses plant time', () => {
    expect(coinsForPlant(25 * 60)).toBe(9);
    expect(coinsForPlant(25 * 60, 2)).toBe(18);
  });
});
