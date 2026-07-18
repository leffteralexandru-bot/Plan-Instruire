import { useState } from 'react';
import {
  OperationalGuideCollapsibleShell,
  OperationalGuideDocActions,
} from '@/components/operational/OperationalGuideDocActions';

interface OperationalGuideStepsSectionProps {
  steps: string[];
  taskId: string;
  defaultExpanded?: boolean;
  pdfUrl?: string;
  pdfFileName?: string;
  pageImageUrl?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
}

export function OperationalGuideStepsSection({
  steps,
  taskId,
  defaultExpanded = false,
  pdfUrl,
  pdfFileName,
  pageImageUrl,
  eyebrow = 'Pe teren',
  title = 'Pași de măsurare',
  subtitle = 'Ordinea pe șantier — adaptați tipului de măsurare, după echipament.',
  emptyMessage = 'Pașii vor fi adăugați de HR.',
}: OperationalGuideStepsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = steps.length;
  const hasDocs = !!(pdfUrl || pageImageUrl);

  return (
    <OperationalGuideCollapsibleShell
      ariaLabel={title}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      docActions={
        hasDocs ? (
          <OperationalGuideDocActions
            pdfUrl={pdfUrl}
            pdfFileName={pdfFileName}
            pageImageUrl={pageImageUrl}
            viewerEyebrow={eyebrow}
            viewerTitle={title}
          />
        ) : undefined
      }
    >
      {count === 0 ? (
        <p className="text-[11px] text-corporate-muted px-1 py-1">{emptyMessage}</p>
      ) : (
        <ol className="space-y-1 list-none">
          {steps.map((step, index) => (
            <li
              key={`${taskId}-step-${index}`}
              className="flex items-start gap-2 rounded-lg border border-corporate-border/70 bg-corporate-surface/20 px-2.5 py-1.5"
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-corporate-black text-[9px] font-bold text-corporate-gold mt-px"
                aria-hidden
              >
                {index + 1}
              </span>
              <p className="text-[11px] text-corporate-dark leading-snug">{step}</p>
            </li>
          ))}
        </ol>
      )}
    </OperationalGuideCollapsibleShell>
  );
}
