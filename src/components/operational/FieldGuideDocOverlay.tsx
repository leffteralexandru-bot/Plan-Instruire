import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  downloadOperationalChecklistPdf,
  printOperationalChecklistPdf,
} from '@/lib/operationalChecklistPdf';
import { shareEquipmentPdf } from '@/lib/downloadEquipmentPdf';

/**
 * Overlay pentru documente din ghid (ex. Anexa 1 șablon):
 * vizualizare PDF + Descarcă + Trimite + Printează.
 */
export function FieldGuideDocOverlay({
  pdfUrl,
  pdfFileName,
  title,
  eyebrow = 'Document ghid',
  onClose,
}: {
  pdfUrl: string;
  pdfFileName: string;
  title: string;
  eyebrow?: string;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);

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

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-corporate-surface/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border bg-white px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
            {eyebrow}
          </p>
          <p className="truncate text-sm font-semibold text-corporate-dark">{title}</p>
          <p className="mt-0.5 text-[10px] text-corporate-muted leading-snug">
            Același document ca linkul din PDF-ul ghid (sau din poza de pe site). Șablon de lucru —
            documentul real semnat rămâne în Bitrix.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={downloading || sharing}
            onClick={() => void handleDownload()}
          >
            {downloading ? '…' : 'Descarcă'}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={downloading || sharing}
            onClick={() => void handleShare()}
          >
            {sharing ? '…' : 'Trimite'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handlePrint}>
            Printează
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Închide
          </Button>
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
      <div className="min-h-0 flex-1 bg-corporate-surface/30 p-2 sm:p-3">
        <iframe
          title={title}
          src={pdfUrl}
          className="h-full min-h-[70vh] w-full rounded-lg border border-corporate-border bg-white shadow-sm"
        />
      </div>
    </div>
  );
}
