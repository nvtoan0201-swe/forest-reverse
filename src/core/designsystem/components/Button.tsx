import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MOTION } from '../motion';

export type ButtonVariant =
  | 'brand'
  | 'accentGreen'
  | 'accentTeal'
  | 'accentYellow'
  | 'gray'
  | 'red'
  | 'subscription'
  | 'outlined'
  | 'ghost';

export type ButtonSize = 'default' | 'big' | 'chip';

/** Shadow sizes: default 4dp, big 6dp, chip 3dp (plans/05.02 §5). */
const SHADOW_SIZE: Record<ButtonSize, number> = { default: 4, big: 6, chip: 3 };

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  brand: { '--fg-bg': 'var(--brand)', '--fg-shadow-color': 'var(--brand-variant)' } as CSSProperties,
  accentGreen: {
    '--fg-bg': 'var(--button-accent-green-bg)',
    '--fg-shadow-color': 'var(--button-accent-green-shadow)',
  } as CSSProperties,
  accentTeal: {
    '--fg-bg': 'var(--button-accent-teal-bg)',
    '--fg-shadow-color': 'var(--button-accent-teal-shadow)',
  } as CSSProperties,
  accentYellow: {
    '--fg-bg': 'var(--button-accent-yellow-bg)',
    '--fg-shadow-color': 'var(--button-accent-yellow-shadow)',
  } as CSSProperties,
  gray: {
    '--fg-bg': 'var(--button-gray-bg)',
    '--fg-shadow-color': 'var(--button-gray-shadow)',
  } as CSSProperties,
  red: {
    '--fg-bg': 'var(--button-red-bg)',
    '--fg-shadow-color': 'var(--button-red-shadow)',
  } as CSSProperties,
  subscription: {
    '--fg-bg': 'var(--gradient-subscription)',
    '--fg-shadow-color': 'var(--gradient-subscription-shadow)',
  } as CSSProperties,
  outlined: {
    '--fg-bg': 'transparent',
    '--fg-shadow-color': 'transparent',
    border: '1px solid var(--forest-teal-600)',
    color: 'var(--forest-teal-600)',
  } as CSSProperties,
  ghost: {
    '--fg-bg': 'transparent',
    '--fg-shadow-color': 'transparent',
    color: 'inherit',
  } as CSSProperties,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  default: 'h-[40px] min-w-[120px] px-5 text-button2',
  big: 'h-[50px] min-w-[180px] px-6',
  chip: 'h-[30px] min-w-[80px] px-3 text-button4',
};

type MotionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart' | 'style'
>;

interface ButtonProps extends MotionButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  long?: boolean;
  full?: boolean;
  leadingIcon?: ReactNode;
  style?: CSSProperties;
}

export function Button({
  variant = 'brand',
  size = 'default',
  long = false,
  full = false,
  leadingIcon,
  className = '',
  style,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const shadow = SHADOW_SIZE[size];
  const radius = size === 'chip' ? 'var(--radius-full)' : size === 'big' ? '6px' : 'var(--radius-button)';
  return (
    <motion.button
      type="button"
      disabled={disabled}
      className={`fg-button ${SIZE_CLASS[size]} ${long ? 'min-w-[250px]' : ''} ${full ? 'w-full' : ''} ${className}`}
      style={
        {
          '--fg-shadow': `${shadow}px`,
          borderRadius: radius,
          ...VARIANT_STYLE[variant],
          ...style,
        } as CSSProperties
      }
      whileTap={disabled ? undefined : { scale: MOTION.press.scale, y: shadow }}
      transition={{ type: 'spring', ...MOTION.press.spring }}
      {...rest}
    >
      {leadingIcon}
      {children}
    </motion.button>
  );
}

type MotionIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart' | 'style'
>;

interface IconButtonProps extends MotionIconButtonProps {
  label: string;
  size?: number;
  active?: boolean;
  style?: CSSProperties;
}

export function IconButton({ label, size = 40, active = false, className = '', children, style, ...rest }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full ${
        active ? 'bg-white/20' : 'hover:bg-white/10'
      } ${className}`}
      style={{ width: size, height: size, ...style }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', ...MOTION.press.spring }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
