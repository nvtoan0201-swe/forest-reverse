export interface Stamp {
  wall: number;
  mono: number;
}

/**
 * Wall clock + monotonic clock pair. Detects system time changes the same way
 * the original app does: a divergence between elapsed wall time and elapsed
 * monotonic time greater than the tolerance means the user moved the clock.
 */
export class Clock {
  private last: Stamp | null = null;

  now(): number {
    return Date.now();
  }

  stamp(): Stamp {
    return { wall: Date.now(), mono: performance.now() };
  }

  capture(): void {
    this.last = this.stamp();
  }

  timeChanged(tolerance = 2000): boolean {
    if (!this.last) return false;
    const dWall = Date.now() - this.last.wall;
    const dMono = performance.now() - this.last.mono;
    return Math.abs(dWall - dMono) > tolerance;
  }
}

export const clock = new Clock();
