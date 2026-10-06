import { treeAnimUrl } from '../../../core/designsystem/assets';
import { MOTION, prefersReducedMotion } from '../../../core/designsystem/motion';

/**
 * Tree frame animation player (plans/05.04 §5).
 *
 * - 24 frames per state, 83ms per frame (verified from AnimationDrawable).
 * - Twilight (gid 73): idle loops forever.
 * - TinyTAN (88–94): phase 1 plays start->idle*2->active->idle once, then the
 *   active<->idle loop; phases 2..7 loop active<->idle directly.
 * - Missing groups fall back to the static phase image.
 */

export interface AnimSegment {
  state: 'start' | 'idle' | 'active';
  repeat: number;
}

export interface AnimFlow {
  sequence: AnimSegment[];
  loop: boolean;
}

const TINYTAN_GIDS = new Set([88, 89, 90, 91, 92, 93, 94]);

export function animFlowsFor(gid: number, phase: number): AnimFlow[] | null {
  if (gid === 73) {
    return [{ sequence: [{ state: 'idle', repeat: 1 }], loop: true }];
  }
  if (TINYTAN_GIDS.has(gid)) {
    if (phase <= 0) {
      return [
        {
          sequence: [
            { state: 'start', repeat: 1 },
            { state: 'idle', repeat: 2 },
            { state: 'active', repeat: 1 },
            { state: 'idle', repeat: 1 },
          ],
          loop: false,
        },
        { sequence: [{ state: 'active', repeat: 1 }, { state: 'idle', repeat: 1 }], loop: true },
      ];
    }
    return [{ sequence: [{ state: 'active', repeat: 1 }, { state: 'idle', repeat: 1 }], loop: true }];
  }
  return null;
}

const cache = new Map<string, HTMLImageElement[]>();

export function frameGroup(state: string, phase: number): string {
  return `${state}_phase_${phase + 1}`;
}

/** Preloads (and caches) the 24 frames of one state. Resolves [] on failure. */
export async function loadFrames(gid: number, phase: number, state: string): Promise<HTMLImageElement[]> {
  const key = `${gid}/${frameGroup(state, phase)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const frames: HTMLImageElement[] = [];
  for (let i = 0; i < MOTION.frameCount; i++) {
    const img = new Image();
    img.src = treeAnimUrl(gid, frameGroup(state, phase), i);
    try {
      await img.decode();
    } catch {
      return [];
    }
    frames.push(img);
  }
  cache.set(key, frames);
  return frames;
}

export class FramePlayer {
  private raf = 0;
  private last = 0;
  private hasLast = false;
  private accumulator = 0;
  private flowIndex = 0;
  private segmentIndex = 0;
  private repeatLeft = 0;
  private frameIndex = 0;
  private frames = new Map<string, HTMLImageElement[]>();
  private static readonly frameDuration = MOTION.frameDurationMs;

  constructor(
    private readonly image: HTMLImageElement,
    private readonly flows: AnimFlow[],
  ) {
    this.resetFlow();
  }

  /** Provide the loaded frame arrays per state (missing states are skipped). */
  setFrames(state: string, frames: HTMLImageElement[]): void {
    this.frames.set(state, frames);
  }

  private currentSegment(): AnimSegment {
    const flow = this.flows[this.flowIndex]!;
    return flow.sequence[this.segmentIndex]!;
  }

  private resetFlow(): void {
    this.flowIndex = 0;
    this.segmentIndex = 0;
    this.repeatLeft = this.flows[0]?.sequence[0]?.repeat ?? 0;
    this.frameIndex = 0;
  }

  private advanceSegment(): boolean {
    const flow = this.flows[this.flowIndex]!;
    this.repeatLeft -= 1;
    if (this.repeatLeft > 0) return true;
    this.segmentIndex += 1;
    if (this.segmentIndex >= flow.sequence.length) {
      this.segmentIndex = 0;
      if (!flow.loop) {
        this.flowIndex += 1;
        if (this.flowIndex >= this.flows.length) {
          this.flowIndex = this.flows.length - 1;
          this.segmentIndex = flow.sequence.length - 1;
          return false;
        }
      }
    }
    this.repeatLeft = this.flows[this.flowIndex]!.sequence[this.segmentIndex]!.repeat;
    this.frameIndex = 0;
    return true;
  }

  private applyFrame(): void {
    const segment = this.currentSegment();
    const frames = this.frames.get(segment.state);
    if (!frames || frames.length === 0) {
      // Skip states without frames (e.g. TinyTAN start on later phases).
      if (!this.advanceSegment()) this.stop();
      return;
    }
    this.image.src = frames[this.frameIndex % frames.length]!.src;
  }

  private tick = (now: number): void => {
    if (!this.hasLast) {
      this.hasLast = true;
      this.last = now;
    }
    const delta = now - this.last;
    this.last = now;
    this.accumulator += delta;
    while (this.accumulator >= FramePlayer.frameDuration) {
      this.accumulator -= FramePlayer.frameDuration;
      const segment = this.currentSegment();
      const frames = this.frames.get(segment.state);
      if (frames && frames.length > 0) {
        this.frameIndex += 1;
        if (this.frameIndex >= frames.length) {
          this.frameIndex = 0;
          if (!this.advanceSegment()) {
            this.applyFrame();
            this.stop();
            return;
          }
        }
      } else if (!this.advanceSegment()) {
        this.stop();
        return;
      }
      this.applyFrame();
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  start(): void {
    this.stop();
    this.resetFlow();
    this.applyFrame();
    if (prefersReducedMotion()) {
      const idle = this.frames.get('idle') ?? this.frames.get(this.currentSegment().state);
      if (idle && idle[0]) this.image.src = idle[0].src;
      return;
    }
    if (!this.flows.length) return;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.last = 0;
    this.hasLast = false;
    this.accumulator = 0;
  }
}

/** Loads every state in the flows and returns a ready-to-start player. */
export async function createFramePlayer(
  image: HTMLImageElement,
  gid: number,
  phase: number,
): Promise<FramePlayer | null> {
  const flows = animFlowsFor(gid, phase);
  if (!flows) return null;
  const player = new FramePlayer(image, flows);
  const states = new Set<string>();
  for (const flow of flows) for (const segment of flow.sequence) states.add(segment.state);
  let loadedAny = false;
  for (const state of states) {
    const frames = await loadFrames(gid, phase, state);
    if (frames.length > 0) loadedAny = true;
    player.setFrames(state, frames);
  }
  return loadedAny ? player : null;
}
