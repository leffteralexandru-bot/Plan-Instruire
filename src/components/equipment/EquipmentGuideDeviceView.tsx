import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { TechnicalCard } from '@/components/equipment/TechnicalCard';
import { EquipmentChapterView } from '@/components/equipment/EquipmentChapterView';
import { EquipmentSafetyWarningCard } from '@/components/equipment/EquipmentSafetyWarning';
import type { EquipmentChapter, EquipmentDevice } from '@/data/equipmentOperations';
import { useEquipmentLayoutMode } from '@/hooks/useEquipmentLayoutMode';
import { downloadEquipmentPdf } from '@/lib/downloadEquipmentPdf';
import {
  EQUIPMENT_CHAPTER_GRID,
  EQUIPMENT_PHONE_BOTTOM_PAD,
  EQUIPMENT_REACHABILITY_BAR,
  EQUIPMENT_SIDEBAR_LAYOUT,
} from '@/lib/equipmentLayout';

interface EquipmentGuideDeviceViewProps {
  device: EquipmentDevice;
  onBack: () => void;
}

function PhoneReachabilityBar({
  onNavigate,
  onDownloadPdf,
  downloading,
  canDownload,
}: {
  onNavigate: () => void;
  onDownloadPdf: () => void;
  downloading: boolean;
  canDownload: boolean;
}) {
  return (
    <div className={EQUIPMENT_REACHABILITY_BAR}>
      <Button type="button" variant="ghost" fullWidth onClick={onNavigate}>
        ← Navigare
      </Button>
      {canDownload && (
        <Button
          type="button"
          variant="primary"
          fullWidth
          disabled={downloading}
          onClick={onDownloadPdf}
        >
          {downloading ? '…' : 'Descarcă PDF'}
        </Button>
      )}
    </div>
  );
}

export function EquipmentGuideDeviceView({ device, onBack }: EquipmentGuideDeviceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutMode = useEquipmentLayoutMode(containerRef);
  const chapters = device.chapters ?? [];
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [phoneExpandedId, setPhoneExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [safetyReady, setSafetyReady] = useState(!device.safetyWarning);

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;
  const isPhone = layoutMode === 'phone';
  const isSidebar = layoutMode === 'laptop' || layoutMode === 'desktop';

  useEffect(() => {
    if (isSidebar && !activeChapterId && chapters[0]) {
      setActiveChapterId(chapters[0].id);
    }
  }, [isSidebar, activeChapterId, chapters]);

  const pdfUrl =
    activeChapter?.pdfUrl ?? device.manualPdfUrl ?? chapters[0]?.pdfUrl;
  const pdfName =
    activeChapter?.pdfFileName ??
    `${device.name.replace(/\s+/g, '-')}-manual.pdf`;

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
                    showPdfButton={false}
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
      {device.safetyWarning && (
        <EquipmentSafetyWarningCard
          warning={device.safetyWarning}
          onAcknowledged={() => setSafetyReady(true)}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border/80 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-corporate-muted">Aparat</p>
          <p className="text-sm font-semibold text-corporate-dark @lg:text-base">{device.name}</p>
          {device.description && (
            <p className="mt-0.5 text-xs text-corporate-muted @lg:text-sm">{device.description}</p>
          )}
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
              <EquipmentChapterView device={device} chapter={activeChapter} />
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
              <EquipmentChapterView device={device} chapter={activeChapter} />
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
          downloading={downloading}
          canDownload={!!pdfUrl && !!activeChapterId}
        />
      )}
    </div>
  );
}
