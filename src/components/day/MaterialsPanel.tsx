import type { Material } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useMaterialUrl } from '@/hooks/useMaterialUrl';

const typeIcons: Record<Material['type'], string> = {
  pdf: '📄',
  video: '🎬',
  doc: '📝',
  link: '🔗',
};

const typeLabels: Record<Material['type'], string> = {
  pdf: 'PDF',
  video: 'Video',
  doc: 'Document',
  link: 'Link',
};

function MaterialRow({ mat }: { mat: Material }) {
  const { url, loading } = useMaterialUrl(mat);
  const isVideo = mat.type === 'video' && url && !loading;

  if (loading) {
    return (
      <li className="rounded-xl border border-slate-100 p-4 text-sm text-corporate-muted">
        Se încarcă {mat.title}…
      </li>
    );
  }

  if (!url) {
    return (
      <li className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        {mat.title} — fișier indisponibil
      </li>
    );
  }

  if (isVideo) {
    return (
      <li className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>{typeIcons.video}</span>
            <p className="text-sm font-medium text-corporate-dark">{mat.title}</p>
            <Badge variant="info">{typeLabels.video}</Badge>
          </div>
          {mat.description && (
            <p className="text-xs text-corporate-muted mt-1">{mat.description}</p>
          )}
        </div>
        <video controls className="w-full max-h-80 bg-black" src={url} preload="metadata">
          Browserul nu suportă redarea video.
        </video>
      </li>
    );
  }

  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 hover:border-corporate-gold/30 hover:bg-corporate-gold-light/30 transition-colors group"
      >
        <span className="text-2xl" aria-hidden>
          {typeIcons[mat.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-corporate-dark group-hover:text-corporate-gold truncate">
              {mat.title}
            </p>
            <Badge variant="info">{typeLabels[mat.type]}</Badge>
            {mat.documentId && (
              <Badge variant="default">HR</Badge>
            )}
          </div>
          {mat.description && (
            <p className="text-xs text-corporate-muted mt-0.5 truncate">{mat.description}</p>
          )}
        </div>
        <span className="text-slate-400 group-hover:text-corporate-gold shrink-0">↓</span>
      </a>
    </li>
  );
}

interface MaterialsPanelProps {
  materials: Material[];
}

export function MaterialsPanel({ materials }: MaterialsPanelProps) {
  if (materials.length === 0) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-4">Materiale Suport</h2>
      <ul className="space-y-2">
        {materials.map((mat) => (
          <MaterialRow key={mat.id} mat={mat} />
        ))}
      </ul>
    </Card>
  );
}
