import { useEffect, useRef } from 'react';
import { iconUrl } from '../assets';
import { prefersReducedMotion } from '../motion';

/**
 * SnowfallView port (plans/05.04 §6): 40 flakes, size 10–30, speed 1–5,
 * alpha 128–255 with fading, snowball drawable. Used for the Xmas theme.
 */
const COUNT = 40;
const SIZE_MIN = 10;
const SIZE_MAX = 30;
const SPEED_MIN = 1;
const SPEED_MAX = 5;
const ALPHA_MIN = 128 / 255;
const ALPHA_MAX = 1;

interface Flake {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  drift: number;
  phase: number;
}

export function Snow({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = parent.clientWidth;
    let height = parent.clientHeight;

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const flakes: Flake[] = Array.from({ length: COUNT }, (_, i) => ({
      x: (i * 97.31) % width,
      y: (i * 53.17) % height,
      size: SIZE_MIN + ((i * 37) % (SIZE_MAX - SIZE_MIN + 1)),
      speed: SPEED_MIN + ((i * 13) % (SPEED_MAX - SPEED_MIN + 1)),
      alpha: ALPHA_MIN + (((i * 29) % 128) / 255),
      drift: ((i % 5) - 2) * 0.15,
      phase: (i * 0.7) % (Math.PI * 2),
    }));

    const sprite = new Image();
    const spriteUrl = iconUrl('snow');
    if (spriteUrl) sprite.src = spriteUrl;

    let raf = 0;
    let last = 0;

    const draw = (now: number) => {
      const delta = last ? Math.min(3, (now - last) / 16.7) : 1;
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        flake.y += flake.speed * delta;
        flake.x += (flake.drift + Math.sin(flake.phase + now / 1400) * 0.3) * delta;
        if (flake.y - flake.size > height) {
          flake.y = -flake.size;
          flake.x = Math.random() * width;
        }
        if (flake.x < -flake.size) flake.x = width + flake.size;
        if (flake.x > width + flake.size) flake.x = -flake.size;
        const fade = 0.85 + Math.sin(flake.phase + now / 900) * 0.15;
        ctx.globalAlpha = Math.max(ALPHA_MIN, Math.min(ALPHA_MAX, flake.alpha * fade));
        if (sprite.complete && sprite.naturalWidth > 0) {
          ctx.drawImage(sprite, flake.x, flake.y, flake.size, flake.size);
        } else {
          ctx.beginPath();
          ctx.arc(flake.x + flake.size / 2, flake.y + flake.size / 2, flake.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = 0;
        raf = requestAnimationFrame(draw);
      }
    };
    const onResize = () => resize();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden="true"
      data-flakes={COUNT}
    />
  );
}
