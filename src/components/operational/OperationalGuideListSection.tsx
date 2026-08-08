import { useState, type ReactNode } from 'react';
import { OperationalGuideCollapsibleShell } from '@/components/operational/OperationalGuideDocActions';

interface OperationalGuideListSectionProps {
  items: string[];
  sectionId: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  defaultExpanded?: boolean;
  /** numbered | bullets | checklist */
  variant?: 'numbered' | 'bullets' | 'checklist';
  /** Optional callout above the list */
  callout?: string;
  docActions?: ReactNode;
}

export function OperationalGuideListSection({
  items,
  sectionId,
  eyebrow,
  title,
  subtitle,
  emptyMessage = 'Conținutul va fi adăugat de HR.',
  defaultExpanded = false,
  variant = 'bullets',
  callout,
  docActions,
}: OperationalGuideListSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = items.length;

  return (
    <OperationalGuideCollapsibleShell
      ariaLabel={title}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      docActions={docActions}
    >
      {callout ? (
        <p className="mb-2 rounded-md border border-corporate-gold/40 bg-corporate-gold-light/30 px-2.5 py-1.5 text-[11px] font-medium text-corporate-dark leading-snug">
          {callout}
        </p>
      ) : null}
      {count === 0 ? (
        <p className="text-[11px] text-corporate-muted px-1 py-1">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1 list-none">
          {items.map((item, index) => (
            <li
              key={`${sectionId}-${index}`}
              className="flex items-start gap-2 rounded-lg border border-corporate-border/70 bg-corporate-surface/20 px-2.5 py-1.5"
            >
              {variant === 'numbered' ? (
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-corporate-black text-[9px] font-bold text-corporate-gold mt-px"
                  aria-hidden
                >
                  {index + 1}
                </span>
              ) : variant === 'checklist' ? (
                <span
                  className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-corporate-border bg-white text-[8px] text-corporate-muted"
                  aria-hidden
                >
                  ☐
                </span>
              ) : (
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-corporate-gold"
                  aria-hidden
                />
              )}
              <p className="text-[11px] text-corporate-dark leading-snug">{item}</p>
            </li>
          ))}
        </ul>
      )}
    </OperationalGuideCollapsibleShell>
  );
}
