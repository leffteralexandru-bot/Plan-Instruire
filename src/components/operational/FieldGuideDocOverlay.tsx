import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  downloadOperationalChecklistPdf,
  printOperationalChecklistPdf,
} from '@/lib/operationalChecklistPdf';
import { shareEquipmentPdf } from '@/lib/downloadEquipmentPdf';
import {
  IconClose,
  IconDownload,
  IconPrint,
  IconShare,
  PDF_ICON_BTN,
} from '@/components/operational/PdfActionIcons';
import { PdfDocumentViewer } from '@/components/operational/PdfDocumentViewer';

/**
 * Document din ghid (ex. Anexa 1): vizualizare PDF + acțiuni icon-only.
 * Implicit: panou deasupra manualului ghid (meniul site-ului rămâne vizibil).
 */
export function FieldGuideDocOverlay({
  pdfUrl,
  pdfFileName,
  title,
  eyebrow = 'Document ghid',
  returnLabel = 'Închide',
  contextHint = 'Extindere peste manualul ghid — meniul de sus rămâne. Închide ca să continui ghidul.',
  onClose,
  /** panel = deasupra manualului ghid; overlay = ecran plin (rar) */
  placement = 'panel',
}: {
  pdfUrl: string;
  pdfFileName: string;
  title: string;
  eyebrow?: string;
  returnLabel?: string;
  contextHint?: string;
  onClose: () => void;
  placement?: 'panel' | 'overlay';
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isOverlay = placement === 'overlay';

  /** Aduce antetul panoului (titlu Anexa + buton Închide) imediat sub meniul sticky */
  const scrollPanelHeaderIntoView = () => {
    const el = toolbarRef.current ?? panelRef.current;
    if (!el) return;
    const sticky = document.querySelector('header.sticky');
    const chrome = sticky ? Math.ceil(sticky.getBoundingClientRect().height) : 160;
    const y = el.getBoundingClientRect().top + window.scrollY - chrome - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    if (!isOverlay) {
      // Sus la titlu + Închide (Anexa 1 · șablon …), nu jos pe PDF
      const t1 = window.setTimeout(scrollPanelHeaderIntoView, 0);
      const t2 = window.setTimeout(scrollPanelHeaderIntoView, 100);
      const t3 = window.setTimeout(scrollPanelHeaderIntoView, 400);
      return () => {
        document.removeEventListener('keydown', onKey);
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, isOverlay, pdfUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    setShareHint(null);
    try {
      await downloadOperationalChecklistPdf(pdfUrl, pdfFileName);
    } catch {
      setError('Descărcarea a eșuat. Încercați din nou.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setError(null);
    setShareHint(null);
    try {
      const result = await shareEquipmentPdf(pdfUrl, pdfFileName, {
        title,
        text: `Document ghid teren artGRANIT — ${title}`,
      });
      if (result === 'mailto') {
        setShareHint('S-a deschis emailul cu linkul documentului.');
      } else if (result === 'copied') {
        setShareHint('Linkul a fost copiat — poți să-l trimiți oricui.');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError('Trimiterea a eșuat. Încercați din nou.');
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    setError(null);
    try {
      printOperationalChecklistPdf(pdfUrl);
    } catch {
      setError('Printul nu a putut fi deschis.');
    }
  };

  const shellClass = isOverlay
    ? 'fixed inset-0 z-[90] flex flex-col bg-corporate-surface/95 backdrop-blur-sm'
    : 'relative z-20 mb-3 flex flex-col overflow-hidden rounded-xl border border-corporate-gold/40 bg-white shadow-md';

  return (
    <div
      ref={panelRef}
      className={shellClass}
      role={isOverlay ? 'dialog' : 'region'}
      aria-modal={isOverlay ? true : undefined}
      aria-label={title}
    >
      <div
        ref={toolbarRef}
        className="flex scroll-mt-[var(--guide-doc-scroll-mt,10.5rem)] flex-wrap items-center justify-between gap-2 border-b border-corporate-border bg-corporate-surface/50 px-3 py-2.5 sm:px-4"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
            {eyebrow}
          </p>
          <p className="truncate text-sm font-semibold text-corporate-dark">{title}</p>
          <p className="mt-0.5 text-[10px] text-corporate-muted leading-snug">{contextHint}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1 sm:gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={PDF_ICON_BTN}
            disabled={downloading || sharing}
            aria-label={downloading ? 'Se descarcă' : 'Descarcă'}
            title="Descarcă"
            onClick={() => void handleDownload()}
            icon={<IconDownload />}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={PDF_ICON_BTN}
            disabled={downloading || sharing}
            aria-label={sharing ? 'Se trimite' : 'Trimite'}
            title="Trimite"
            onClick={() => void handleShare()}
            icon={<IconShare />}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={PDF_ICON_BTN}
            aria-label="Printează"
            title="Printează"
            onClick={handlePrint}
            icon={<IconPrint />}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={PDF_ICON_BTN}
            aria-label={returnLabel}
            title={returnLabel}
            onClick={onClose}
            icon={<IconClose />}
          />
        </div>
      </div>
      {shareHint ? (
        <p className="border-b border-corporate-border bg-corporate-surface/40 px-3 py-1.5 text-[11px] text-corporate-muted">
          {shareHint}
        </p>
      ) : null}
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
          {error}
        </p>
      ) : null}
      <div
        className={
          isOverlay
            ? 'min-h-0 flex-1 bg-corporate-surface/30 p-2 sm:p-3'
            : 'bg-corporate-surface/30 p-2 sm:p-3'
        }
      >
        <PdfDocumentViewer
          pdfUrl={pdfUrl}
          title={title}
          iframeClassName={
            isOverlay
              ? 'h-full min-h-[70vh] w-full rounded-lg border border-corporate-border bg-white shadow-sm'
              : 'h-[min(70vh,860px)] w-full rounded-lg border border-corporate-border bg-white shadow-sm'
          }
          onLoad={() => {
            if (!isOverlay) scrollPanelHeaderIntoView();
          }}
        />
      </div>
    </div>
  );
}
