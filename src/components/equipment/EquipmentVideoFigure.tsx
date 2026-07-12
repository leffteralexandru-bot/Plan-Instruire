import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { OperationalGuideVideo } from '@/components/operational/OperationalGuideVideo';
import { hasEquipmentVideo } from '@/lib/equipmentVideoUrl';

interface EquipmentVideoFigureProps {
  imageUrl: string;
  alt: string;
  caption?: string;
  videoUrl?: string;
  videoLabel?: string;
}

/** Ilustrație din manual — apăsați pe desen pentru videoclip (stil Prodim). */
export function EquipmentVideoFigure({
  imageUrl,
  alt,
  caption,
  videoUrl,
  videoLabel = 'Urmăriți videoclipul',
}: EquipmentVideoFigureProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const clickable = videoUrl ? hasEquipmentVideo(videoUrl) : false;

  return (
    <figure className="overflow-hidden rounded-xl border border-corporate-border bg-white shadow-sm">
      <button
        type="button"
        className={[
          'group relative block w-full text-left',
          clickable ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold' : 'cursor-default',
        ].join(' ')}
        onClick={() => clickable && setVideoOpen(true)}
        disabled={!clickable}
        aria-label={clickable ? `${videoLabel}: ${alt}` : alt}
      >
        <div className="flex min-h-[200px] max-h-[min(70vh,520px)] items-center justify-center bg-corporate-surface/20 p-2 @lg:p-3">
          <img
            src={imageUrl}
            alt={alt}
            className="max-h-[min(68vh,500px)] w-full object-contain"
            loading="lazy"
          />
        </div>
        {clickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-corporate-black/0 transition-colors group-hover:bg-corporate-black/25">
            <span className="flex items-center gap-2 rounded-full bg-corporate-black/75 px-4 py-2 text-xs font-semibold text-white opacity-90 shadow-lg transition-transform group-hover:scale-105 @lg:text-sm">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              {videoLabel}
            </span>
          </div>
        )}
      </button>
      {(caption || clickable) && (
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-corporate-border/80 bg-corporate-surface/40 px-3 py-2.5">
          {caption && <span className="text-xs text-corporate-muted @lg:text-sm">{caption}</span>}
          {clickable && (
            <Badge variant="info" className="shrink-0">
              Video
            </Badge>
          )}
        </figcaption>
      )}

      {videoOpen && videoUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={videoLabel}
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
    </figure>
  );
}
