import type { ReactNode } from 'react';
import { RESPONSIVE_TRANSITION } from '@/lib/responsiveLayout';

export type TechnicalCardVariant = 'chapter' | 'content' | 'safety';

interface TechnicalCardProps {
  title: string;
  titleId?: string;
  subtitle?: string;
  chapterNumber?: number;
  active?: boolean;
  expanded?: boolean;
  variant?: TechnicalCardVariant;
  onClick?: () => void;
  as?: 'button' | 'article';
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<TechnicalCardVariant, string> = {
  chapter:
    'border-corporate-border bg-white hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10',
  content: 'border-corporate-border bg-white',
  safety: 'border-amber-300/80 bg-amber-50/90',
};

/**
 * Card tehnic reutilizabil — se adaptează la telefon (listă/accordion), tabletă (grid 2 col) și sidebar.
 */
export function TechnicalCard({
  title,
  titleId,
  subtitle,
  chapterNumber,
  active = false,
  expanded = false,
  variant = 'chapter',
  onClick,
  as = onClick ? 'button' : 'article',
  className = '',
  children,
}: TechnicalCardProps) {
  const base = [
    '@container/tech-card w-full text-left rounded-xl border transition-all',
    RESPONSIVE_TRANSITION,
    variantStyles[variant],
    active ? 'border-corporate-gold ring-2 ring-corporate-gold/30 shadow-gold-soft' : '',
    expanded ? '@min-[640px]:col-span-2 @lg:col-span-1' : '',
    className,
  ].join(' ');

  const inner = (
    <>
      <div className="flex items-start gap-3 px-3 py-3 @min-[640px]:px-4 @min-[640px]:py-3.5 @lg:px-4 @lg:py-4">
        {chapterNumber != null && (
          <span
            className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
              active ? 'bg-corporate-black text-white' : 'bg-corporate-surface text-corporate-dark',
            ].join(' ')}
            aria-hidden
          >
            {chapterNumber}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            id={titleId}
            className="text-sm font-semibold text-corporate-dark @lg:text-base leading-snug"
          >
            {title}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-corporate-muted leading-relaxed @lg:text-sm line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
        {onClick && (
          <span className="shrink-0 text-corporate-gold text-xs @lg:text-sm" aria-hidden>
            {active ? '▼' : '→'}
          </span>
        )}
      </div>
      {children && (
        <div className="border-t border-corporate-border/70 px-3 pb-3 pt-2 @min-[640px]:px-4 @min-[640px]:pb-4 @lg:px-4 @lg:pb-5">
          {children}
        </div>
      )}
    </>
  );

  if (as === 'button') {
    return (
      <button type="button" onClick={onClick} className={base} aria-pressed={active}>
        {inner}
      </button>
    );
  }

  return <article className={base}>{inner}</article>;
}
