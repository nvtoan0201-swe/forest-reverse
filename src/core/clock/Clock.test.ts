import { describe, expect, it } from 'vitest';
import { Clock } from './Clock';

describe('Clock', () => {
  it('detects system time changes beyond tolerance', () => {
    const wall = { value: 1_000_000 };
    const mono = { value: 0 };
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => wall.value);
    const perfSpy = vi.spyOn(performance, 'now').mockImplementation(() => mono.value);

    const clock = new Clock();
    clock.capture();

    wall.value += 1000;
    mono.value += 1000;
    expect(clock.timeChanged()).toBe(false);

    wall.value += 5000; // user moved the wall clock forward 5s without time passing
    expect(clock.timeChanged()).toBe(true);

    dateSpy.mockRestore();
    perfSpy.mockRestore();
  });
});
