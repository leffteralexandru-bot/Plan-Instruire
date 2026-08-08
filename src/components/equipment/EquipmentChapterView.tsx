import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentChapterBlocks } from '@/components/equipment/EquipmentChapterBlocks';
import { EquipmentChapterMedia } from '@/components/equipment/EquipmentChapterMedia';
import { EquipmentManualPage } from '@/components/equipment/EquipmentManualPage';
import type { EquipmentChapter, EquipmentDevice, EquipmentManualPageActionHotspot } from '@/data/equipmentOperations';
import { downloadEquipmentPdf, shareEquipmentPdf } from '@/lib/downloadEquipmentPdf';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';

interface EquipmentChapterViewProps {
  device: EquipmentDevice;
  chapter: EquipmentChapter;
  showPdfButton?: boolean;
  pdfButtonFullWidth?: boolean;
  onActionHotspot?: (spot: EquipmentManualPageActionHotspot) => void;
}

export function EquipmentChapterView({
  device,
  chapter,
  showPdfButton = true,
  pdfButtonFullWidth = false,
  onActionHotspot,
}: EquipmentChapterViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const pdfUrl = chapter.pdfUrl;
  const pdfName =
    chapter.pdfFileName ??
    `${device.name.replace(/\s+/g, '-')}-Manual.pdf`;

  const handleDownload = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    setError(null);
    setShareHint(null);
    try {
      await downloadEquipmentPdf(pdfUrl, pdfName);
    } catch {
      setError('Descărcarea PDF a eșuat. Verificați conexiunea sau încercați din nou.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!pdfUrl) return;
    setSharing(true);
    setError(null);
    setShareHint(null);
    try {
      const result = await shareEquipmentPdf(pdfUrl, pdfName, {
        title: device.name,
        text: `Manual ghid teren — ${device.name}`,
      });
      if (result === 'mailto') {
        setShareHint('S-a deschis emailul cu linkul manualului.');
      } else if (result === 'copied') {
        setShareHint('Linkul manualului a fost copiat — poți să-l trimiți oricui.');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError('Trimiterea a eșuat. Încercați din nou sau folosiți Descarcă.');
    } finally {
      setSharing(false);
    }
  };

  const pdfButton = showPdfButton && chapter.pdfUrl && (
    <div className="space-y-2 pt-1">
      <div className={pdfButtonFullWidth ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
        <Button
          type="button"
          variant="primary"
          fullWidth={pdfButtonFullWidth}
          disabled={downloading || sharing}
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
          {downloading
            ? 'Se descarcă…'
            : pdfName.toLowerCase().endsWith('.zip')
              ? 'Descarcă pachet (ZIP)'
              : 'Descarcă Manual (PDF)'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth={pdfButtonFullWidth}
          disabled={downloading || sharing}
          onClick={() => void handleShare()}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          }
        >
          {sharing ? 'Se trimite…' : 'Trimite cuiva'}
        </Button>
      </div>
      {shareHint && <p className="text-xs text-corporate-muted">{shareHint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
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
            videoHotspots={page.videoHotspots}
            actionHotspots={page.actionHotspots}
            onActionHotspot={onActionHotspot}
            compactPlayHotspots={device.id !== 'eq-proliner'}
            filmIconShift={
              device.id === 'eq-factory-fabricator' ? 'fabricator' : 'none'
            }
            playButtonSize={device.id === 'eq-prodim-ct' ? 'small' : 'default'}
          />
        ))}
      </div>
    );
  }

  if (chapter.pdfUrl) {
    return <div className="space-y-3">{pdfButton}</div>;
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
    </div>
  );
}
