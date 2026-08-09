import { useState } from 'react';
import { OperationalGuideVideoModal } from '@/components/operational/OperationalGuideVideo';
import { hasEquipmentVideo, isYoutubeVideo } from '@/lib/equipmentVideoUrl';

interface EquipmentChapterMediaProps {
  videoUrl?: string;
  images: { id: string; url: string; alt?: string }[];
  title?: string;
}

/** Imagini + Play care deschide playerul direct (fără etapă intermediară). */
export function EquipmentChapterMedia({ videoUrl, images, title }: EquipmentChapterMediaProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const trimmed = videoUrl?.trim();
  const hasVideo = !!trimmed && hasEquipmentVideo(trimmed);
  const hasImages = images.length > 0;

  if (!hasVideo && !hasImages) return null;

  return (
    <div className="space-y-4">
      {hasVideo && trimmed ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-corporate-border bg-white px-3 py-2 text-sm font-medium text-corporate-dark shadow-sm transition-colors hover:border-corporate-gold/50 hover:bg-corporate-gold-light/30"
          onClick={() => setVideoOpen(true)}
          aria-label={`Redare video: ${title ?? 'Demonstrație'}`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          Redare video
        </button>
      ) : null}

      {hasImages && (
        <div className="grid gap-3 @min-[640px]:grid-cols-2">
          {images.map((img) => (
            <figure
              key={img.id}
              className="overflow-hidden rounded-xl border border-corporate-border bg-corporate-surface/30"
            >
              <div className="flex min-h-[160px] max-h-80 items-center justify-center bg-white p-2">
                <img
                  src={img.url}
                  alt={img.alt ?? title ?? 'Imagine echipament'}
                  className="max-h-72 w-full object-contain"
                  loading="lazy"
                />
              </div>
              {img.alt && (
                <figcaption className="border-t border-corporate-border/80 px-3 py-2 text-xs text-corporate-muted">
                  {img.alt}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {videoOpen && trimmed ? (
        <OperationalGuideVideoModal
          url={trimmed}
          title={title ?? 'Video'}
          onClose={() => setVideoOpen(false)}
          hint={
            isYoutubeVideo(trimmed)
              ? 'Activați subtitrările pe YouTube pentru instrucțiuni în română sau altă limbă.'
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
