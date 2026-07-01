type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'locked';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-corporate-surface text-corporate-stone ring-1 ring-corporate-border',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  info: 'bg-corporate-gold-light text-corporate-gold-hover ring-1 ring-corporate-gold/30',
  locked: 'bg-corporate-surface text-corporate-muted ring-1 ring-corporate-border',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
