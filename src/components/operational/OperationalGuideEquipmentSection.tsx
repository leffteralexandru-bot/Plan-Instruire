import { useState } from 'react';
import {
  OperationalGuideCollapsibleShell,
  OperationalGuideDocActions,
} from '@/components/operational/OperationalGuideDocActions';

interface OperationalGuideEquipmentSectionProps {
  items: string[];
  kitDocuments?: string[];
  defaultExpanded?: boolean;
  pdfUrl?: string;
  pdfFileName?: string;
  pageImageUrl?: string;
  fieldGuidePdfUrl?: string;
  fieldGuidePdfFileName?: string;
}

export function OperationalGuideEquipmentSection({
  items,
  kitDocuments = [],
  defaultExpanded = false,
  pdfUrl,
  pdfFileName,
  pageImageUrl,
  fieldGuidePdfUrl,
  fieldGuidePdfFileName,
}: OperationalGuideEquipmentSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = items.length;
  const kitCount = kitDocuments.length;

  return (
    <OperationalGuideCollapsibleShell
      ariaLabel="Echipament și kit documente"
      eyebrow="Pregătire drum"
      title="Echipament + Full Kit"
      subtitle="Aceeași listă pentru toate tipurile. Fără trusă completă, nu pleacă spre măsurare."
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      docActions={
        <div className="flex items-center gap-1">
          {fieldGuidePdfUrl ? (
            <OperationalGuideDocActions
              pdfUrl={fieldGuidePdfUrl}
              pdfFileName={fieldGuidePdfFileName}
              viewerEyebrow="Ghid teren"
              viewerTitle="Ghid complet pe tip"
            />
          ) : null}
          <OperationalGuideDocActions
            pdfUrl={pdfUrl}
            pdfFileName={pdfFileName}
            pageImageUrl={pageImageUrl}
            viewerEyebrow="Pregătire drum"
            viewerTitle="Echipament necesar"
          />
        </div>
      }
    >
      {count === 0 ? (
        <p className="text-[11px] text-corporate-muted px-1 py-1">Lista de echipament va fi adăugată de HR.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
              Echipament pe teren
            </p>
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
          </div>

          {kitCount > 0 ? (
            <div>
              <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
                Kit documente (Full Kit)
              </p>
              <p className="mb-1.5 rounded-md border border-amber-200/80 bg-amber-50/80 px-2.5 py-1.5 text-[10px] text-corporate-dark leading-snug">
                Anexa 1, Checklist, Canting și CTG din ghid sunt EXEMPLE. Documentele REALE le descarci din
                Bitrix — atașate la proiectul la care ești planificat. Nu măsura pe exemplu.
              </p>
              <ol className="space-y-1 list-none">
                {kitDocuments.map((item, index) => (
                  <li
                    key={`kit-${index}-${item.slice(0, 24)}`}
                    className="flex items-start gap-2 rounded-lg border border-corporate-border/70 bg-corporate-surface/20 px-2.5 py-1.5"
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-corporate-border bg-white text-[9px] font-bold text-corporate-dark mt-px"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <p className="text-[11px] text-corporate-dark leading-snug">{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}
    </OperationalGuideCollapsibleShell>
  );
}
