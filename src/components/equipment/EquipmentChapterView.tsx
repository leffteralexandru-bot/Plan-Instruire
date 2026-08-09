import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentChapterBlocks } from '@/components/equipment/EquipmentChapterBlocks';
import { EquipmentChapterMedia } from '@/components/equipment/EquipmentChapterMedia';
import { EquipmentManualPage } from '@/components/equipment/EquipmentManualPage';
import {
  IconClose,
  IconDownload,
  IconOpenEye,
  IconShare,
  PDF_ICON_BTN,
} from '@/components/operational/PdfActionIcons';
import type { EquipmentChapter, EquipmentDevice, EquipmentManualPageActionHotspot } from '@/data/equipmentOperations';
import { downloadEquipmentPdf, shareEquipmentPdf } from '@/lib/downloadEquipmentPdf';
import { shouldPrioritizeManualPage } from '@/lib/manualPageLoad';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';
import { PdfDocumentViewer } from '@/components/operational/PdfDocumentViewer';

export type GuideActionHotspotContext = {
  chapterId: string;
  pageId?: string;
};

interface EquipmentChapterViewProps {
  device: EquipmentDevice;
  chapter: EquipmentChapter;
  showPdfButton?: boolean;
  pdfButtonFullWidth?: boolean;
  onActionHotspot?: (
    spot: EquipmentManualPageActionHotspot,
    ctx?: GuideActionHotspotContext,
  ) => void;
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
  const [previewOpen, setPreviewOpen] = useState(
    () => !!chapter.pdfUrl && !(chapter.pages && chapter.pages.length > 0),
  );
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const scrollToolbarIntoView = () => {
    const el = toolbarRef.current;
    if (!el) return;
    const headerOffset = 120;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  useEffect(() => {
    // La schimbarea capitolului: PDF-only → deschide previzualizarea automat
    setPreviewOpen(!!chapter.pdfUrl && !(chapter.pages && chapter.pages.length > 0));
    setError(null);
    setShareHint(null);
  }, [chapter.id, chapter.pdfUrl, chapter.pages]);

  useEffect(() => {
    if (!previewOpen) return;
    const t1 = window.setTimeout(scrollToolbarIntoView, 50);
    const t2 = window.setTimeout(scrollToolbarIntoView, 350);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [previewOpen]);

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

  const iconBtn = PDF_ICON_BTN;

  const pdfButton = showPdfButton && chapter.pdfUrl && (
    <div className="space-y-2 pt-1">
      <div
        ref={toolbarRef}
        className={`${pdfButtonFullWidth ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-2'} scroll-mt-28 @md:scroll-mt-32`}
      >
        <Button
          type="button"
          variant="ghost"
          className={iconBtn}
          disabled={downloading || sharing}
          aria-label={previewOpen ? 'Închide documentul' : 'Deschide documentul'}
          title={previewOpen ? 'Închide' : 'Deschide'}
          onClick={() => setPreviewOpen((v) => !v)}
          icon={previewOpen ? <IconClose /> : <IconOpenEye />}
        />
        <Button
          type="button"
          variant="primary"
          className={iconBtn}
          disabled={downloading || sharing}
          aria-label={
            downloading
              ? 'Se descarcă'
              : pdfName.toLowerCase().endsWith('.zip')
                ? 'Descarcă pachet ZIP'
                : 'Descarcă PDF'
          }
          title="Descarcă"
          onClick={() => void handleDownload()}
          icon={<IconDownload />}
        />
        <Button
          type="button"
          variant="secondary"
          className={iconBtn}
          disabled={downloading || sharing}
          aria-label={sharing ? 'Se trimite' : 'Trimite'}
          title="Trimite"
          onClick={() => void handleShare()}
          icon={<IconShare />}
        />
      </div>
      {previewOpen && pdfUrl ? (
        <div className="overflow-hidden rounded-xl border border-corporate-gold/35 bg-corporate-surface/30 p-2 sm:p-3">
          <PdfDocumentViewer
            pdfUrl={pdfUrl}
            title={chapter.title}
            onLoad={scrollToolbarIntoView}
          />
        </div>
      ) : null}
      {shareHint && <p className="text-xs text-corporate-muted">{shareHint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );

  if (chapter.pages && chapter.pages.length > 0) {
    const pageQuery =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('page')
        : null;
    return (
      <div className="space-y-3">
        {chapter.pages.map((page, index) => (
          <EquipmentManualPage
            key={page.id}
            pageId={page.id}
            priority={shouldPrioritizeManualPage(page.id, index, pageQuery)}
            imageUrl={page.imageUrl}
            alt={`Capitol ${chapter.number} — ${chapter.title}`}
            videoUrl={page.videoUrl}
            hotspot={page.hotspot}
            videoHotspots={page.videoHotspots}
            actionHotspots={page.actionHotspots}
            onActionHotspot={
              onActionHotspot
                ? (spot) => onActionHotspot(spot, { chapterId: chapter.id, pageId: page.id })
                : undefined
            }
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
