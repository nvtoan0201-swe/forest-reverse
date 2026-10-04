import { describe, expect, it } from 'vitest';
import { buildPlant, buildTrees } from './plant';

describe('buildTrees', () => {
  it('creates the right number of trees with sequential indexes', () => {
    const trees = buildTrees(12, 3600, 'countdown');
    expect(trees).toHaveLength(2);
    expect(trees.map((t) => t.index)).toEqual([0, 1]);
    expect(trees.every((t) => t.treeType === 12 && !t.isDead)).toBe(true);
  });

  it('creates 4 trees for countup', () => {
    expect(buildTrees(0, 600, 'countup')).toHaveLength(4);
  });
});

describe('buildPlant', () => {
  it('sets endTime from plant time for countdown', () => {
    const plant = buildPlant(
      {
        countMode: 'DOWN',
        focusMode: 'NORMAL',
        plantMode: 'SINGLE',
        plantTimeSeconds: 1500,
        tagId: null,
        speciesId: 0,
      },
      1000,
      7200,
    );
    expect(plant.mode).toBe('countdown');
    expect(plant.endTime).toBe(1000 + 1500 * 1000);
    expect(plant.ongoing).toBe(true);
  });

  it('sets endTime from max seconds for countup', () => {
    const plant = buildPlant(
      {
        countMode: 'UP',
        focusMode: 'DEEP',
        plantMode: 'SINGLE',
        plantTimeSeconds: 1500,
        tagId: 3,
        speciesId: 5,
      },
      0,
      7200,
    );
    expect(plant.mode).toBe('countup');
    expect(plant.endTime).toBe(7200 * 1000);
    expect(plant.isDeepFocus).toBe(true);
    expect(plant.tagId).toBe(3);
  });
});
