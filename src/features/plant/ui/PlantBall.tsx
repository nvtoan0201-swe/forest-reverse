import { useCallback, useMemo, useRef, useState } from 'react';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { getAudio } from '../../../core/audio/AudioManager';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { PLANT_MINUTE_STEPS } from '../domain/constants';

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 138;
const START_ANGLE = 135; // bottom-left
const SWEEP = 270; // clockwise to bottom-right
const MIN_MINUTES = 5;

function pointAt(angleDeg: number, radius = RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function polar(angleDeg: number) {
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
  const arc = useMemo(() => polar(angle), [angle]);
  const thumb = pointAt(angle);
  const treeUrl = repos.treeAssets.phaseUrl(speciesId, 1);

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
        // outside the active sweep: clamp to the nearest end
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
    <div className="relative select-none" style={{ width: '100%', maxWidth: 320 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full touch-none"
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
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--plantball)" strokeWidth={14} opacity={0.45} />
        <path d={arc} fill="none" stroke="var(--plantball)" strokeWidth={14} strokeLinecap="round" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - 34}
          fill="var(--forest-teal-400)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1}
        />
        <image
          href={treeUrl}
          x={CENTER - 100}
          y={CENTER - 92}
          width={200}
          height={200}
          preserveAspectRatio="xMidYMax meet"
          onError={(e) => {
            (e.currentTarget as SVGImageElement).setAttribute('href', repos.treeAssets.placeholderUrl());
          }}
        />
        {dragging && (
          <circle cx={thumb.x} cy={thumb.y} r={11} fill="#fff" stroke="var(--plantball-border)" strokeWidth={3} />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[54%] flex flex-col items-center">
        <Icon name="chevronDown" size={14} className="text-white/70" />
      </div>
    </div>
  );
}
