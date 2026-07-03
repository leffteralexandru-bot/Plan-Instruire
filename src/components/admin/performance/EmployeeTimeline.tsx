import { useMemo, useState } from 'react';
import type { TimelineEvent, TimelineEventType } from '@/types';

const TYPE_LABELS: Record<TimelineEventType, string> = {
  evaluare: 'Evaluare',
  nota: 'Notă',
  eroare: 'Eroare',
  document: 'Document',
  instruire: 'Instruire',
  re_instruire: 'Re-instruire',
  alerta_eroare: 'Alertă eroare',
  audit: 'Activitate',
};

const FILTER_OPTIONS: { id: TimelineEventType | 'all'; label: string }[] = [
  { id: 'all', label: 'Toate' },
  { id: 'instruire', label: 'Instruire' },
  { id: 'evaluare', label: 'Evaluări' },
  { id: 'eroare', label: 'Erori' },
  { id: 're_instruire', label: 'Re-instruire' },
  { id: 'document', label: 'Documente' },
  { id: 'nota', label: 'Note' },
  { id: 'audit', label: 'Activitate' },
];

const SEVERITY_DOT: Record<NonNullable<TimelineEvent['severity']>, string> = {
  info: 'bg-slate-400',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  success: 'bg-emerald-500',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

interface EmployeeTimelineProps {
  events: TimelineEvent[];
  showFilters?: boolean;
  maxItems?: number;
}

export function EmployeeTimeline({ events, showFilters = true, maxItems }: EmployeeTimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');

  const filtered = useMemo(() => {
    const list = filter === 'all' ? events : events.filter((e) => e.type === filter);
    return maxItems ? list.slice(0, maxItems) : list;
  }, [events, filter, maxItems]);

  const counts = useMemo(() => {
    const map = new Map<TimelineEventType, number>();
    for (const e of events) {
      map.set(e.type, (map.get(e.type) ?? 0) + 1);
    }
    return map;
  }, [events]);

  if (!events.length) {
    return (
      <p className="text-sm text-corporate-muted py-6 text-center">
        Niciun eveniment înregistrat încă.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.filter(
            (opt) => opt.id === 'all' || (counts.get(opt.id as TimelineEventType) ?? 0) > 0,
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={[
                'rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                filter === opt.id
                  ? 'bg-corporate-black text-white border-corporate-black'
                  : 'bg-white text-corporate-muted border-corporate-border hover:border-corporate-gold',
              ].join(' ')}
            >
              {opt.label}
              {opt.id !== 'all' && (
                <span className="ml-1 opacity-70">({counts.get(opt.id as TimelineEventType) ?? 0})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {!filtered.length ? (
        <p className="text-sm text-corporate-muted py-4 text-center">Niciun eveniment în această categorie.</p>
      ) : (
        <ol className="relative border-l border-corporate-border ml-3 space-y-4 pl-6">
          {filtered.map((ev) => (
            <li key={ev.id} className="relative">
              <span
                className={[
                  'absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white',
                  SEVERITY_DOT[ev.severity ?? 'info'],
                ].join(' ')}
                aria-hidden
              />
              <div className="rounded-lg border border-corporate-border bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-corporate-gold">
                    {TYPE_LABELS[ev.type]}
                  </span>
                  <span className="text-[10px] text-corporate-muted">{formatDate(ev.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-corporate-dark">{ev.title}</p>
                {ev.subtitle && (
                  <p className="text-xs text-corporate-muted mt-1 line-clamp-3">{ev.subtitle}</p>
                )}
                {ev.meta?.actor && (
                  <p className="text-[10px] text-corporate-muted mt-1">{ev.meta.actor}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {maxItems && events.length > maxItems && filter === 'all' && (
        <p className="text-xs text-corporate-muted text-center">
          Afișate {maxItems} din {events.length} evenimente — deschideți dosarul complet pentru istoric integral.
        </p>
      )}
    </div>
  );
}
