import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { TechnicalCatalogItem } from '@/data/technicalRepository';

interface TechnicalRepositoryCatalogSectionProps {
  intro?: string;
  items: TechnicalCatalogItem[];
  emptyLabel: string;
}

export function TechnicalRepositoryCatalogSection({
  intro,
  items,
  emptyLabel,
}: TechnicalRepositoryCatalogSectionProps) {
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ['Toate', ...Array.from(set)];
  }, [items]);

  const [filter, setFilter] = useState('Toate');

  const filtered =
    filter === 'Toate' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-4">
      {intro && <p className="text-sm text-corporate-muted leading-relaxed">{intro}</p>}

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={[
                'rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors',
                filter === cat
                  ? 'bg-corporate-black text-white border-corporate-black'
                  : 'bg-white text-corporate-muted border-corporate-border hover:border-corporate-gold/40',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card padding="sm" className="border-dashed bg-corporate-surface/40">
          <p className="text-sm text-corporate-muted">{emptyLabel}</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-corporate-border bg-white px-4 py-3 hover:border-corporate-gold/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-corporate-dark">{item.title}</p>
                    <Badge variant="default">{item.category}</Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-corporate-muted mt-1 leading-relaxed">{item.description}</p>
                  )}
                </div>
                {item.documentUrl && (
                  <a
                    href={item.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-corporate-gold hover:underline"
                  >
                    Fișă tehnică →
                  </a>
                )}
              </div>
              {Object.keys(item.specs).length > 0 && (
                <dl className="mt-2.5 grid gap-1.5 sm:grid-cols-2 text-xs border-t border-corporate-border/60 pt-2.5">
                  {Object.entries(item.specs).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-corporate-muted capitalize shrink-0">{k}:</dt>
                      <dd className="text-corporate-dark font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
