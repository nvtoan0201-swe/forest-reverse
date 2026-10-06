import { describe, expect, it } from 'vitest';
import { EASING, MOTION, anticipateOvershoot, cubicBezier, easingCss, transitionFor } from './motion';

describe('cubicBezier (AOSP PathInterpolator)', () => {
  it('linear is the identity', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(EASING.linear(t)).toBeCloseTo(t, 6);
    }
  });

  it('fast_out_slow_in matches reference values', () => {
    expect(EASING.fastOutSlowIn(0.25)).toBeCloseTo(0.2366, 3);
    expect(EASING.fastOutSlowIn(0.5)).toBeCloseTo(0.7756, 3);
    expect(EASING.fastOutSlowIn(0.75)).toBeCloseTo(0.9594, 3);
  });

  it('anticipate dips below zero before moving forward', () => {
    expect(EASING.anticipate(0.25)).toBeCloseTo(-0.0596, 3);
    expect(EASING.anticipate(0.5)).toBeCloseTo(-0.0874, 3);
    expect(EASING.anticipate(0.75)).toBeCloseTo(0.1837, 3);
  });

  it('overshoot peaks above one', () => {
    expect(EASING.overshoot(0.25)).toBeCloseTo(0.1974, 3);
    expect(EASING.overshoot(0.5)).toBeCloseTo(0.6361, 3);
    expect(EASING.overshoot(0.75)).toBeCloseTo(1.0116, 3);
  });

  it('decelerate matches reference values', () => {
    expect(EASING.decelerate(0.25)).toBeCloseTo(0.8495, 3);
    expect(EASING.decelerate(0.5)).toBeCloseTo(0.9662, 3);
    expect(EASING.decelerate(0.75)).toBeCloseTo(0.9949, 3);
  });

  it('clamps inputs outside [0,1]', () => {
    const f = cubicBezier(0.4, 0, 0.2, 1);
    expect(f(-1)).toBe(0);
    expect(f(2)).toBe(1);
  });

  it('anticipateOvershoot returns to 1 at the end', () => {
    expect(anticipateOvershoot(0)).toBe(0);
    expect(anticipateOvershoot(1)).toBe(1);
    expect(anticipateOvershoot(0.25)).toBeLessThan(0);
    expect(anticipateOvershoot(0.9)).toBeGreaterThan(1);
  });
});

describe('MOTION table', () => {
  it('matches the verified animation spec', () => {
    expect(MOTION.buttonFall).toEqual({ duration: 350, easing: 'anticipate' });
    expect(MOTION.buttonRecover).toEqual({ duration: 300, easing: 'decelerate' });
    expect(MOTION.bot3btnFall).toEqual({ duration: 600, easing: 'anticipate', stagger: 60 });
    expect(MOTION.grownBtnPop).toEqual({ duration: 500, easing: 'anticipateOvershoot' });
    expect(MOTION.treeIconPop).toEqual({ duration: 250, easing: 'anticipateOvershoot' });
    expect(MOTION.dialogEnter).toEqual({ duration: 300, easing: 'overshoot' });
    expect(MOTION.dialogExit).toEqual({ duration: 150, easing: 'linear' });
    expect(MOTION.hintEnter).toEqual({ duration: 300, easing: 'overshoot' });
    expect(MOTION.hintExit).toEqual({ duration: 300, easing: 'linear' });
    expect(MOTION.syncRotation.duration).toBe(1700);
    expect(MOTION.slideIn.duration).toBe(400);
    expect(MOTION.slideOut.duration).toBe(400);
    expect(MOTION.fadeIn1s.duration).toBe(1000);
    expect(MOTION.treeCrossFade).toEqual({ duration: 200, scale: [1, 1.03, 1] });
    expect(MOTION.press).toEqual({ scale: 0.96, spring: { stiffness: 500, damping: 30 } });
    expect(MOTION.frameDurationMs).toBe(83);
    expect(MOTION.frameCount).toBe(24);
  });

  it('transitionFor converts ms to seconds and resolves easing', () => {
    const t = transitionFor('dialogEnter');
    expect(t.duration).toBeCloseTo(0.3, 6);
    expect(typeof t.ease).toBe('function');
    expect((t.ease as (x: number) => number)(0.5)).toBeCloseTo(0.6361, 3);
  });

  it('easingCss emits cubic-bezier strings', () => {
    expect(easingCss('linear')).toBe('cubic-bezier(0, 0, 1, 1)');
    expect(easingCss('overshoot')).toBe('cubic-bezier(0.36, 0, 0.66, 1.4)');
    expect(easingCss('unknown')).toBe('linear');
  });
});
