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

function PlayIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7L16.5 12 10 8.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function VideoModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const embed = youtubeEmbedUrl(url);
  const direct = isDirectVideo(url) || url.startsWith('/') || url.startsWith('http');

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
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-gold">Video</p>
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
          {embed ? (
            <div className={`relative ${VIDEO_EMBED}`}>
              <iframe
                src={embed}
                title={title}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : direct ? (
            <video controls autoPlay className={`${VIDEO_EMBED} max-h-[min(70vh,520px)] w-full object-contain`} src={url}>
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
      </div>
    </div>
  );
}

interface OperationalGuideVideoProps {
  url?: string;
  title?: string;
}

/** Compact: doar buton de deschidere; playerul rulează în modal. */
export function OperationalGuideVideo({ url }: OperationalGuideVideoProps) {
  const [open, setOpen] = useState(false);
  const trimmed = url?.trim();

  if (!trimmed) {
    return null;
  }

  return (
    <>
      <section
        className="overflow-hidden rounded-xl border border-corporate-border/90 bg-white shadow-sm"
        aria-label="Demonstrație video"
      >
        <div className="px-3 py-2.5 sm:px-3.5 space-y-2">
          <p className="text-xs font-semibold text-corporate-dark">Demonstrație video</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-corporate-border/80 bg-white text-corporate-dark shadow-sm transition-colors hover:border-corporate-gold/50 hover:bg-corporate-gold-light/40 hover:text-corporate-black focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-1"
              onClick={() => setOpen(true)}
              title="Deschide video"
              aria-label="Deschide demonstrație video"
            >
              <PlayIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {open && <VideoModal url={trimmed} title="Demonstrație video" onClose={() => setOpen(false)} />}
    </>
  );
}
