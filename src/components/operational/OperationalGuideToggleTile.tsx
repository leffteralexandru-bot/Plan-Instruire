import { usePhoneLayout } from '@/hooks/usePhoneLayout';

function GuideIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" />
      <path d="M9 12h6M12 9v6" strokeLinecap="round" />
    </svg>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={[
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-transform duration-200',
        expanded
          ? 'rotate-180 border-white/15 bg-white/5 text-white/70'
          : 'border-corporate-border bg-corporate-surface text-corporate-muted',
      ].join(' ')}
      aria-hidden
    >
      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

interface OperationalGuideToggleTileProps {
  eyebrow: string;
  actionLabel: string;
  categoryLabel: string;
  /** Pe telefon — text scurt, litere mici (ex. „ghid măsurare”) */
  mobileLabel: string;
  expanded: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

/** Buton compact — fond deschis închis; fond negru când e expandat. */
export function OperationalGuideToggleTile({
  eyebrow,
  actionLabel,
  categoryLabel,
  mobileLabel,
  expanded,
  onToggle,
  ariaLabel,
}: OperationalGuideToggleTileProps) {
  const phoneLayout = usePhoneLayout();

  return (
    <button
      type="button"
      className={[
        'w-full h-full min-h-[3.25rem] text-left rounded-lg overflow-hidden border transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-1',
        expanded
          ? [
              'relative z-10 bg-corporate-black hover:bg-corporate-black/95',
              'border-corporate-gold/40 shadow-md ring-2 ring-corporate-gold/30',
              'rounded-b-none border-b-0',
            ].join(' ')
          : [
              'bg-white hover:bg-corporate-gold-light/40',
              'border-corporate-border shadow-sm',
            ].join(' '),
      ].join(' ')}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2 px-2.5 py-2 sm:px-3">
        <span
          className={[
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
            expanded
              ? 'bg-corporate-gold/15 text-corporate-gold'
              : 'bg-corporate-gold-light text-corporate-gold',
          ].join(' ')}
        >
          <GuideIcon />
        </span>
        <div className="min-w-0 flex-1">
          {phoneLayout ? (
            <p
              className={[
                'text-[10px] font-medium leading-snug truncate',
                expanded ? 'text-white/90' : 'text-corporate-dark',
              ].join(' ')}
            >
              {mobileLabel}
            </p>
          ) : (
            <>
              <p
                className={[
                  'text-[9px] font-semibold uppercase tracking-[0.14em] leading-none truncate',
                  expanded ? 'text-corporate-gold' : 'text-corporate-muted',
                ].join(' ')}
              >
                {eyebrow}
              </p>
              <p
                className={[
                  'text-[11px] font-medium mt-0.5 leading-snug truncate',
                  expanded ? 'text-white/90' : 'text-corporate-dark',
                ].join(' ')}
              >
                {actionLabel}
                <span className={expanded ? 'text-white/40' : 'text-corporate-border'}> · </span>
                <span className={expanded ? 'text-corporate-gold/90' : 'text-corporate-gold'}>
                  {categoryLabel}
                </span>
              </p>
            </>
          )}
        </div>
        <Chevron expanded={expanded} />
      </div>
      {expanded && (
        <div className="px-3 pb-1.5" aria-hidden>
          <div className="h-0.5 rounded-full bg-corporate-gold/80" />
        </div>
      )}
    </button>
  );
}
