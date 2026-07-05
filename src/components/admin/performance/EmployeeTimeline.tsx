import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PROGRAM_AREA_THEMES } from '@/lib/programAreaTheme';
import type { TimelineEvent, TimelineEventType } from '@/types';

export const TIMELINE_PREVIEW_COUNT = 3;

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

const TIMELINE_TYPE_AREA: Partial<
  Record<TimelineEventType, keyof typeof PROGRAM_AREA_THEMES>
> = {
  instruire: 'training',
  re_instruire: 'retraining',
  evaluare: 'evaluation',
};

function filterChipClass(id: TimelineEventType | 'all', active: boolean): string {
  if (active) return 'bg-corporate-black text-white border-corporate-black';
  const area = id === 'all' ? undefined : TIMELINE_TYPE_AREA[id];
  if (!area) {
    return 'bg-white text-corporate-muted border-corporate-border hover:border-corporate-gold';
  }
  const theme = PROGRAM_AREA_THEMES[area];
  return `border ${theme.summaryCard} ${theme.summaryLabel} hover:opacity-90`;
}

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
  /** Câte evenimente se văd înainte de expand (implicit 3 când e setat) */
  maxItems?: number;
}

export function EmployeeTimeline({
  events,
  showFilters = true,
  maxItems = TIMELINE_PREVIEW_COUNT,
}: EmployeeTimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');
  const [expanded, setExpanded] = useState(false);

  const sourceList = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.type === filter)),
    [events, filter],
  );

  const visibleList = useMemo(() => {
    if (!maxItems || expanded) return sourceList;
    return sourceList.slice(0, maxItems);
  }, [sourceList, maxItems, expanded]);

  const hiddenCount =
    maxItems && !expanded ? Math.max(0, sourceList.length - maxItems) : 0;

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
              onClick={() => {
                setFilter(opt.id);
                setExpanded(false);
              }}
              className={[
                'rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                filterChipClass(opt.id, filter === opt.id),
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

      {!visibleList.length ? (
        <p className="text-sm text-corporate-muted py-4 text-center">Niciun eveniment în această categorie.</p>
      ) : (
        <ol className="relative border-l border-corporate-border ml-3 space-y-4 pl-6">
          {visibleList.map((ev) => {
            const area = TIMELINE_TYPE_AREA[ev.type];
            const theme = area ? PROGRAM_AREA_THEMES[area] : null;
            return (
            <li key={ev.id} className="relative">
              <span
                className={[
                  'absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white',
                  theme ? theme.accentBar : SEVERITY_DOT[ev.severity ?? 'info'],
                ].join(' ')}
                aria-hidden
              />
              <div
                className={[
                  'rounded-lg border px-3 py-2.5',
                  theme ? theme.itemShell : 'border-corporate-border bg-white',
                ].join(' ')}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={[
                      'text-[10px] uppercase tracking-wide font-semibold',
                      theme ? theme.summaryLabel : 'text-corporate-gold',
                    ].join(' ')}
                  >
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
            );
          })}
        </ol>
      )}

      {hiddenCount > 0 && (
        <div className="text-center pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(true)}>
            Vezi încă {hiddenCount} {hiddenCount === 1 ? 'eveniment' : 'evenimente'} →
          </Button>
        </div>
      )}

      {expanded && maxItems && sourceList.length > maxItems && (
        <div className="text-center pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Restrânge la {maxItems} evenimente
          </Button>
        </div>
      )}
    </div>
  );
}
