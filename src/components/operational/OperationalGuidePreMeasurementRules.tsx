import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  downloadOperationalChecklistPdf,
  printOperationalChecklistPdf,
} from '@/lib/operationalChecklistPdf';

export interface OperationalGuideConditionBarProps {
  conditions: string[];
  /** Ex. „Ghid măsurător” / „Ghid Proiectare” */
  guideEyebrow: string;
  /** Ex. „Condiții obligatorii — înainte de măsurare” */
  guideTitle: string;
  categoryLabel?: string;
  emptyMessage?: string;
  defaultExpanded?: boolean;
  /** Mesaj STOP când e restrâns */
  stopCollapsed: string;
  /** Titlu STOP când e deschis */
  stopExpandedTitle: string;
  /** Subtext STOP când e deschis */
  stopExpandedHint?: string;
  footerNote?: string;
  footerNextHint?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pageImageUrl?: string;
  checklistLabel?: string;
}

function GuideIcon({ className = 'h-4 w-4' }: { className?: string }) {
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
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/70 transition-transform duration-200',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function IconView({ className = 'h-3 w-3 md:h-3.5 md:w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function IconDownload({ className = 'h-3 w-3 md:h-3.5 md:w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 4v10" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18h14" strokeLinecap="round" />
    </svg>
  );
}

function IconPrint({ className = 'h-3 w-3 md:h-3.5 md:w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 8V4h10v4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M7 16H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="7" y="14" width="10" height="6" rx="1" />
    </svg>
  );
}

function IconSpinner({ className = 'h-3 w-3 md:h-3.5 md:w-3.5' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const iconBtnClass =
  'inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-lg border border-corporate-border/80 bg-white text-corporate-dark shadow-sm transition-colors hover:border-corporate-gold/50 hover:bg-corporate-gold-light/40 hover:text-corporate-black focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

function ChecklistViewerModal({
  imageUrl,
  categoryLabel,
  onClose,
}: {
  imageUrl: string;
  categoryLabel?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Checklist oficial${categoryLabel ? ` — ${categoryLabel}` : ''}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-corporate-black/70 backdrop-blur-[2px]"
        aria-label="Închide checklist"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-corporate-border bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-corporate-border bg-corporate-black px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-gold">
              Checklist oficial
            </p>
            <p className="text-xs font-medium text-white/90 truncate">
              {categoryLabel ?? 'Condiții obligatorii'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-white/85 hover:!text-white hover:!bg-white/10 shrink-0"
            onClick={onClose}
          >
            Închide
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto bg-corporate-surface/40 p-2 sm:p-3">
          <img
            src={imageUrl}
            alt={`Checklist — ${categoryLabel ?? 'categorie'}`}
            className="mx-auto w-full max-w-full h-auto rounded-lg border border-corporate-border/80 bg-white shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

/** Bară colapsabilă tip „Ghid măsurător” / „Ghid Proiectare”. */
export function OperationalGuideConditionBar({
  conditions,
  guideEyebrow,
  guideTitle,
  categoryLabel,
  emptyMessage = 'HR va completa condițiile obligatorii pentru această categorie.',
  defaultExpanded = false,
  stopCollapsed,
  stopExpandedTitle,
  stopExpandedHint,
  footerNote,
  footerNextHint,
  pdfUrl,
  pdfFileName,
  pageImageUrl,
  checklistLabel = 'Checklist oficial',
}: OperationalGuideConditionBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const hasPdf = !!(pdfUrl && pdfFileName);
  const hasImage = !!pageImageUrl;

  const handleDownload = async () => {
    if (!pdfUrl || !pdfFileName) return;
    setDownloading(true);
    setPdfError(null);
    try {
      await downloadOperationalChecklistPdf(pdfUrl, pdfFileName);
    } catch {
      setPdfError('Descărcarea PDF a eșuat.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    setPdfError(null);
    try {
      printOperationalChecklistPdf(pdfUrl);
    } catch {
      setPdfError('Printarea PDF a eșuat.');
    }
  };

  return (
    <>
      <section
        className="overflow-hidden rounded-xl border border-corporate-black/10 shadow-sm h-full"
        aria-label={`${guideEyebrow} — ${guideTitle}`}
      >
        <button
          type="button"
          className="w-full bg-corporate-black px-3 py-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-corporate-black/95 transition-colors"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? `Restrânge ${guideEyebrow}` : `Deschide ${guideEyebrow}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-corporate-gold/15 text-corporate-gold">
              <GuideIcon />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-gold leading-none">
                {guideEyebrow}
              </p>
              <p className="text-xs font-medium text-white/90 mt-0.5 leading-snug">
                {guideTitle}
                {categoryLabel ? (
                  <>
                    <span className="text-white/40"> · </span>
                    <span className="text-corporate-gold/90">{categoryLabel}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conditions.length > 0 && (
              <span className="text-[10px] font-medium tabular-nums text-white/45 hidden sm:inline">
                {conditions.length} {conditions.length === 1 ? 'regulă' : 'reguli'}
              </span>
            )}
            <Chevron expanded={expanded} />
          </div>
        </button>

        {!expanded && (
          <div className="border-t border-red-200/60 bg-red-50/80 px-3 py-2 sm:px-4">
            <p className="text-[10px] sm:text-[11px] font-medium text-red-900 leading-snug">{stopCollapsed}</p>
          </div>
        )}

        {expanded && (
          <>
            <div className="border-b border-red-200/80 bg-red-50/90 px-3 py-2 sm:px-4">
              <p className="text-[11px] sm:text-xs font-semibold text-red-900 leading-snug">{stopExpandedTitle}</p>
              {stopExpandedHint ? (
                <p className="text-[10px] sm:text-[11px] text-red-800/85 mt-0.5 leading-snug">{stopExpandedHint}</p>
              ) : null}
            </div>

            {(hasImage || hasPdf) && (
              <div className="border-b border-corporate-border/70 bg-corporate-surface/30 px-3 py-2 sm:px-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
                    {checklistLabel}
                  </p>
                  <div className="flex items-center gap-1 md:gap-1.5">
                    {hasImage && (
                      <button
                        type="button"
                        className={iconBtnClass}
                        title="Deschide checklist"
                        aria-label="Deschide checklist"
                        onClick={() => setViewerOpen(true)}
                      >
                        <IconView />
                      </button>
                    )}
                    {hasPdf && (
                      <>
                        <button
                          type="button"
                          className={iconBtnClass}
                          title="Descarcă PDF"
                          aria-label="Descarcă PDF"
                          disabled={downloading}
                          onClick={() => void handleDownload()}
                        >
                          {downloading ? <IconSpinner /> : <IconDownload />}
                        </button>
                        <button
                          type="button"
                          className={iconBtnClass}
                          title="Printează"
                          aria-label="Printează"
                          onClick={handlePrint}
                        >
                          <IconPrint />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {pdfError && <p className="text-[10px] text-red-600 mt-1.5">{pdfError}</p>}
              </div>
            )}

            {conditions.length > 0 ? (
              <ol className="divide-y divide-corporate-border/70 bg-white">
                {conditions.map((rule, index) => (
                  <li
                    key={`pre-rule-${index}`}
                    className="flex gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-corporate-surface/40 transition-colors"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-corporate-black text-[10px] font-bold text-corporate-gold mt-px"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <p className="text-[11px] sm:text-xs text-corporate-dark leading-snug flex-1">{rule}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="bg-white px-3 py-3 sm:px-4">
                <p className="text-[11px] text-corporate-muted leading-snug">{emptyMessage}</p>
              </div>
            )}

            {(footerNote || footerNextHint) && (
              <footer className="border-t border-corporate-gold/20 bg-corporate-gold-light/20 px-3 py-1.5 sm:px-4">
                {footerNote ? (
                  <p className="text-[10px] text-corporate-stone leading-snug">{footerNote}</p>
                ) : null}
                {footerNextHint ? (
                  <p className="text-[10px] text-corporate-muted leading-snug mt-0.5">{footerNextHint}</p>
                ) : null}
              </footer>
            )}
          </>
        )}
      </section>

      {viewerOpen && pageImageUrl && (
        <ChecklistViewerModal
          imageUrl={pageImageUrl}
          categoryLabel={categoryLabel}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

/** Alias păstrat pentru Ghid măsurător (checklist măsurare). */
export function OperationalGuidePreMeasurementRules({
  conditions,
  categoryLabel,
  emptyMessage,
  defaultExpanded,
  pdfUrl,
  pdfFileName,
  pageImageUrl,
}: {
  conditions: string[];
  categoryLabel?: string;
  emptyMessage?: string;
  defaultExpanded?: boolean;
  pdfUrl?: string;
  pdfFileName?: string;
  pageImageUrl?: string;
}) {
  const count = conditions.length;
  const stopCollapsed =
    count > 0
      ? `STOP — verificați condițiile înainte de plecare. Apăsați pentru a deschide ${count} ${count === 1 ? 'regulă' : 'reguli'}.`
      : 'STOP — verificați condițiile înainte de plecare. Apăsați pentru a deschide checklist-ul oficial.';

  return (
    <OperationalGuideConditionBar
      conditions={conditions}
      guideEyebrow="Ghid măsurător"
      guideTitle="Condiții obligatorii — înainte de măsurare"
      categoryLabel={categoryLabel}
      emptyMessage={emptyMessage}
      defaultExpanded={defaultExpanded}
      stopCollapsed={stopCollapsed}
      stopExpandedTitle="STOP — dacă o singură condiție nu e îndeplinită, nu plecați la măsurare."
      footerNote="artGRANIT · checklist planificare măsurători — referință obligatorie teren"
      footerNextHint="După condiții OK → treceți la Echipament necesar și Pași de măsurare."
      pdfUrl={pdfUrl}
      pdfFileName={pdfFileName}
      pageImageUrl={pageImageUrl}
    />
  );
}

/** Ghid Proiectare — condiții înainte de proiectare. */
export function OperationalGuidePreDesignRules({
  conditions,
  categoryLabel,
  emptyMessage = 'Condițiile obligatorii înainte de proiectare vor fi adăugate de HR.',
  defaultExpanded = false,
}: {
  conditions: string[];
  categoryLabel?: string;
  emptyMessage?: string;
  defaultExpanded?: boolean;
}) {
  const count = conditions.length;
  const stopCollapsed =
    count > 0
      ? `STOP — verificați condițiile înainte de proiectare. Apăsați pentru a deschide ${count} ${count === 1 ? 'regulă' : 'reguli'}.`
      : 'STOP — verificați condițiile înainte de proiectare. Apăsați pentru a deschide ghidul.';

  return (
    <OperationalGuideConditionBar
      conditions={conditions}
      guideEyebrow="Ghid Proiectare"
      guideTitle="Condiții obligatorii — înainte de proiectare"
      categoryLabel={categoryLabel}
      emptyMessage={emptyMessage}
      defaultExpanded={defaultExpanded}
      stopCollapsed={stopCollapsed}
      stopExpandedTitle="STOP — dacă o singură condiție nu e îndeplinită, nu începeți proiectarea."
      stopExpandedHint="Verificați datele de măsurare și cerințele înainte de a deschide proiectul."
    />
  );
}
