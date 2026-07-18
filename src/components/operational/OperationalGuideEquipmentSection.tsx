import { useState } from 'react';
import {
  OperationalGuideCollapsibleShell,
  OperationalGuideDocActions,
} from '@/components/operational/OperationalGuideDocActions';

interface OperationalGuideEquipmentSectionProps {
  items: string[];
  defaultExpanded?: boolean;
  pdfUrl?: string;
  pdfFileName?: string;
  pageImageUrl?: string;
}

export function OperationalGuideEquipmentSection({
  items,
  defaultExpanded = false,
  pdfUrl,
  pdfFileName,
  pageImageUrl,
}: OperationalGuideEquipmentSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = items.length;

  return (
    <OperationalGuideCollapsibleShell
      ariaLabel="Echipament necesar"
      eyebrow="Pregătire teren"
      title="Echipament necesar"
      subtitle="Ce luați cu voi — după ce condițiile obligatorii sunt îndeplinite."
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      docActions={
        <OperationalGuideDocActions
          pdfUrl={pdfUrl}
          pdfFileName={pdfFileName}
          pageImageUrl={pageImageUrl}
          viewerEyebrow="Pregătire teren"
          viewerTitle="Echipament necesar"
        />
      }
    >
      {count === 0 ? (
        <p className="text-[11px] text-corporate-muted px-1 py-1">Lista de echipament va fi adăugată de HR.</p>
      ) : (
        <ol className="space-y-1 list-none">
          {items.map((item, index) => (
            <li
              key={`equip-${index}-${item.slice(0, 24)}`}
              className="flex items-start gap-2 rounded-lg border border-corporate-border/70 bg-corporate-surface/20 px-2.5 py-1.5"
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-corporate-black text-[9px] font-bold text-corporate-gold mt-px"
                aria-hidden
              >
                {index + 1}
              </span>
              <p className="text-[11px] text-corporate-dark leading-snug">{item}</p>
            </li>
          ))}
        </ol>
      )}
    </OperationalGuideCollapsibleShell>
  );
}
