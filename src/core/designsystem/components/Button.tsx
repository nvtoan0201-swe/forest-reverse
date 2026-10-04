import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export type ButtonVariant =
  | 'brand'
  | 'accentGreen'
  | 'accentTeal'
  | 'accentYellow'
  | 'gray'
  | 'red'
  | 'ghost';

export type ButtonSize = 'default' | 'big' | 'chip';

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  brand: {},
  accentGreen: { '--fg-bg': '#8dc925', '--fg-shadow-color': '#64a408' } as CSSProperties,
  accentTeal: { '--fg-bg': '#67d0ac', '--fg-shadow-color': '#278063' } as CSSProperties,
  accentYellow: { '--fg-bg': '#f1c21b', '--fg-shadow-color': '#daa700' } as CSSProperties,
  gray: { '--fg-bg': '#c9c9c9', '--fg-shadow-color': '#888888' } as CSSProperties,
  red: { '--fg-bg': '#f26663', '--fg-shadow-color': '#db3328' } as CSSProperties,
  ghost: {
    '--fg-bg': 'transparent',
    '--fg-shadow-color': 'transparent',
    color: 'inherit',
  } as CSSProperties,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  long?: boolean;
  full?: boolean;
  leadingIcon?: ReactNode;
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  default: 'h-[40px] min-w-[120px] px-5',
  big: 'h-[50px] min-w-[180px] px-6 rounded-[6px]',
  chip: 'h-[30px] min-w-[80px] px-3 rounded-full',
};

export function Button({
  variant = 'brand',
  size = 'default',
  long = false,
  full = false,
  leadingIcon,
  className = '',
  style,
  children,
  ...rest
}: ButtonProps) {
  const shadow = size === 'big' ? 6 : size === 'chip' ? 3 : 4;
  return (
    <button
      className={`fg-button text-button2 ${SIZE_CLASS[size]} ${long ? 'min-w-[250px]' : ''} ${
        full ? 'w-full' : ''
      } ${className}`}
      style={{ '--fg-shadow': `${shadow}px`, ...VARIANT_STYLE[variant], ...style } as CSSProperties}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
  active?: boolean;
}

export function IconButton({ label, size = 40, active = false, className = '', children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        active ? 'bg-white/20' : 'hover:bg-white/10'
      } ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  );
}
