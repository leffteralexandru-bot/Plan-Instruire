import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VIDEO_EMBED } from '@/lib/responsiveLayout';

function youtubeEmbedUrl(url: string): string | null {
  try {
    if (url.includes('youtube.com/watch') || url.includes('youtube.com/live')) {
      const id = new URL(url).searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('youtube.com/embed/')) return url;
  } catch {
    return null;
  }
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.startsWith('blob:') || url.startsWith('data:video/');
}

/** Player video imediat — fără etapă „Demonstrație video” + al doilea Play. */
export function OperationalGuideVideoModal({
  url,
  title,
  onClose,
  hint,
}: {
  url: string;
  title: string;
  onClose: () => void;
  hint?: string;
}) {
  const embed = youtubeEmbedUrl(url);
  const direct = isDirectVideo(url) || url.startsWith('/') || url.startsWith('http');
  const embedSrc = embed
    ? `${embed}${embed.includes('?') ? '&' : '?'}autoplay=1&rel=0`
    : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-corporate-black/70 backdrop-blur-[2px]"
        aria-label="Închide video"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-corporate-border bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-corporate-border bg-corporate-black px-3 py-2.5 sm:px-4">
          <p className="min-w-0 truncate text-sm font-semibold text-white">{title}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-white/85 hover:!text-white hover:!bg-white/10 shrink-0"
            onClick={onClose}
          >
            Închide
          </Button>
        </div>
        <div className="bg-black">
          {embedSrc ? (
            <div className={`relative ${VIDEO_EMBED}`}>
              <iframe
                src={embedSrc}
                title={title}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : direct ? (
            <video
              controls
              autoPlay
              playsInline
              className={`${VIDEO_EMBED} max-h-[min(70vh,520px)] w-full object-contain`}
              src={url}
            >
              Browserul nu suportă redarea video.
            </video>
          ) : (
            <div className="px-4 py-6 text-center">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-corporate-gold font-medium hover:underline break-all"
              >
                Deschide link-ul video
              </a>
            </div>
          )}
        </div>
        {hint ? (
          <p className="border-t border-corporate-border px-4 py-2 text-[11px] text-corporate-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

interface OperationalGuideVideoProps {
  url?: string;
  title?: string;
}

/**
 * Un singur click pe Play → playerul (fără card „Demonstrație video”).
 * @deprecated Preferă OperationalGuideVideoModal din fluxurile utilaje.
 */
export function OperationalGuideVideo({ url, title = 'Video' }: OperationalGuideVideoProps) {
  const [open, setOpen] = useState(false);
  const trimmed = url?.trim();

  if (!trimmed) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-corporate-border bg-white px-3 py-2 text-sm font-medium text-corporate-dark shadow-sm transition-colors hover:border-corporate-gold/50 hover:bg-corporate-gold-light/30"
        onClick={() => setOpen(true)}
        title="Redare video"
        aria-label="Redare video"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
        Redare video
      </button>

      {open && (
        <OperationalGuideVideoModal url={trimmed} title={title} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
