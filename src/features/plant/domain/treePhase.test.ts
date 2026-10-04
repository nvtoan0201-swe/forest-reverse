import { describe, expect, it } from 'vitest';
import { countupSurvivors, treeCount, treePhase } from './treePhase';

describe('treePhase', () => {
  it('clamps to 0..6', () => {
    expect(treePhase(1500, 0)).toBe(0);
    expect(treePhase(1500, 750)).toBe(1);
    expect(treePhase(1500, 1500)).toBe(2);
    expect(treePhase(1500, 1800)).toBe(3);
    expect(treePhase(3600, 3600)).toBe(4);
    expect(treePhase(3600, 7200)).toBe(6);
    expect(treePhase(3600, 999_999)).toBe(6);
  });

  it('uses iMax = max(600, min(t, 1800))', () => {
    expect(treePhase(600, 300)).toBe(1);
    expect(treePhase(600, 600)).toBe(2);
    expect(treePhase(300, 150)).toBe(0);
  });
});

describe('treeCount', () => {
  it('countdown scales with duration and caps at 4', () => {
    expect(treeCount('countdown', 1500)).toBe(1);
    expect(treeCount('countdown', 1800)).toBe(1);
    expect(treeCount('countdown', 3600)).toBe(2);
    expect(treeCount('countdown', 7200)).toBe(4);
    expect(treeCount('countdown', 10_800)).toBe(4);
  });

  it('countup always yields 4 trees', () => {
    expect(treeCount('countup', 600)).toBe(4);
  });
});

describe('countupSurvivors', () => {
  it('clamps to 1..4 by 30-minute steps', () => {
    expect(countupSurvivors(600)).toBe(1);
    expect(countupSurvivors(1800)).toBe(1);
    expect(countupSurvivors(3600)).toBe(2);
    expect(countupSurvivors(7200)).toBe(4);
  });
});
