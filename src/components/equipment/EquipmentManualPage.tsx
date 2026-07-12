import { useState, type CSSProperties } from 'react';
import { OperationalGuideVideo } from '@/components/operational/OperationalGuideVideo';
import type {
  EquipmentManualPageHotspot,
  EquipmentManualPageVideoHotspot,
} from '@/data/equipmentOperations';
import { hasEquipmentVideo, isYoutubeVideo } from '@/lib/equipmentVideoUrl';

function isThumbnailHotspot(spot: EquipmentManualPageHotspot): boolean {
  return spot.w >= 20 && spot.h >= 8;
}

/** Înlocuiește iconița film albastră — un singur buton roșu peste icon. */
function FilmIconPlayReplacement() {
  return (
    <span className="pointer-events-none flex h-full w-full items-center justify-center rounded-[1px] bg-white">
      <span className="flex h-[88%] w-[88%] items-center justify-center rounded-[1px] bg-[#d82231] shadow-sm">
        <svg
          className="h-[56%] w-[56%] shrink-0 text-white"
          style={{ marginLeft: '8%' }}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

function thumbnailHitStyle(spot: EquipmentManualPageHotspot): CSSProperties {
  return {
    left: `${spot.x}%`,
    top: `${spot.y}%`,
    width: `${spot.w}%`,
    height: `${spot.h}%`,
    minWidth: '4.5rem',
    minHeight: '3rem',
  };
}

/** Poziție vizuală: PDF-ul marchează linkul puțin la stânga iconiței albastre din PNG. */
function fabricatorFilmIconStyle(spot: EquipmentManualPageHotspot): CSSProperties {
  const xShift = spot.x < 14 ? spot.w * 0.35 : spot.w * 0.42;
  const yShift = spot.h * 0.06;
  return {
    left: `${spot.x + xShift}%`,
    top: `${spot.y - yShift}%`,
    width: `${spot.w * 1.05}%`,
    height: `${spot.h * 1.12}%`,
  };
}

/** Zonă de apăsare minimă — vizualul rămâne mic, click-ul funcționează. */
function compactFilmIconHitStyle(
  spot: EquipmentManualPageHotspot,
  shift: 'fabricator' | 'none',
): CSSProperties {
  const base = shift === 'fabricator' ? fabricatorFilmIconStyle(spot) : {
    left: `${spot.x}%`,
    top: `${spot.y}%`,
    width: `${spot.w}%`,
    height: `${spot.h}%`,
  };
  return {
    ...base,
    minWidth: '1.35rem',
    minHeight: '1.35rem',
  };
}

/** Buton play mic roșu — pentru pagini fără miniatură video în desen. */
function ManualPlayIcon({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <FilmIconPlayReplacement />;
  }

  return (
    <span
      className="pointer-events-none flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[#d82231] shadow-md ring-1 ring-black/15"
      aria-hidden
    >
      <svg className="ml-0.5 h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

interface EquipmentManualPageProps {
  imageUrl: string;
  alt: string;
  videoUrl?: string;
  hotspot?: EquipmentManualPageHotspot;
  videoHotspots?: EquipmentManualPageVideoHotspot[];
  /** Înlocuiește iconița film — bbox din PDF; Fabricator are offset vizual suplimentar. */
  compactPlayHotspots?: boolean;
  filmIconShift?: 'fabricator' | 'none';
}

/** Pagină manual — imagine clară; video la apăsarea zonei play din desen. */
export function EquipmentManualPage({
  imageUrl,
  alt,
  videoUrl,
  hotspot,
  videoHotspots,
  compactPlayHotspots = false,
  filmIconShift = 'none',
}: EquipmentManualPageProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const spots: EquipmentManualPageVideoHotspot[] =
    videoHotspots && videoHotspots.length > 0
      ? videoHotspots
      : videoUrl && hotspot && hasEquipmentVideo(videoUrl)
        ? [{ ...hotspot, videoUrl }]
        : [];

  return (
    <>
      <figure className="overflow-hidden rounded-xl border border-corporate-border bg-white shadow-sm">
        <div className="relative w-full bg-white">
          <img
            src={imageUrl}
            alt={alt}
            className="mx-auto block h-auto w-full max-w-none object-contain @min-[640px]:max-h-[min(92vh,1200px)] @lg:max-h-[min(94vh,1400px)]"
            loading="lazy"
            decoding="async"
          />
          {spots.map((spot, index) => {
            const thumbnail = isThumbnailHotspot(spot);
            const compactIcon = compactPlayHotspots && !thumbnail;
            const compactPos = compactIcon ? compactFilmIconHitStyle(spot, filmIconShift) : null;
            const thumbPos = thumbnail ? thumbnailHitStyle(spot) : null;
            return (
              <button
                key={`${spot.videoUrl}-${spot.y}-${index}`}
                type="button"
                className={`absolute z-20 cursor-pointer border-0 bg-transparent p-0 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold/80 ${
                  thumbnail ? 'overflow-hidden' : compactIcon ? 'overflow-visible' : 'flex items-center justify-center'
                }`}
                style={
                  thumbPos ?? compactPos ?? {
                        left: `${spot.x}%`,
                        top: `${spot.y}%`,
                        width: thumbnail ? `${spot.w}%` : undefined,
                        height: thumbnail ? `${spot.h}%` : undefined,
                        minWidth: thumbnail ? undefined : '2rem',
                        minHeight: thumbnail ? undefined : '2rem',
                      }
                }
                onClick={() => setActiveVideo(spot.videoUrl)}
                aria-label={`Redare video ${index + 1}: ${alt}`}
              >
                {!thumbnail && <ManualPlayIcon compact={compactIcon} />}
              </button>
            );
          })}
        </div>
      </figure>

      {activeVideo && hasEquipmentVideo(activeVideo) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 @min-[640px]:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Videoclip capitol"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-corporate-border bg-white shadow-neural-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-corporate-border px-4 py-3">
              <p className="text-sm font-semibold text-corporate-dark">{alt}</p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-corporate-muted hover:bg-corporate-surface"
                onClick={() => setActiveVideo(null)}
              >
                Închide
              </button>
            </div>
            <OperationalGuideVideo url={activeVideo} title={alt} />
            {isYoutubeVideo(activeVideo) && (
              <p className="border-t border-corporate-border px-4 py-2 text-[11px] text-corporate-muted">
                Activați subtitrările pe YouTube pentru instrucțiuni în română sau altă limbă.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
