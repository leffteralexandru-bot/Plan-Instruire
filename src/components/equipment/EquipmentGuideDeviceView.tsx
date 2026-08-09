import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { TechnicalCard } from '@/components/equipment/TechnicalCard';
import { EquipmentChapterView } from '@/components/equipment/EquipmentChapterView';
import { EquipmentSafetyWarningCard } from '@/components/equipment/EquipmentSafetyWarning';
import type { EquipmentChapter, EquipmentDevice } from '@/data/equipmentOperations';
import { useEquipmentLayoutMode } from '@/hooks/useEquipmentLayoutMode';
import { downloadEquipmentPdf, shareEquipmentPdf } from '@/lib/downloadEquipmentPdf';
import {
  EQUIPMENT_CHAPTER_GRID,
  EQUIPMENT_PHONE_BOTTOM_PAD,
  EQUIPMENT_REACHABILITY_BAR,
  EQUIPMENT_SIDEBAR_LAYOUT,
} from '@/lib/equipmentLayout';

interface EquipmentGuideDeviceViewProps {
  device: EquipmentDevice;
  manualNumber?: number;
  onBack: () => void;
  /** Capitol de deschis la start (ex. tip măsurare Blat → ch-4) */
  initialChapterId?: string | null;
  /** Acțiune pe hotspot din pagină (ex. Deschide manual Proliner din lista echipament). */
  onActionHotspot?: (
    spot: import('@/data/equipmentOperations').EquipmentManualPageActionHotspot,
    ctx?: { chapterId: string; pageId?: string },
  ) => void;
  /** Cum se afișează avertismentul de siguranță */
  safetyPlacement?: 'modal' | 'inline';
}

function PhoneReachabilityBar({
  onNavigate,
  onDownloadPdf,
  onSharePdf,
  downloading,
  sharing,
  canDownload,
}: {
  onNavigate: () => void;
  onDownloadPdf: () => void;
  onSharePdf: () => void;
  downloading: boolean;
  sharing: boolean;
  canDownload: boolean;
}) {
  return (
    <div className={EQUIPMENT_REACHABILITY_BAR}>
      <Button type="button" variant="ghost" fullWidth onClick={onNavigate}>
        ← Navigare
      </Button>
      {canDownload && (
        <>
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={downloading || sharing}
            onClick={onDownloadPdf}
          >
            {downloading ? '…' : 'Descarcă PDF'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={downloading || sharing}
            onClick={onSharePdf}
          >
            {sharing ? '…' : 'Trimite'}
          </Button>
        </>
      )}
    </div>
  );
}

export function EquipmentGuideDeviceView({
  device,
  manualNumber,
  onBack,
  initialChapterId = null,
  onActionHotspot,
  safetyPlacement = 'modal',
}: EquipmentGuideDeviceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutMode = useEquipmentLayoutMode(containerRef);
  const chapters = device.chapters ?? [];
  const [activeChapterId, setActiveChapterId] = useState<string | null>(initialChapterId);
  const [phoneExpandedId, setPhoneExpandedId] = useState<string | null>(initialChapterId);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [safetyReady, setSafetyReady] = useState(!device.safetyWarning);

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;
  const isPhone = layoutMode === 'phone';
  const isSidebar = layoutMode === 'laptop' || layoutMode === 'desktop';

  useEffect(() => {
    if (!initialChapterId) return;
    if (!chapters.some((c) => c.id === initialChapterId)) return;
    setActiveChapterId(initialChapterId);
    setPhoneExpandedId(initialChapterId);
  }, [initialChapterId, chapters]);

  useEffect(() => {
    if (isSidebar && !activeChapterId && chapters[0]) {
      setActiveChapterId(chapters[0].id);
    }
  }, [isSidebar, activeChapterId, chapters]);

  const manualChapter = chapters.find((c) => c.pdfUrl) ?? null;
  const pdfUrl = manualChapter?.pdfUrl;
  const pdfName =
    manualChapter?.pdfFileName ??
    `${device.name.replace(/\s+/g, '-')}-Manual.pdf`;

  const handlePhoneChapterClick = (chapter: EquipmentChapter) => {
    if (phoneExpandedId === chapter.id) {
      setPhoneExpandedId(null);
      setActiveChapterId(null);
    } else {
      setPhoneExpandedId(chapter.id);
      setActiveChapterId(chapter.id);
    }
  };

  const handleSidebarSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleDownloadActivePdf = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      await downloadEquipmentPdf(pdfUrl, pdfName);
    } catch {
      /* silent on reachability bar */
    } finally {
      setDownloading(false);
    }
  };

  const handleShareActivePdf = async () => {
    if (!pdfUrl) return;
    setSharing(true);
    try {
      await shareEquipmentPdf(pdfUrl, pdfName, {
        title: device.name,
        text: `Manual ghid teren — ${device.name}`,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
    } finally {
      setSharing(false);
    }
  };

  const chapterNav = (
    <nav aria-label="Capitole ghid" className={isSidebar ? 'space-y-1' : EQUIPMENT_CHAPTER_GRID}>
      {chapters.map((chapter) => {
        const isActive = activeChapterId === chapter.id;
        const isExpanded = isPhone && phoneExpandedId === chapter.id;

        if (isPhone) {
          return (
            <div key={chapter.id} className="col-span-1">
              <TechnicalCard
                title={chapter.title}
                subtitle={chapter.summary}
                chapterNumber={chapter.number}
                active={isExpanded}
                expanded={isExpanded}
                onClick={() => handlePhoneChapterClick(chapter)}
              />
              {isExpanded && (
                <div className="mt-2">
                  <EquipmentChapterView
                    device={device}
                    chapter={chapter}
                    showPdfButton={!!chapter.pdfUrl}
                    pdfButtonFullWidth
                    onActionHotspot={onActionHotspot}
                  />
                </div>
              )}
            </div>
          );
        }

        return (
          <TechnicalCard
            key={chapter.id}
            title={chapter.title}
            subtitle={chapter.summary}
            chapterNumber={chapter.number}
            active={isActive}
            onClick={() => handleSidebarSelect(chapter.id)}
          />
        );
      })}
    </nav>
  );

  return (
    <div ref={containerRef} className={['@container equipment-guide', EQUIPMENT_PHONE_BOTTOM_PAD].join(' ')}>
      {device.safetyWarning && !safetyReady ? (
        <EquipmentSafetyWarningCard
          warning={device.safetyWarning}
          placement={safetyPlacement}
          onAcknowledged={() => setSafetyReady(true)}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border/80 pb-3">
        <div className="min-w-0 flex items-start gap-3">
          {manualNumber != null && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums bg-corporate-black text-white"
              aria-hidden
            >
              {manualNumber}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-corporate-muted">Manual</p>
            <p className="text-sm font-semibold text-corporate-dark @lg:text-base">{device.name}</p>
            {device.description && (
              <p className="mt-0.5 text-xs text-corporate-muted @lg:text-sm">{device.description}</p>
            )}
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="@min-[640px]:inline-flex">
          ← Înapoi
        </Button>
      </div>

      {!safetyReady ? (
        <p className="text-sm text-corporate-muted italic">Confirmați avertismentul de siguranță pentru a continua.</p>
      ) : isSidebar ? (
        <div className={EQUIPMENT_SIDEBAR_LAYOUT}>
          <aside className="min-w-0">{chapterNav}</aside>
          <main className="min-w-0">
            {activeChapter ? (
              <EquipmentChapterView
                device={device}
                chapter={activeChapter}
                showPdfButton={!!activeChapter.pdfUrl}
                onActionHotspot={onActionHotspot}
              />
            ) : (
              <p className="text-sm text-corporate-muted">Selectați un capitol din meniul din stânga.</p>
            )}
          </main>
        </div>
      ) : layoutMode === 'tablet' ? (
        <div className="space-y-4">
          {!activeChapter && chapterNav}
          {activeChapter && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveChapterId(null)}>
                ← Toate capitolele
              </Button>
              <EquipmentChapterView
                device={device}
                chapter={activeChapter}
                showPdfButton={!!activeChapter.pdfUrl}
                onActionHotspot={onActionHotspot}
              />
            </>
          )}
          {activeChapter === null && chapters.length > 0 && (
            <p className="text-xs text-corporate-muted">Atingeți un card pentru a deschide capitolul.</p>
          )}
        </div>
      ) : (
        <div>{chapterNav}</div>
      )}

      {isPhone && safetyReady && (
        <PhoneReachabilityBar
          onNavigate={() => {
            if (phoneExpandedId) {
              setPhoneExpandedId(null);
              setActiveChapterId(null);
            } else {
              onBack();
            }
          }}
          onDownloadPdf={() => void handleDownloadActivePdf()}
          onSharePdf={() => void handleShareActivePdf()}
          downloading={downloading}
          sharing={sharing}
          canDownload={!!activeChapter?.pdfUrl || !!pdfUrl}
        />
      )}
    </div>
  );
}
