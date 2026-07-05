import type { AuditLogRow, MentorWorkloadItem } from '@/lib/hrAnalytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface MentorWorkloadBoardProps {
  items: MentorWorkloadItem[];
}

export function MentorWorkloadBoard({ items }: MentorWorkloadBoardProps) {
  if (!items.length) {
    return (
      <Card padding="sm">
        <h2 className="text-lg font-semibold text-corporate-dark">Coadă validări mentor</h2>
        <p className="text-sm text-emerald-600 mt-2">Toate validările sunt la zi.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-corporate-dark">Coadă validări mentor</h2>
        <Badge variant="warning">{items.reduce((n, i) => n + i.pendingDayNumbers.length, 0)} total</Badge>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.traineeId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2 text-sm"
          >
            <span className="font-medium">{item.traineeName}</span>
            <span className="text-xs text-amber-800">
              Așteaptă validare: Ziua {item.pendingDayNumbers.join(', Ziua ')}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

interface AuditLogViewerProps {
  entries: AuditLogRow[];
  onExport: () => void;
}

const AUDIT_LOG_VISIBLE_ROWS = 6;

export function AuditLogViewer({ entries, onExport }: AuditLogViewerProps) {
  const scrollMaxHeight = `${AUDIT_LOG_VISIBLE_ROWS * 2.5}rem`;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-corporate-dark">Jurnal audit (grupă)</h2>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" type="button" onClick={onExport}>
            Export audit CSV
          </Button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-corporate-muted">Nicio activitate înregistrată încă.</p>
      ) : (
        <>
          {entries.length > AUDIT_LOG_VISIBLE_ROWS && (
            <p className="text-xs text-corporate-muted mb-2">
              Primele {AUDIT_LOG_VISIBLE_ROWS} vizibile — derulați pentru celelalte {entries.length - AUDIT_LOG_VISIBLE_ROWS}.
            </p>
          )}
          <ul
            className="text-xs text-slate-600 space-y-1.5 overflow-y-auto pr-1"
            style={{ maxHeight: scrollMaxHeight }}
          >
            {entries.map((e) => (
              <li key={e.id} className="border-b border-slate-50 pb-1 leading-snug">
                <span className="text-corporate-muted">{new Date(e.createdAt).toLocaleString('ro-RO')}</span>
                {' · '}
                <strong>{e.traineeName}</strong>
                {' — '}
                {e.action} ({e.actorName})
                {e.details ? `: ${e.details}` : ''}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
