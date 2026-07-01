import type { TimelineEvent } from '@/types';

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
  evaluare: 'Evaluare',
  nota: 'Notă',
  eroare: 'Eroare',
  document: 'Document',
  instruire: 'Instruire',
  audit: 'Activitate',
};

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

export function EmployeeTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-corporate-muted py-6 text-center">
        Niciun eveniment înregistrat încă.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-corporate-border ml-3 space-y-4 pl-6">
      {events.map((ev) => (
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
          </div>
        </li>
      ))}
    </ol>
  );
}
