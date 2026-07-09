import { useState } from 'react';
import { OperationalGuideVideo } from '@/components/operational/OperationalGuideVideo';
import type { EquipmentManualPageHotspot } from '@/data/equipmentOperations';

interface EquipmentManualPageProps {
  imageUrl: string;
  alt: string;
  videoUrl?: string;
  hotspot?: EquipmentManualPageHotspot;
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const clean = url.trim();
    if (clean.includes('youtube.com/watch')) {
      const id = new URL(clean).searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (clean.includes('youtu.be/')) {
      const id = clean.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (clean.includes('youtube.com/embed/')) return clean.trim();
  } catch {
    return null;
  }
  return null;
}

/** Pagină manual — imagine clară; video doar la apăsarea zonei play din desen. */
export function EquipmentManualPage({ imageUrl, alt, videoUrl, hotspot }: EquipmentManualPageProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const embed = videoUrl ? youtubeEmbedUrl(videoUrl) : null;

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
          {embed && hotspot && (
            <button
              type="button"
              className="absolute cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold/80"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.w}%`,
                height: `${hotspot.h}%`,
              }}
              onClick={() => setVideoOpen(true)}
              aria-label={`Redare video: ${alt}`}
            />
          )}
        </div>
      </figure>

      {videoOpen && embed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 @min-[640px]:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Videoclip capitol"
          onClick={() => setVideoOpen(false)}
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
                onClick={() => setVideoOpen(false)}
              >
                Închide
              </button>
            </div>
            <OperationalGuideVideo url={videoUrl} title={alt} />
            <p className="border-t border-corporate-border px-4 py-2 text-[11px] text-corporate-muted">
              Activați subtitrările pe YouTube pentru instrucțiuni în română sau altă limbă.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
