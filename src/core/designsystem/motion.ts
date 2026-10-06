/**
 * Motion constants + Android PathInterpolator easing (plans/05.04 §1).
 *
 * All durations are milliseconds. Easing names map to AOSP
 * android.view.animation.PathInterpolator control points. Components must use
 * these values instead of scattering magic numbers.
 */

export type EasingFn = (t: number) => number;
export type EasingSpec = readonly [number, number, number, number];

/**
 * CSS/Framer cubic-bezier. Solves x(t) = input by Newton iteration with a
 * bisection fallback, then evaluates y(t). Mirrors PathInterpolator semantics.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFn {
  const sampleX = (t: number) => {
    const mt = 1 - t;
    return 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
  };
  const sampleY = (t: number) => {
    const mt = 1 - t;
    return 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t;
  };
  const sampleDX = (t: number) => {
    const mt = 1 - t;
    return 3 * mt * mt * x1 + 6 * mt * t * (x2 - x1) + 3 * t * t * (1 - x2);
  };

  return (input: number) => {
    if (input <= 0) return 0;
    if (input >= 1) return 1;
    let t = input;
    for (let i = 0; i < 8; i++) {
      const x = sampleX(t) - input;
      if (Math.abs(x) < 1e-6) return sampleY(t);
      const dx = sampleDX(t);
      if (Math.abs(dx) < 1e-6) break;
      t -= x / dx;
    }
    let lo = 0;
    let hi = 1;
    t = input;
    for (let i = 0; i < 32; i++) {
      const x = sampleX(t);
      if (Math.abs(x - input) < 1e-7) break;
      if (x < input) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

const bezier = cubicBezier;

export type EasingName =
  | 'linear'
  | 'fastOutLinearIn'
  | 'fastOutSlowIn'
  | 'linearOutSlowIn'
  | 'accelerateDecelerate'
  | 'anticipate'
  | 'decelerate'
  | 'overshoot';

/** AOSP PathInterpolator control points (plans/05.04 §1). */
export const EASING: Record<EasingName, EasingFn> = {
  linear: bezier(0, 0, 1, 1),
  fastOutLinearIn: bezier(0.4, 0, 1, 1),
  fastOutSlowIn: bezier(0.4, 0, 0.2, 1),
  linearOutSlowIn: bezier(0, 0, 0.2, 1),
  accelerateDecelerate: bezier(0.4, 0, 0.2, 1),
  anticipate: bezier(0.36, 0, 0.66, -0.56),
  decelerate: bezier(0.1, 0.9, 0.2, 1),
  overshoot: bezier(0.36, 0, 0.66, 1.4),
};

/**
 * anticipate_overshoot: two phases (anticipate then overshoot). There is no
 * single cubic-bezier equivalent; approximated and verified in P-601.
 */
export const anticipateOvershoot: EasingFn = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? EASING.anticipate(t * 2) * 0.5 : 0.5 + EASING.overshoot((t - 0.5) * 2) * 0.5;
};

/** Hex/array forms for Framer Motion `ease` props. */
export const EASING_CUBIC: Record<string, EasingSpec> = {
  linear: [0, 0, 1, 1],
  fastOutLinearIn: [0.4, 0, 1, 1],
  fastOutSlowIn: [0.4, 0, 0.2, 1],
  linearOutSlowIn: [0, 0, 0.2, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
  decelerate: [0.1, 0.9, 0.2, 1],
  overshoot: [0.36, 0, 0.66, 1.4],
};

export const MOTION = {
  buttonFall: { duration: 350, easing: 'anticipate' },
  buttonRecover: { duration: 300, easing: 'decelerate' },
  bot3btnFall: { duration: 600, easing: 'anticipate', stagger: 60 },
  grownBtnPop: { duration: 500, easing: 'anticipateOvershoot' },
  treeIconPop: { duration: 250, easing: 'anticipateOvershoot' },
  firstPlantFadeIn: { duration: 800, easing: 'linear' },
  dialogEnter: { duration: 300, easing: 'overshoot' },
  dialogExit: { duration: 150, easing: 'linear' },
  hintEnter: { duration: 300, easing: 'overshoot' },
  hintExit: { duration: 300, easing: 'linear' },
  syncRotation: { duration: 1700, easing: 'linear', repeat: Infinity },
  slideIn: { duration: 400, easing: 'linear' },
  slideOut: { duration: 400, easing: 'linear' },
  fadeIn1s: { duration: 1000, easing: 'linear' },
  treeCrossFade: { duration: 200, scale: [1, 1.03, 1] },
  press: { scale: 0.96, spring: { stiffness: 500, damping: 30 } },
  frameDurationMs: 83,
  frameCount: 24,
} as const;

export type MotionName = keyof typeof MOTION;

/** Motion entries that carry duration/easing (everything except raw numbers). */
export type TransitionName = Exclude<MotionName, 'frameDurationMs' | 'frameCount'>;

/** Framer-friendly transition for a named motion entry. */
export function transitionFor(name: TransitionName): {
  duration: number;
  ease: EasingFn | EasingSpec;
} {
  const entry = MOTION[name] as { duration: number; easing: string };
  const easingName = entry.easing;
  const ease =
    easingName === 'anticipateOvershoot' ? anticipateOvershoot : EASING[easingName as EasingName] ?? EASING.linear;
  return { duration: entry.duration / 1000, ease };
}

/** CSS cubic-bezier string for a named easing (e.g. CSS transitions/animations). */
export function easingCss(name: string): string {
  const points = EASING_CUBIC[name];
  return points ? `cubic-bezier(${points.join(', ')})` : 'linear';
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
