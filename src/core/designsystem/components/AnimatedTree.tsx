import { useEffect, useRef, useState, type CSSProperties, type ReactEventHandler } from 'react';
import { treeUrl } from '../assets';
import { MOTION } from '../motion';
import { createFramePlayer, type FramePlayer } from '../../../features/growing/ui/FramePlayer';

/**
 * Tree image that upgrades itself to a 24×83ms AnimationDrawable when the
 * species/phase has verified frames (Twilight 73, TinyTAN 88–94). Falls back
 * to the static phase image automatically.
 */
export function AnimatedTree({
  gid,
  phase,
  className,
  style,
  onError,
}: {
  gid: number;
  phase: number;
  className?: string;
  style?: CSSProperties;
  onError?: ReactEventHandler<HTMLImageElement>;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    let player: FramePlayer | null = null;
    let cancelled = false;
    const img = imgRef.current;
    if (!img) return;
    setAnimated(false);
    void createFramePlayer(img, gid, phase).then((created) => {
      if (cancelled || !created) return;
      player = created;
      setAnimated(true);
      created.start();
    });
    return () => {
      cancelled = true;
      player?.stop();
    };
  }, [gid, phase]);

  return (
    <img
      ref={imgRef}
      src={treeUrl(gid, `phase_${Math.min(7, Math.max(1, Math.floor(phase) + 1))}`)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
      onError={onError}
      data-animated={animated ? 'true' : 'false'}
      data-frame-ms={MOTION.frameDurationMs}
    />
  );
}
