import { config, effectivePlantSeconds } from '../config';
import { clock } from '../clock/Clock';
import { prefs } from '../prefs/prefs';
import { UDKeys } from '../prefs/UDKeys';
import { getAudio } from '../audio/AudioManager';
import { track } from '../analytics';
import type { Repositories } from '../../data/repositories';
import type { DieReason, PlantRow, PlantWithTrees, TreeRow } from '../../data/types';
import { coins } from '../../features/plant/domain/coin';
import { treePhase, countupSurvivors } from '../../features/plant/domain/treePhase';
import { buildPlant, buildTrees, type StartPlantParams } from '../../features/plant/domain/plant';
import { EXCEED_KILL_MIN } from '../../features/plant/domain/constants';
import { sessionStore } from './sessionStore';
import {
  clearClosedFlag,
  clearSnapshot,
  loadSnapshot,
  markSessionClosed,
  saveSnapshot,
  wasSessionClosed,
} from './persistence';

function isReloadNavigation(): boolean {
  try {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return entry?.type === 'reload';
  } catch {
    return false;
  }
}

export class SessionEngine {
  private timer: { kind: 'worker'; worker: Worker } | { kind: 'interval'; id: number } | null = null;
  private lock = false;
  private attached = false;

  constructor(private repos: Repositories) {}

  /* ---------------------------------------------------------------- */
  /* Lifecycle                                                         */
  /* ---------------------------------------------------------------- */

  attachLifecycle(): void {
    if (this.attached || typeof window === 'undefined') return;
    this.attached = true;

    window.addEventListener('pagehide', () => markSessionClosed());
    document.addEventListener('visibilitychange', () => {
      const hidden = document.visibilityState === 'hidden';
      this.handleVisibility(hidden);
    });
  }

  async restoreOnLaunch(): Promise<void> {
    if (isReloadNavigation()) clearClosedFlag();
    const snapshot = loadSnapshot();
    if (!snapshot) {
      const stale = await this.repos.plants.getOngoing();
      if (stale?.plant.id) {
        await this.repos.plants.update(stale.plant.id, {
          ongoing: false,
          isSuccess: false,
          deleted: true,
        });
      }
      return;
    }
    const record = await this.repos.plants.get(snapshot.plantId);
    if (!record?.plant.id) {
      clearSnapshot();
      return;
    }

    const now = clock.now();
    const closed = wasSessionClosed();
    const likelyDeadProcess = now - snapshot.lastTickAt > 120_000;

    if (closed || (now > snapshot.endTime && likelyDeadProcess)) {
      await this.completeFailed(record, 'KILL_APP', snapshot.endTime);
      return;
    }

    if (now >= snapshot.endTime) {
      const finalEnd = Math.min(now, snapshot.endTime);
      await this.complete(record, true, null, finalEnd);
      return;
    }

    // resume
    const elapsed = Math.floor((now - snapshot.startTime) / 1000);
    sessionStore.set({
      mainState: 'growing',
      ongoing: record,
      growingSeconds: elapsed,
      phase: treePhase(record.plant.plantTime, elapsed),
      countMode: record.plant.mode === 'countup' ? 'UP' : 'DOWN',
      focusMode: record.plant.isDeepFocus ? 'DEEP' : 'NORMAL',
      selectedSpeciesId: record.plant && record.trees[0] ? record.trees[0].treeType : 0,
    });
    clock.capture();
    this.startTimer();
    track('resume_session', { plantId: snapshot.plantId });
  }

  /* ---------------------------------------------------------------- */
  /* Start                                                             */
  /* ---------------------------------------------------------------- */

  async start(params: StartPlantParams): Promise<number | null> {
    const state = sessionStore.get();
    if (state.mainState === 'growing' || this.lock) return null;
    this.lock = true;
    try {
      const threeHours = prefs.get<boolean>(UDKeys.THREE_HOURS, false);
      const maxSeconds = threeHours
        ? effectivePlantSeconds(config.maxPlantSecondsThreeHours)
        : effectivePlantSeconds(config.maxPlantSecondsDefault);
      const plantTimeSeconds = Math.min(effectivePlantSeconds(params.plantTimeSeconds), maxSeconds);
      const now = clock.now();
      const plant = buildPlant({ ...params, plantTimeSeconds }, now, maxSeconds);
      const trees = buildTrees(params.speciesId, plantTimeSeconds, plant.mode);
      const plantId = await this.repos.plants.create(plant, trees);
      const record = await this.repos.plants.get(plantId);
      if (!record) return null;

      clearClosedFlag();
      clock.capture();
      sessionStore.set({
        mainState: 'growing',
        ongoing: record,
        growingSeconds: 0,
        phase: 0,
        result: null,
        timeChangeAlert: false,
        distraction: { count: 0, overlay: false, hiddenSince: null },
      });
      saveSnapshot({
        plantId,
        startTime: plant.startTime,
        endTime: plant.endTime,
        plantTime: plant.plantTime,
        mode: plant.mode,
        speciesId: params.speciesId,
        lastTickAt: now,
      });
      this.startTimer();
      track('plant_start_click', { plantId, seconds: plantTimeSeconds });
      void this.requestNotificationPermission();
      getAudio().playSfx('click');
      return plantId;
    } finally {
      setTimeout(() => {
        this.lock = false;
      }, 500);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Tick                                                              */
  /* ---------------------------------------------------------------- */

  tick(): void {
    const state = sessionStore.get();
    const ongoing = state.ongoing;
    if (state.mainState !== 'growing' || !ongoing?.plant.id) return;
    const plant = ongoing.plant;

    if (clock.timeChanged()) {
      void this.abortByTimeChange();
      return;
    }

    const now = clock.now();
    const elapsed = Math.floor((now - plant.startTime) / 1000);
    const phase = treePhase(plant.plantTime, elapsed);

    if (phase !== state.phase) {
      const trees = ongoing.trees.map((t) => ({ ...t, phase }));
      sessionStore.setTreePhases(trees);
      void this.persistTreePhases(trees);
    }
    sessionStore.setGrowing(elapsed, phase);

    const snapshot = loadSnapshot();
    if (snapshot) saveSnapshot({ ...snapshot, lastTickAt: now });

    if (plant.mode === 'countdown') {
      const target = Math.min(plant.endTime, plant.startTime + plant.plantTime * 1000);
      if (now >= target) {
        void this.complete(ongoing, true, null, target);
      }
    } else if (now >= plant.endTime) {
      void this.complete(ongoing, true, null, plant.endTime);
    }
  }

  /* ---------------------------------------------------------------- */
  /* End states                                                        */
  /* ---------------------------------------------------------------- */

  async giveUp(): Promise<void> {
    const { ongoing } = sessionStore.get();
    if (!ongoing) return;
    await this.complete(ongoing, false, 'GIVE_UP', clock.now());
  }

  async stopCountup(): Promise<void> {
    const { ongoing } = sessionStore.get();
    if (!ongoing?.plant.id) return;
    const now = clock.now();
    const minEnd = ongoing.plant.startTime + 600_000;
    if (now < minEnd) {
      await this.giveUp();
      return;
    }
    await this.complete(ongoing, true, null, Math.max(now, minEnd));
  }

  private async complete(
    record: PlantWithTrees,
    success: boolean,
    dieReason: DieReason | null,
    endTime: number,
  ): Promise<void> {
    const plantId = record.plant.id;
    if (!plantId) return;
    this.stopTimer();
    clearSnapshot();

    let finalEnd = endTime;
    let trees = record.trees;
    let succeeded = success;

    if (success && record.plant.mode === 'countdown') {
      const target = record.plant.startTime + record.plant.plantTime * 1000;
      succeeded = record.plant.isSuccess && finalEnd + 1000 >= target;
      if (succeeded) finalEnd = Math.min(finalEnd, target);
    }

    if (!succeeded) {
      trees = trees.map((t) => ({ ...t, isDead: true, phase: 7 }));
    } else if (record.plant.mode === 'countup') {
      const survivors = countupSurvivors((finalEnd - record.plant.startTime) / 1000);
      trees = trees.map((t, i) => ({
        ...t,
        isDead: i >= survivors,
        phase: i >= survivors ? 7 : t.phase,
      }));
    }

    const elapsedFinal = Math.max(0, finalEnd - record.plant.startTime);
    const earned = succeeded ? coins(0, elapsedFinal) : 0;

    const patch: Partial<PlantRow> = {
      ongoing: false,
      isSuccess: succeeded,
      dieReason: succeeded ? null : (dieReason ?? 'GIVE_UP'),
      endTime: finalEnd,
      coinsEarned: earned,
      isDirty: true,
    };
    await this.repos.plants.update(plantId, patch);
    for (const tree of trees) {
      if (tree.id) await this.repos.plants.updateTree(tree.id, { isDead: tree.isDead, phase: tree.phase });
    }

    let gems = 0;
    if (succeeded) {
      this.repos.wallet.earnCoin(earned);
      const successes = await this.repos.db.plants.filter((p) => p.isSuccess && !p.deleted).count();
      if (successes > 0 && successes % 10 === 0) {
        gems = 1;
        this.repos.wallet.earnGem(1);
      }
    }

    const finalPlant = { ...record.plant, ...patch, endTime: finalEnd } as PlantRow;
    sessionStore.set({
      mainState: 'result',
      ongoing: null,
      result: { success: succeeded, dieReason: patch.dieReason ?? null, plant: finalPlant, trees, coins: earned, gems },
      growingSeconds: Math.floor(elapsedFinal / 1000),
    });
    track(succeeded ? 'plant_success' : 'plant_fail', { plantId, earned, dieReason: patch.dieReason });
    this.notifyResult(succeeded);
  }

  private async completeFailed(
    record: PlantWithTrees,
    reason: DieReason,
    endTime: number,
  ): Promise<void> {
    await this.complete(record, false, reason, endTime);
  }

  private async abortByTimeChange(): Promise<void> {
    const { ongoing } = sessionStore.get();
    this.stopTimer();
    if (ongoing?.plant.id) {
      await this.repos.plants.update(ongoing.plant.id, {
        ongoing: false,
        isSuccess: false,
        deleted: true,
      });
    }
    clearSnapshot();
    sessionStore.set({ mainState: 'plant', ongoing: null, timeChangeAlert: true });
    track('time_changed_abort');
  }

  /* ---------------------------------------------------------------- */
  /* Deep focus simulation                                             */
  /* ---------------------------------------------------------------- */

  private handleVisibility(hidden: boolean): void {
    const state = sessionStore.get();
    if (state.mainState !== 'growing' || !state.focusMode || state.focusMode !== 'DEEP') return;
    if (hidden) {
      sessionStore.setDistraction({ hiddenSince: clock.now() });
      return;
    }
    const since = state.distraction.hiddenSince;
    if (!since) return;
    const awayMinutes = (clock.now() - since) / 60_000;
    sessionStore.setDistraction({ hiddenSince: null });
    if (awayMinutes >= EXCEED_KILL_MIN) {
      void this.giveUpWith(AWAY_REASON);
      return;
    }
    sessionStore.setDistraction({
      count: state.distraction.count + 1,
      overlay: true,
    });
  }

  private async giveUpWith(reason: DieReason): Promise<void> {
    const { ongoing } = sessionStore.get();
    if (!ongoing) return;
    await this.complete(ongoing, false, reason, clock.now());
  }

  /* ---------------------------------------------------------------- */
  /* Timer + notifications                                             */
  /* ---------------------------------------------------------------- */

  private startTimer(): void {
    if (this.timer !== null) return;
    try {
      const worker = new Worker(new URL('./timer.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = () => this.tick();
      this.timer = { kind: 'worker', worker };
    } catch {
      const id = window.setInterval(() => this.tick(), config.tickIntervalMs);
      this.timer = { kind: 'interval', id: id as unknown as number };
    }
  }

  private stopTimer(): void {
    const timer = this.timer;
    if (timer === null) return;
    this.timer = null;
    if (timer.kind === 'worker') {
      timer.worker.postMessage('stop');
      timer.worker.terminate();
    } else {
      window.clearInterval(timer.id);
    }
  }

  async requestNotificationPermission(): Promise<void> {
    if (typeof Notification === 'undefined') return;
    if (!prefs.get<boolean>(UDKeys.NOTIFICATIONS_ENABLED, true)) return;
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore
      }
    }
  }

  private notifyResult(success: boolean): void {
    getAudio().stopBgm();
    const ringtone = prefs.get<string>(UDKeys.RINGTONE_MODE, 'system');
    if (success) getAudio().playSfx('ring');
    if (ringtone === 'silent') return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 80, 200]);
    } catch {
      // ignore
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (!document.hidden) return;
    try {
      new Notification(success ? 'Tree grown!' : 'Tree withered', {
        body: success ? 'Your focus session is complete.' : 'Your session ended early.',
        icon: '/icons/icon.svg',
      });
    } catch {
      // ignore
    }
  }

  private async persistTreePhases(trees: TreeRow[]): Promise<void> {
    for (const tree of trees) {
      if (tree.id) await this.repos.plants.updateTree(tree.id, { phase: tree.phase });
    }
  }
}

const AWAY_REASON: DieReason = 'KILL_APP';

let engine: SessionEngine | null = null;

export function initSessionEngine(repos: Repositories): SessionEngine {
  if (!engine) {
    engine = new SessionEngine(repos);
    engine.attachLifecycle();
  }
  return engine;
}

export function getSessionEngine(): SessionEngine {
  if (!engine) throw new Error('SessionEngine not initialised');
  return engine;
}
