import { useEffect, useRef, type ReactNode } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { isOriginalMode, lottieUrl } from '../assets';
import { prefersReducedMotion } from '../motion';

/**
 * Lottie wrapper (P-418). Only renders in original mode, where the decoded
 * JSON files from the APK are available; placeholder mode shows `fallback`.
 */
export function Lottie({
  name,
  className,
  loop = true,
  autoplay = true,
  fallback = null,
}: {
  name: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || !isOriginalMode) return;
    let animation: AnimationItem | null = null;
    try {
      animation = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop,
        autoplay: autoplay && !prefersReducedMotion(),
        path: lottieUrl(name),
      });
    } catch {
      animation = null;
    }
    return () => animation?.destroy();
  }, [name, loop, autoplay]);

  if (!isOriginalMode) return <>{fallback}</>;
  return <div ref={ref} className={className} aria-hidden="true" />;
}

/** Lightweight placeholder confetti (used when Lottie is unavailable). */
export function Confetti({ className = '' }: { className?: string }) {
  const colors = ['var(--accent-green-200)', 'var(--cyan-200)', 'var(--yellow-200)', 'var(--red-200)'];
  return (
    <div className={`pointer-events-none relative overflow-hidden ${className}`} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={{
            left: `${8 + i * 7.5}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 6) * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}
