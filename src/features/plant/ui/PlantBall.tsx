import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getAudio } from '../../../core/audio/AudioManager';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { plantBallUrl } from '../../../core/designsystem/assets';
import { MOTION, anticipateOvershoot } from '../../../core/designsystem/motion';
import { PLANT_MINUTE_STEPS } from '../domain/constants';

/**
 * PlantBall — original ground art (plant_ball.webp) + phase-6 tree preview +
 * 270° drag ring. Geometry in a 100x100 viewBox; ring sits just inside the
 * citron disc with citron300 track and citron200 progress (docs/07 §2.3).
 */
const SIZE = 100;
const CENTER = SIZE / 2;
const RADIUS = 46;
const START_ANGLE = 135; // bottom-left
const SWEEP = 270; // clockwise to bottom-right
const MIN_MINUTES = 5;

function pointAt(angleDeg: number, radius = RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function arcPath(angleDeg: number) {
  const startRad = (START_ANGLE * Math.PI) / 180;
  const endRad = (angleDeg * Math.PI) / 180;
  const x0 = CENTER + RADIUS * Math.cos(startRad);
  const y0 = CENTER + RADIUS * Math.sin(startRad);
  const x1 = CENTER + RADIUS * Math.cos(endRad);
  const y1 = CENTER + RADIUS * Math.sin(endRad);
  const delta = angleDeg - START_ANGLE;
  const largeArc = delta > 180 ? 1 : 0;
  if (delta < 0.5) return '';
  return `M ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1}`;
}

export function PlantBall({
  minutes,
  maxMinutes,
  onChange,
  onRelease,
  speciesId,
  disabled = false,
}: {
  minutes: number;
  maxMinutes: number;
  onChange: (minutes: number) => void;
  onRelease?: (minutes: number) => void;
  speciesId: number;
  disabled?: boolean;
}) {
  const repos = useRepos();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  const progress = useMemo(
    () => (minutes - MIN_MINUTES) / Math.max(1, maxMinutes - MIN_MINUTES),
    [minutes, maxMinutes],
  );
  const angle = START_ANGLE + SWEEP * Math.min(1, Math.max(0, progress));
  const arc = useMemo(() => arcPath(angle), [angle]);
  const thumb = pointAt(angle);
  const treeUrl = repos.treeAssets.phaseUrl(speciesId, 5);

  const minutesFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * SIZE - CENTER;
      const y = ((clientY - rect.top) / rect.height) * SIZE - CENTER;
      let deg = (Math.atan2(y, x) * 180) / Math.PI;
      deg = (deg + 360) % 360;
      let delta = (deg - START_ANGLE + 360) % 360;
      if (delta > SWEEP) {
        delta = delta > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP;
      }
      const t = delta / SWEEP;
      return MIN_MINUTES + t * (maxMinutes - MIN_MINUTES);
    },
    [maxMinutes],
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const value = minutesFromEvent(clientX, clientY);
      if (value === null) return;
      onChange(Math.round(value));
    },
    [minutesFromEvent, onChange],
  );

  const snapToNearest = useCallback(
    (value: number) => {
      let best = PLANT_MINUTE_STEPS[0] as number;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const step of PLANT_MINUTE_STEPS) {
        if (step > maxMinutes) break;
        const distance = Math.abs(step - value);
        if (distance < bestDistance) {
          best = step;
          bestDistance = distance;
        }
      }
      return best;
    },
    [maxMinutes],
  );

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      setDragging(false);
      const value = minutesFromEvent(clientX, clientY);
      const released = snapToNearest(value ?? minutes);
      onChange(released);
      onRelease?.(released);
      navigator.vibrate?.(10);
      getAudio().playSfx('slide');
    },
    [minutes, minutesFromEvent, onChange, onRelease, snapToNearest],
  );

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '1 / 1', maxWidth: 320 }}>
      <img
        src={plantBallUrl()}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />

      {/* Tree preview, phase 6, bottom-anchored in the bowl. */}
      <motion.div
        key={speciesId}
        className="pointer-events-none absolute left-1/2"
        style={{ bottom: '22%', width: '62%', transformOrigin: '50% 100%' }}
        initial={{ x: '-50%', scaleX: 0.4, scaleY: 0 }}
        animate={{ x: '-50%', scaleX: 1, scaleY: 1 }}
        transition={{ duration: MOTION.treeIconPop.duration / 1000, ease: anticipateOvershoot }}
      >
        <img
          src={treeUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-auto w-full"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = repos.treeAssets.fallbackUrl(speciesId, 'phase_6');
            if (fallback && !img.dataset.fallback) {
              img.dataset.fallback = '1';
              img.src = fallback;
            } else {
              img.src = repos.treeAssets.placeholderUrl();
            }
          }}
        />
      </motion.div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 h-full w-full touch-none"
        role="slider"
        aria-label="Plant duration"
        aria-valuemin={MIN_MINUTES}
        aria-valuemax={maxMinutes}
        aria-valuenow={minutes}
        tabIndex={0}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          handleMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging || disabled) return;
          handleMove(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (!dragging) return;
          finishDrag(e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(maxMinutes, minutes + 5));
          }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(MIN_MINUTES, minutes - 5));
          }
        }}
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--plantball-border)" strokeWidth={7} />
        <path d={arc} fill="none" stroke="var(--plantball)" strokeWidth={7} strokeLinecap="round" />
        {dragging && (
          <circle cx={thumb.x} cy={thumb.y} r={5.5} fill="#ffffff" stroke="var(--plantball-border)" strokeWidth={2} />
        )}
      </svg>
    </div>
  );
}
