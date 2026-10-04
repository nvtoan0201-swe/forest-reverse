import type { CountMode, FocusMode, PlantMode, TreeRow } from '../../../data/types';
import { treeCount } from './treePhase';

export interface BuildTreesResult {
  treeType: number;
  isDead: boolean;
  theme: number;
  phase: number;
  index: number;
}

export function buildTrees(
  speciesId: number,
  plantTimeSeconds: number,
  mode: PlantMode,
): BuildTreesResult[] {
  const count = treeCount(mode, plantTimeSeconds);
  return Array.from({ length: count }, (_, index) => ({
    treeType: speciesId,
    isDead: false,
    theme: 0,
    phase: 0,
    index,
  }));
}

export type { TreeRow };

export interface StartPlantParams {
  countMode: CountMode;
  focusMode: FocusMode;
  plantMode: 'SINGLE';
  plantTimeSeconds: number;
  tagId: number | null;
  speciesId: number;
}

export interface NewPlant {
  serverId: number;
  plantTime: number;
  startTime: number;
  endTime: number;
  mode: PlantMode;
  isSuccess: boolean;
  dieReason: null;
  tagId: number;
  note: null;
  roomId: number;
  isDirty: boolean;
  isSaved: boolean;
  hasLeft: boolean;
  ongoing: boolean;
  isDeepFocus: boolean | null;
  endTimeBackup: number | null;
  deleted: boolean;
  coinsEarned: number;
  distractionCount: number;
}

export function buildPlant(params: StartPlantParams, now: number, maxSeconds: number): NewPlant {
  const mode: PlantMode = params.countMode === 'UP' ? 'countup' : 'countdown';
  const start = now;
  const end = mode === 'countup' ? start + maxSeconds * 1000 : start + params.plantTimeSeconds * 1000;
  return {
    serverId: -1,
    plantTime: params.plantTimeSeconds,
    startTime: start,
    endTime: end,
    mode,
    isSuccess: true,
    dieReason: null,
    tagId: params.tagId ?? 0,
    note: null,
    roomId: -1,
    isDirty: true,
    isSaved: false,
    hasLeft: false,
    ongoing: true,
    isDeepFocus: params.focusMode === 'DEEP',
    endTimeBackup: null,
    deleted: false,
    coinsEarned: 0,
    distractionCount: 0,
  };
}
