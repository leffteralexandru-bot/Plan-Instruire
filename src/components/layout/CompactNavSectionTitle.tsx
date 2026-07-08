import { NavIcon } from '@/components/layout/NavIcon';
import { useActiveNavSection } from '@/hooks/useActiveNavSection';
import { useCompactNavLayout } from '@/hooks/useCompactNavLayout';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';
import { RESPONSIVE_TRANSITION } from '@/lib/responsiveLayout';

/** Titlu secțiune activă — afișat sus în pagină când navigarea e în bara de jos. */
export function CompactNavSectionTitle() {
  const compactNav = useCompactNavLayout();
  const phoneLayout = usePhoneLayout();
  const active = useActiveNavSection();

  if (!compactNav || !active) return null;

  const showSubtitle =
    active.shortLabel.trim().toLocaleLowerCase('ro') !== active.label.trim().toLocaleLowerCase('ro');

  return (
    <div
      className={[
        'mb-4 flex w-full items-center gap-2.5 border-b border-corporate-border pb-3',
        RESPONSIVE_TRANSITION,
      ].join(' ')}
      aria-current="page"
    >
      <span
        className={[
          'flex shrink-0 items-center justify-center rounded-lg bg-corporate-gold/15 text-corporate-gold',
          phoneLayout ? 'h-7 w-7' : 'h-9 w-9',
        ].join(' ')}
      >
        <NavIcon id={active.icon} className={phoneLayout ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
      <div className="min-w-0">
        <h1
          className={[
            'line-clamp-2 font-semibold leading-snug text-corporate-dark',
            phoneLayout ? 'text-sm' : 'text-base @md:text-lg',
          ].join(' ')}
        >
          {active.label}
        </h1>
        {showSubtitle ? (
          <p
            className={[
              'line-clamp-2 leading-snug text-corporate-muted',
              phoneLayout ? 'text-[10px]' : 'text-xs @md:text-sm',
            ].join(' ')}
          >
            {active.shortLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
