import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDB, type ForestDB } from '../db/database';
import { createRepositories, type Repositories } from '../../data/repositories';
import { SessionEngine } from './SessionEngine';
import { useSessionStore } from './sessionStore';

vi.mock('../audio/AudioManager', () => ({
  getAudio: () => ({
    playSfx: vi.fn(),
    stopBgm: vi.fn(),
    playBgm: vi.fn(),
    setSfxEnabled: vi.fn(),
    setVolume: vi.fn(),
  }),
}));

let db: ForestDB;
let repos: Repositories;
let engine: SessionEngine;

const T0 = 1_700_000_000_000;
let wall = T0;
let mono = 0;

const advance = (ms: number) => {
  wall += ms;
  mono += ms;
};

beforeAll(async () => {
  vi.spyOn(Date, 'now').mockImplementation(() => wall);
  vi.spyOn(performance, 'now').mockImplementation(() => mono);
  db = createDB(`test-${Math.random().toString(36).slice(2)}`);
  await db.open();
  repos = createRepositories(db);
  engine = new SessionEngine(repos);
});

afterAll(async () => {
  await db.delete();
  vi.restoreAllMocks();
});

beforeEach(() => {
  wall = T0;
  mono = 0;
  localStorage.clear();
  useSessionStore.getState().resetForm();
  engine = new SessionEngine(repos);
});

describe('seed', () => {
  it('populates the catalog on first open', async () => {
    expect(await db.treeTypes.count()).toBe(65);
    expect(await db.ambientSounds.count()).toBe(33);
    expect(await db.tagColors.count()).toBe(15);
    expect(await db.products.count()).toBe(98);
  });
});

describe('SessionEngine', () => {
  it('runs a countdown to success, credits coins and updates trees', async () => {
    await engine.start({
      countMode: 'DOWN',
      focusMode: 'NORMAL',
      plantMode: 'SINGLE',
      plantTimeSeconds: 300,
      tagId: null,
      speciesId: 0,
    });
    expect(useSessionStore.getState().mainState).toBe('growing');

    advance(301_000);
    engine.tick();

    await vi.waitFor(() => {
      expect(useSessionStore.getState().mainState).toBe('result');
    });
    const result = useSessionStore.getState().result;
    expect(result?.success).toBe(true);
    expect(result?.coins).toBe(2); // 5 min → (5<25 → 1) + floor(5/5) = 2
    expect(result?.trees.every((tree) => !tree.isDead)).toBe(true);

    const ongoing = await repos.plants.getOngoing();
    expect(ongoing).toBeNull();
  });

  it('fails with GIVE_UP and marks every tree dead', async () => {
    await engine.start({
      countMode: 'DOWN',
      focusMode: 'NORMAL',
      plantMode: 'SINGLE',
      plantTimeSeconds: 1500,
      tagId: null,
      speciesId: 6,
    });
    advance(60_000);
    await engine.giveUp();

    const result = useSessionStore.getState().result;
    expect(result?.success).toBe(false);
    expect(result?.dieReason).toBe('GIVE_UP');
    expect(result?.coins).toBe(0);
    expect(result?.trees.every((tree) => tree.isDead)).toBe(true);
  });

  it('stops a countup after the stoppable threshold and prunes trees', async () => {
    await engine.start({
      countMode: 'UP',
      focusMode: 'NORMAL',
      plantMode: 'SINGLE',
      plantTimeSeconds: 600,
      tagId: null,
      speciesId: 12,
    });
    advance(11 * 60_000);
    engine.tick();
    await engine.stopCountup();

    const result = useSessionStore.getState().result;
    expect(result?.success).toBe(true);
    expect(result?.trees.filter((tree) => !tree.isDead)).toHaveLength(1);
  });

  it('does not start a second session while growing', async () => {
    const first = await engine.start({
      countMode: 'DOWN',
      focusMode: 'NORMAL',
      plantMode: 'SINGLE',
      plantTimeSeconds: 300,
      tagId: null,
      speciesId: 0,
    });
    const second = await engine.start({
      countMode: 'DOWN',
      focusMode: 'NORMAL',
      plantMode: 'SINGLE',
      plantTimeSeconds: 300,
      tagId: null,
      speciesId: 0,
    });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    await engine.giveUp();
  });
});
