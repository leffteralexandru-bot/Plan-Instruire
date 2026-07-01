import type { Material } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
          <li key={mat.id}>
            <a
              href={mat.url}
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
                </div>
                {mat.description && (
                  <p className="text-xs text-corporate-muted mt-0.5 truncate">{mat.description}</p>
                )}
              </div>
              <span className="text-slate-400 group-hover:text-corporate-gold shrink-0">↓</span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
