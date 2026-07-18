import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import {
  downloadOperationalChecklistPdf,
  printOperationalChecklistPdf,
} from '@/lib/operationalChecklistPdf';

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
  'inline-flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-md border border-corporate-border/80 bg-white text-corporate-dark shadow-sm transition-colors hover:border-corporate-gold/50 hover:bg-corporate-gold-light/40 hover:text-corporate-black focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

function DocViewerModal({
  imageUrl,
  eyebrow,
  title,
  onClose,
}: {
  imageUrl: string;
  eyebrow: string;
  title: string;
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
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-corporate-black/70 backdrop-blur-[2px]"
        aria-label="Închide"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-corporate-border bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-corporate-border bg-corporate-black px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-gold">{eyebrow}</p>
            <p className="text-xs font-medium text-white/90 truncate">{title}</p>
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
            alt={title}
            className="mx-auto w-full max-w-full h-auto rounded-lg border border-corporate-border/80 bg-white shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

export interface OperationalGuideDocActionsProps {
  pdfUrl?: string;
  pdfFileName?: string;
  pageImageUrl?: string;
  viewerEyebrow: string;
  viewerTitle: string;
  /** Oprește propagarea click pe toolbar (ex. în header colapsabil) */
  stopPropagation?: boolean;
}

/** Butoane vizualizare / descărcare / print — același tipar ca Checklist oficial. */
export function OperationalGuideDocActions({
  pdfUrl,
  pdfFileName,
  pageImageUrl,
  viewerEyebrow,
  viewerTitle,
  stopPropagation = true,
}: OperationalGuideDocActionsProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPdf = !!(pdfUrl && pdfFileName);
  const hasImage = !!pageImageUrl;

  if (!hasPdf && !hasImage) return null;

  const guard = (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  const handleDownload = async (e: MouseEvent) => {
    guard(e);
    if (!pdfUrl || !pdfFileName) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadOperationalChecklistPdf(pdfUrl, pdfFileName);
    } catch {
      setError('Descărcarea PDF a eșuat.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = (e: MouseEvent) => {
    guard(e);
    if (!pdfUrl) return;
    setError(null);
    try {
      printOperationalChecklistPdf(pdfUrl);
    } catch {
      setError('Printarea PDF a eșuat.');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-0.5 md:gap-1" onClick={guard}>
        {hasImage && (
          <button
            type="button"
            className={iconBtnClass}
            title="Deschide"
            aria-label={`Deschide ${viewerTitle}`}
            onClick={(e) => {
              guard(e);
              setViewerOpen(true);
            }}
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
              aria-label={`Descarcă ${viewerTitle}`}
              disabled={downloading}
              onClick={(e) => void handleDownload(e)}
            >
              {downloading ? <IconSpinner /> : <IconDownload />}
            </button>
            <button
              type="button"
              className={iconBtnClass}
              title="Printează"
              aria-label={`Printează ${viewerTitle}`}
              onClick={handlePrint}
            >
              <IconPrint />
            </button>
          </>
        )}
        {error && <p className="text-[9px] text-red-600 max-w-[2.5rem] text-center leading-tight">{error}</p>}
      </div>

      {viewerOpen && pageImageUrl && (
        <DocViewerModal
          imageUrl={pageImageUrl}
          eyebrow={viewerEyebrow}
          title={viewerTitle}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

export function OperationalGuideCollapsibleChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={[
        'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OperationalGuideCollapsibleShell({
  ariaLabel,
  eyebrow,
  title,
  subtitle,
  expanded,
  onToggle,
  docActions,
  children,
}: {
  ariaLabel: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  docActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-corporate-border/90 bg-white shadow-sm"
      aria-label={ariaLabel}
    >
      <div className="px-2 pt-1.5 sm:px-3 sm:pt-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left rounded-lg px-1 py-0.5 hover:bg-corporate-surface/40 transition-colors"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-corporate-muted leading-none">
              {eyebrow}
            </p>
            <p className="text-xs font-semibold text-corporate-dark mt-0.5 leading-snug">{title}</p>
            {subtitle ? (
              <p className="text-[10px] text-corporate-muted leading-snug mt-0.5 pr-1">{subtitle}</p>
            ) : null}
          </button>

          {docActions ? (
            <div className="flex flex-col items-center gap-1 shrink-0">{docActions}</div>
          ) : null}
        </div>

        <div className="flex justify-center pt-0.5 pb-0.5">
          <button
            type="button"
            className="p-0.5 text-corporate-muted/75 hover:text-corporate-dark transition-colors"
            onClick={onToggle}
            aria-label={expanded ? 'Restrânge secțiunea' : 'Deschide secțiunea'}
          >
            <OperationalGuideCollapsibleChevron expanded={expanded} />
          </button>
        </div>
      </div>

      {expanded && <div className="border-t border-corporate-border/80 px-2.5 py-2 sm:px-3">{children}</div>}
    </section>
  );
}
