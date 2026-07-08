import { OperationalGuideVideo } from '@/components/operational/OperationalGuideVideo';

interface EquipmentChapterMediaProps {
  videoUrl?: string;
  images: { id: string; url: string; alt?: string }[];
  title?: string;
}

/** Imagini și video cu object-contain pe toate ecranele. */
export function EquipmentChapterMedia({ videoUrl, images, title }: EquipmentChapterMediaProps) {
  const hasVideo = !!videoUrl?.trim();
  const hasImages = images.length > 0;

  if (!hasVideo && !hasImages) return null;

  return (
    <div className="space-y-4">
      {hasVideo && <OperationalGuideVideo url={videoUrl} title={title} />}

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
    </div>
  );
}
