import { ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { BUTTON_LABEL_RESPONSIVE, RESPONSIVE_TRANSITION } from '@/lib/responsiveLayout';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Iconiță afișată înaintea textului. */
  icon?: ReactNode;
  /** Pe mobil: icon + text compact; de la @md: layout standard pe linie. */
  iconOnlyMobile?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-corporate-black text-white hover:bg-corporate-darker shadow-sm',
  secondary: 'bg-corporate-gold text-corporate-black hover:bg-corporate-gold-hover shadow-gold',
  ghost: 'bg-transparent text-corporate-muted hover:bg-corporate-surface',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm min-h-[44px] @md:min-h-0 @md:py-1.5',
  md: 'px-4 py-2.5 text-sm min-h-[44px] @md:min-h-0',
  lg: 'px-6 py-3 text-base min-h-[44px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      icon,
      iconOnlyMobile = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        iconOnlyMobile ? 'flex-col gap-1 @md:flex-row @md:gap-2' : '',
        RESPONSIVE_TRANSITION,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
      {iconOnlyMobile ? <span className={BUTTON_LABEL_RESPONSIVE}>{children}</span> : children}
    </button>
  ),
);

Button.displayName = 'Button';
