import { useState } from 'react';
import type { PlanArchiveIndexEntry } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { MaterialRow } from '@/components/day/MaterialsPanel';
import { useArchiveDayPhotos } from '@/hooks/useArchiveDayPhotos';

function RowChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={[
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-corporate-border/70 text-corporate-stone transition-transform',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ArchiveDayPhotos({ angajatId, dayId, enabled }: { angajatId: string; dayId: string; enabled: boolean }) {
  const { photos, loading } = useArchiveDayPhotos(angajatId, dayId, enabled);

  if (!enabled) return null;
  if (loading) {
    return <p className="text-xs text-corporate-muted py-2">Se încarcă fotografiile…</p>;
  }
  if (!photos.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">Fotografii șantier</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((p) => (
          <figure key={p.id} className="rounded-lg overflow-hidden border border-corporate-border/80 bg-white">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={p.url} alt={p.label} className="w-full h-28 object-cover" loading="lazy" />
            </a>
            <figcaption className="text-[10px] px-2 py-1.5 text-corporate-muted truncate flex justify-between gap-1">
              <span className="truncate">{p.label}</span>
              {!p.synced && <span className="text-amber-600 shrink-0">local</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function ArchiveDayExpand({
  entry,
  angajatId,
}: {
  entry: PlanArchiveIndexEntry;
  angajatId: string;
}) {
  return (
    <div className="border-t border-corporate-border/60 px-3 py-3 space-y-4 bg-corporate-surface/20">
      {entry.instructions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
            Instrucțiuni zi
          </p>
          <ul className="text-sm text-corporate-muted list-disc pl-5 space-y-0.5">
            {entry.instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {entry.materials.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
            Fișiere & materiale
          </p>
          <ul className="space-y-2">
            {entry.materials.map((mat) => (
              <MaterialRow key={mat.id} mat={mat} />
            ))}
          </ul>
        </div>
      )}

      <ArchiveDayPhotos angajatId={angajatId} dayId={entry.dayId} enabled />
    </div>
  );
}

interface PlanArchiveDayListProps {
  angajatId: string;
  entries: PlanArchiveIndexEntry[];
  /** Înălțime maximă cu scroll — omit pentru listă completă pe pagină dedicată */
  maxHeight?: string;
  groupByWeek?: boolean;
}

export function PlanArchiveDayList({
  angajatId,
  entries,
  maxHeight,
  groupByWeek,
}: PlanArchiveDayListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggle = (dayId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const renderDay = (entry: PlanArchiveIndexEntry) => {
    const expanded = expandedIds.has(entry.dayId);
    const itemCount = entry.materials.length + entry.instructions.length;

    return (
      <li key={entry.dayId} className="rounded-lg border border-corporate-border overflow-hidden">
        <button
          type="button"
          onClick={() => toggle(entry.dayId)}
          aria-expanded={expanded}
          className={[
            'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
            expanded ? 'bg-corporate-gold-light/15' : 'hover:bg-corporate-surface/60',
          ].join(' ')}
        >
          <div className="min-w-0">
            <p className="font-medium text-corporate-dark">
              S{entry.weekNumber} · Ziua {entry.dayNumber}: {entry.dayTitle}
            </p>
            <p className="text-xs text-corporate-muted mt-0.5">
              {entry.materials.length} fișiere · {entry.instructions.length} instrucțiuni
              {itemCount === 0 ? ' · apăsați pentru fotografii șantier' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {entry.materials.some((m) => m.type === 'video') && (
              <Badge variant="info">Video</Badge>
            )}
            {entry.materials.length > 0 && (
              <Badge variant="default">{entry.materials.length}</Badge>
            )}
            <RowChevron expanded={expanded} />
          </div>
        </button>
        {expanded && <ArchiveDayExpand entry={entry} angajatId={angajatId} />}
      </li>
    );
  };

  if (groupByWeek) {
    const weekIds = [...new Set(entries.map((e) => e.weekId))];
    return (
      <div className="space-y-4">
        {weekIds.map((weekId) => {
          const weekEntries = entries.filter((e) => e.weekId === weekId);
          const first = weekEntries[0];
          if (!first) return null;
          return (
            <div key={weekId}>
              <h3 className="text-sm font-semibold text-corporate-dark mb-2">
                Săptămâna {first.weekNumber}: {first.weekTitle}
              </h3>
              <ul className="space-y-2">{weekEntries.map(renderDay)}</ul>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ul
      className={['space-y-2', maxHeight ? `${maxHeight} overflow-y-auto pr-1` : ''].join(' ')}
    >
      {entries.map(renderDay)}
    </ul>
  );
}
