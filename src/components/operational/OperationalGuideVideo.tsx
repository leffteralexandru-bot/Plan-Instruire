import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

interface OperationalGuideVideoProps {
  url?: string;
  title?: string;
}

export function OperationalGuideVideo({ url, title }: OperationalGuideVideoProps) {
  const trimmed = url?.trim();

  if (!trimmed) {
    return (
      <Card padding="sm" className="border-dashed border-corporate-border bg-corporate-surface/50">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="default">Video</Badge>
          <p className="text-sm font-medium text-corporate-dark">Demonstrație măsurare</p>
        </div>
        <p className="text-sm text-corporate-muted">
          Video neîncărcat încă. Resursele Umane pot adăuga link-ul din Setări → Ghid Operațional.
        </p>
      </Card>
    );
  }

  const embed = youtubeEmbedUrl(trimmed);

  if (embed) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="px-4 py-3 border-b border-corporate-border bg-corporate-surface/40 flex items-center gap-2">
          <Badge variant="info">Video</Badge>
          <p className="text-sm font-medium text-corporate-dark">{title ?? 'Demonstrație măsurare'}</p>
        </div>
        <div className={`relative bg-black ${VIDEO_EMBED}`}>
          <iframe
            src={embed}
            title={title ?? 'Video măsurare'}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Card>
    );
  }

  if (isDirectVideo(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('http')) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="px-4 py-3 border-b border-corporate-border bg-corporate-surface/40 flex items-center gap-2">
          <Badge variant="info">Video</Badge>
          <p className="text-sm font-medium text-corporate-dark">{title ?? 'Demonstrație măsurare'}</p>
        </div>
        <video controls className={`${VIDEO_EMBED} max-h-96 bg-black object-contain`} src={trimmed} preload="metadata">
          Browserul nu suportă redarea video.
        </video>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <p className="text-sm text-corporate-muted mb-2">Link video:</p>
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-corporate-gold font-medium hover:underline break-all"
      >
        {trimmed}
      </a>
    </Card>
  );
}
