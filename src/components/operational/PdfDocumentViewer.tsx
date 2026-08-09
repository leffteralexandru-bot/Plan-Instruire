import { Button } from '@/components/ui/Button';
import { openPdfInNewTab, prefersExternalPdfOpen, toAbsoluteUrl } from '@/lib/pdfViewer';

interface PdfDocumentViewerProps {
  pdfUrl: string;
  title: string;
  /** Înălțime iframe pe desktop */
  iframeClassName?: string;
  /** Pe telefon: mesaj scurt sub buton */
  hint?: string;
  onLoad?: () => void;
}

/**
 * Desktop: PDF în iframe.
 * Telefon/tabletă: buton mare — browserul mobil nu randă PDF în iframe.
 */
export function PdfDocumentViewer({
  pdfUrl,
  title,
  iframeClassName = 'h-[min(70vh,860px)] w-full rounded-lg border border-corporate-border bg-white shadow-sm',
  hint,
  onLoad,
}: PdfDocumentViewerProps) {
  const external = prefersExternalPdfOpen();
  const abs = toAbsoluteUrl(pdfUrl);

  if (external) {
    return (
      <div className="rounded-xl border border-corporate-gold/35 bg-corporate-surface/40 px-4 py-5 text-center space-y-3">
        <p className="text-sm font-semibold text-corporate-dark">{title}</p>
        <p className="text-xs text-corporate-muted leading-relaxed max-w-md mx-auto">
          {hint ??
            'Pe telefon PDF-ul se deschide în viewer-ul browserului (ca pe calculator), nu în caseta din pagină.'}
        </p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full max-w-xs mx-auto"
          onClick={() => openPdfInNewTab(pdfUrl)}
        >
          Deschide PDF
        </Button>
        <p className="text-[11px] text-corporate-muted">
          Sau{' '}
          <a href={abs} target="_blank" rel="noopener noreferrer" className="text-corporate-gold font-medium underline">
            deschide linkul
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <iframe title={title} src={pdfUrl} tabIndex={-1} onLoad={onLoad} className={iframeClassName} />
      <p className="text-[11px] text-corporate-muted">
        Dacă PDF-ul nu apare,{' '}
        <a href={abs} target="_blank" rel="noopener noreferrer" className="font-medium text-corporate-gold hover:underline">
          deschide-l într-un tab nou
        </a>
        .
      </p>
    </div>
  );
}
