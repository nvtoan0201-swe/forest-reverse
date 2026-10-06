import type { ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { CoinChip } from './primitives';

/**
 * Shared main top bar (plans/05.03 §3). Height 40dp, transparent over the
 * #51A387 main background. Leading is the menu button (plant/growing) or back
 * button (result); the mode segment is always centred; the right slot holds the
 * coin chip or the growing sound cluster.
 */
export function ModeSegment({
  countMode,
  focusMode,
  onClick,
}: {
  countMode: 'UP' | 'DOWN';
  focusMode: 'NORMAL' | 'DEEP';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Plant mode"
      className="flex h-[30px] items-center gap-[10px] rounded-full px-3"
      style={{ background: 'rgba(51,128,101,0.3)' }}
    >
      <Icon
        name={countMode === 'DOWN' ? 'timer' : 'play'}
        size={25}
        className={countMode === 'DOWN' ? 'opacity-100' : 'opacity-50'}
      />
      <span className="h-[18px] w-px bg-white/70" />
      <Icon name="focus" size={25} className={focusMode === 'DEEP' ? 'opacity-100' : 'opacity-50'} />
    </button>
  );
}

export function MainTopBar({
  leading = 'menu',
  onLeading,
  countMode,
  focusMode,
  onModeClick,
  coin,
  onAddCoin,
  right,
}: {
  leading?: 'menu' | 'back' | 'none';
  onLeading?: () => void;
  countMode: 'UP' | 'DOWN';
  focusMode: 'NORMAL' | 'DEEP';
  onModeClick: () => void;
  coin?: number;
  onAddCoin?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="safe-top">
      <div className="relative flex h-[40px] items-center">
        <div className="z-10 ml-[15px]">
          {leading === 'menu' && (
            <button
              aria-label="Menu"
              onClick={onLeading}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Icon name="menu" size={40} />
            </button>
          )}
          {leading === 'back' && (
            <button
              aria-label="Back"
              onClick={onLeading}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Icon name="back" size={24} />
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <div className="pointer-events-auto">
            <ModeSegment countMode={countMode} focusMode={focusMode} onClick={onModeClick} />
          </div>
        </div>

        <div className="z-10 ml-auto mr-[15px] flex items-center">
          {right ?? (typeof coin === 'number' && <CoinChip coin={coin} onAdd={onAddCoin} />)}
        </div>
      </div>
    </header>
  );
}
