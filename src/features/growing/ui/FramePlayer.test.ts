import { afterEach, describe, expect, it, vi } from 'vitest';
import { FramePlayer, animFlowsFor } from './FramePlayer';

afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeFrames(prefix: string): HTMLImageElement[] {
  return Array.from({ length: 24 }, (_, i) => ({ src: `${prefix}-${i}.webp` }) as HTMLImageElement);
}

describe('animFlowsFor', () => {
  it('Twilight loops idle forever', () => {
    const flows = animFlowsFor(73, 3)!;
    expect(flows).toHaveLength(1);
    expect(flows[0]!.loop).toBe(true);
    expect(flows[0]!.sequence).toEqual([{ state: 'idle', repeat: 1 }]);
  });

  it('TinyTAN phase 1 plays start -> idle x2 -> active -> idle once, then loops active/idle', () => {
    const flows = animFlowsFor(88, 0)!;
    expect(flows).toHaveLength(2);
    expect(flows[0]!.loop).toBe(false);
    expect(flows[0]!.sequence.map((s) => `${s.state}x${s.repeat}`)).toEqual([
      'startx1',
      'idlex2',
      'activex1',
      'idlex1',
    ]);
    expect(flows[1]!.loop).toBe(true);
    expect(flows[1]!.sequence.map((s) => `${s.state}x${s.repeat}`)).toEqual(['activex1', 'idlex1']);
  });

  it('TinyTAN later phases loop active/idle directly', () => {
    const flows = animFlowsFor(94, 2)!;
    expect(flows).toEqual([
      { sequence: [{ state: 'active', repeat: 1 }, { state: 'idle', repeat: 1 }], loop: true },
    ]);
  });

  it('species without verified frames return null', () => {
    expect(animFlowsFor(0, 5)).toBeNull();
  });
});

describe('FramePlayer tick', () => {
  it('advances one frame every 83ms and wraps after 24 frames (1992ms)', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
      callbacks.push(fn);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);

    const img = document.createElement('img');
    const player = new FramePlayer(img, animFlowsFor(73, 0)!);
    player.setFrames('idle', fakeFrames('idle'));
    player.start();

    const tick = (time: number) => {
      const fn = callbacks.shift();
      if (fn) fn(time);
    };

    expect(img.src).toContain('idle-0');
    tick(0); // prime the baseline
    tick(83);
    expect(img.src).toContain('idle-1');
    tick(166);
    expect(img.src).toContain('idle-2');
    tick(166 + 83 * 22 + 1);
    expect(img.src).toContain('idle-0');
    player.stop();
  });

  it('moves from the start flow to the active/idle loop once (TinyTAN phase 1)', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
      callbacks.push(fn);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);

    const img = document.createElement('img');
    const player = new FramePlayer(img, animFlowsFor(88, 0)!);
    player.setFrames('start', fakeFrames('start'));
    player.setFrames('idle', fakeFrames('idle'));
    player.setFrames('active', fakeFrames('active'));
    player.start();

    const totalStartFrames = 24; // start x1
    const idleTwo = 48; // idle x2
    let time = 0;
    const step = (n: number) => {
      for (let i = 0; i < n; i++) {
        time += 83;
        const fn = callbacks.shift();
        if (fn) fn(time);
      }
    };
    expect(img.src).toContain('start-0');
    step(1); // baseline tick
    step(totalStartFrames);
    expect(img.src).toContain('idle-0');
    step(idleTwo);
    expect(img.src).toContain('active-0');
    player.stop();
  });

  it('skips states that have no frames loaded', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
      callbacks.push(fn);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);

    const img = document.createElement('img');
    const player = new FramePlayer(img, animFlowsFor(88, 0)!);
    player.setFrames('start', []);
    player.setFrames('idle', fakeFrames('idle'));
    player.setFrames('active', fakeFrames('active'));
    player.start();

    let time = 0;
    for (let i = 0; i < 3; i++) {
      time += 83;
      const fn = callbacks.shift();
      if (fn) fn(time);
    }
    expect(img.src).toContain('idle-');
    player.stop();
  });
});
