import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentChapterBlocks } from '@/components/equipment/EquipmentChapterBlocks';
import { EquipmentChapterMedia } from '@/components/equipment/EquipmentChapterMedia';
import { EquipmentManualPage } from '@/components/equipment/EquipmentManualPage';
import type { EquipmentChapter, EquipmentDevice } from '@/data/equipmentOperations';
import { downloadEquipmentPdf } from '@/lib/downloadEquipmentPdf';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';

interface EquipmentChapterViewProps {
  device: EquipmentDevice;
  chapter: EquipmentChapter;
  showPdfButton?: boolean;
  pdfButtonFullWidth?: boolean;
}

export function EquipmentChapterView({
  device,
  chapter,
  showPdfButton = true,
  pdfButtonFullWidth = false,
}: EquipmentChapterViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = chapter.pdfUrl ?? device.manualPdfUrl;
  const pdfName =
    chapter.pdfFileName ??
    `${device.name.replace(/\s+/g, '-')}-Capitol-${chapter.number}.pdf`;

  const handleDownload = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadEquipmentPdf(pdfUrl, pdfName);
    } catch {
      setError('Descărcarea PDF a eșuat. Verificați conexiunea sau încercați din nou.');
    } finally {
      setDownloading(false);
    }
  };

  const pdfButton = showPdfButton && pdfUrl && (
    <div className="pt-1">
      <Button
        type="button"
        variant="primary"
        fullWidth={pdfButtonFullWidth}
        disabled={downloading}
        onClick={() => void handleDownload()}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
      >
        {downloading ? 'Se descarcă…' : 'Descarcă Manual (PDF)'}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );

  if (chapter.pages && chapter.pages.length > 0) {
    return (
      <div className="space-y-3">
        {chapter.pages.map((page) => (
          <EquipmentManualPage
            key={page.id}
            imageUrl={page.imageUrl}
            alt={`Capitol ${chapter.number} — ${chapter.title}`}
            videoUrl={page.videoUrl}
            hotspot={page.hotspot}
          />
        ))}
        {pdfButton}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chapter.blocks && chapter.blocks.length > 0 ? (
        <EquipmentChapterBlocks blocks={chapter.blocks} />
      ) : (
        <>
          <EquipmentChapterMedia
            videoUrl={chapter.videoUrl}
            images={chapter.images}
            title={chapter.title}
          />
          {chapter.content.trim() && (
            <div className="rounded-lg bg-corporate-surface/30 px-3 py-3 @lg:px-4 @lg:py-4">
              <SimpleMarkdown source={chapter.content} />
            </div>
          )}
          {chapter.steps.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-corporate-muted">
                Pași
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-corporate-dark">
                {chapter.steps.map((step, i) => (
                  <li key={i} className="leading-relaxed pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
      {pdfButton}
    </div>
  );
}
