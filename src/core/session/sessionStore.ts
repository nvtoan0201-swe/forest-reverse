import { create } from 'zustand';
import type {
  CountMode,
  DieReason,
  FocusMode,
  PlantRow,
  PlantWithTrees,
  TreeRow,
} from '../../data/types';
import { DEFAULT_PLANT_MINUTES } from '../../features/plant/domain/constants';

export type MainState = 'plant' | 'growing' | 'result' | 'relaxing';

export interface ResultState {
  success: boolean;
  dieReason: DieReason | null;
  plant: PlantRow;
  trees: TreeRow[];
  coins: number;
  gems: number;
}

export interface DistractionState {
  count: number;
  overlay: boolean;
  hiddenSince: number | null;
}

export interface SessionStore {
  mainState: MainState;
  countMode: CountMode;
  focusMode: FocusMode;
  selectedSpeciesId: number;
  plantTimeMinutes: number;
  tagId: number | null;
  ongoing: PlantWithTrees | null;
  growingSeconds: number;
  phase: number;
  result: ResultState | null;
  timeChangeAlert: boolean;
  distraction: DistractionState;

  setMainState(state: MainState): void;
  setCountMode(mode: CountMode): void;
  setFocusMode(mode: FocusMode): void;
  selectSpecies(gid: number): void;
  setPlantTimeMinutes(minutes: number): void;
  setTagId(tagId: number | null): void;
  setOngoing(ongoing: PlantWithTrees | null): void;
  setGrowing(seconds: number, phase: number): void;
  setTreePhases(trees: TreeRow[]): void;
  setResult(result: ResultState | null): void;
  setTimeChangeAlert(value: boolean): void;
  setDistraction(patch: Partial<DistractionState>): void;
  resetForm(): void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  mainState: 'plant',
  countMode: 'DOWN',
  focusMode: 'NORMAL',
  selectedSpeciesId: 0,
  plantTimeMinutes: DEFAULT_PLANT_MINUTES,
  tagId: null,
  ongoing: null,
  growingSeconds: 0,
  phase: 0,
  result: null,
  timeChangeAlert: false,
  distraction: { count: 0, overlay: false, hiddenSince: null },

  setMainState: (mainState) => set({ mainState }),
  setCountMode: (countMode) => set({ countMode }),
  setFocusMode: (focusMode) => set({ focusMode }),
  selectSpecies: (selectedSpeciesId) => set({ selectedSpeciesId }),
  setPlantTimeMinutes: (plantTimeMinutes) =>
    set({ plantTimeMinutes: Math.max(5, Math.min(180, Math.round(plantTimeMinutes))) }),
  setTagId: (tagId) => set({ tagId }),
  setOngoing: (ongoing) => set({ ongoing }),
  setGrowing: (growingSeconds, phase) => set({ growingSeconds, phase }),
  setTreePhases: (trees) =>
    set((state) =>
      state.ongoing
        ? { ongoing: { ...state.ongoing, trees } }
        : {},
    ),
  setResult: (result) => set({ result }),
  setTimeChangeAlert: (timeChangeAlert) => set({ timeChangeAlert }),
  setDistraction: (patch) =>
    set((state) => ({ distraction: { ...state.distraction, ...patch } })),
  resetForm: () =>
    set({
      mainState: 'plant',
      ongoing: null,
      growingSeconds: 0,
      phase: 0,
      result: null,
      timeChangeAlert: false,
      distraction: { count: 0, overlay: false, hiddenSince: null },
    }),
}));

export const sessionStore = {
  get: () => useSessionStore.getState(),
  set: (patch: Partial<SessionStore>) => useSessionStore.setState(patch),
  setTreePhases: (trees: TreeRow[]) => useSessionStore.getState().setTreePhases(trees),
  setGrowing: (seconds: number, phase: number) =>
    useSessionStore.getState().setGrowing(seconds, phase),
  setDistraction: (patch: Partial<DistractionState>) =>
    useSessionStore.getState().setDistraction(patch),
  subscribe: useSessionStore.subscribe,
};
