import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`forest-card p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  color?: string;
  children: ReactNode;
}

export function Chip({ selected = false, color, className = '', children, ...rest }: ChipProps) {
  return (
    <button
      className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-button4 transition ${
        selected ? 'text-white' : 'text-[var(--text-primary)]'
      } ${className}`}
      style={{ background: selected ? color ?? 'var(--brand)' : 'var(--card-unselected)' }}
      {...rest}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

export function TagChip({
  name,
  color,
  onClick,
  editable = false,
  light = false,
}: {
  name: string;
  color?: string;
  onClick?: () => void;
  editable?: boolean;
  light?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex max-w-[220px] items-center gap-2 rounded-full px-3 py-1.5 text-headline5 ${
        light ? 'bg-white/10 text-white' : 'bg-[var(--bg-secondary)]'
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color ?? 'var(--gray-400)' }} />
      <span className="truncate">{name}</span>
      {editable && <span className="text-xs opacity-50">✎</span>}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? 'var(--brand)' : 'var(--gray-300)' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  dark = false,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  dark?: boolean;
}) {
  return (
    <div
      className="inline-flex rounded-full p-0.5"
      style={{ background: dark ? 'rgba(255,255,255,0.15)' : 'var(--gray-200)' }}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={`rounded-full px-3.5 py-1 text-subtitle2 transition-colors ${
            value === item.value
              ? dark
                ? 'bg-white text-[var(--forest-teal-700)]'
                : 'bg-white text-[var(--text-primary)] shadow-sm'
              : dark
                ? 'text-white/80'
                : 'text-[var(--text-secondary)]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({
  size = 48,
  strokeWidth = 4,
  progress,
  color = 'var(--brand)',
  children,
}: {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-12 text-center">
      {icon && <div className="text-[var(--gray-400)]">{icon}</div>}
      <p className="text-subtitle1 text-[var(--text-secondary)]">{title}</p>
      {hint && <p className="text-body2 text-[var(--text-tertiary)]">{hint}</p>}
    </div>
  );
}

export function CoinChip({
  coin,
  gem,
  onAdd,
  compact = false,
}: {
  coin: number;
  gem?: number;
  onAdd?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1.5 rounded-full"
        style={{ background: 'var(--forest-teal-500)' }}
      >
        <div className="flex items-center gap-1 px-2 py-0.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
            style={{ background: 'var(--coin)', color: 'var(--brown-700)' }}
          >
            ¢
          </span>
          {!compact && <span className="text-subtitle2 text-white">{coin.toLocaleString()}</span>}
        </div>
        {onAdd && (
          <button
            aria-label="Add coins"
            onClick={onAdd}
            className="mr-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: 'var(--coin)', color: 'var(--brown-800)' }}
          >
            +
          </button>
        )}
      </div>
      {typeof gem === 'number' && (
        <span className="text-caption1 text-white/80" aria-label="Gems">
          ♦ {gem}
        </span>
      )}
    </div>
  );
}
