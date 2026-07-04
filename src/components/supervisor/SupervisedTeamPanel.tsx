import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { buildSupervisedSubordinateRows } from '@/lib/roleDashboard';
import { ingineriPath } from '@/data/departments';
import { EVALUATION_STATUS_LABELS } from '@/lib/hrPerformanceStore';

export function SupervisedTeamPanel() {
  const { user } = useAuth();

  const rows = useMemo(
    () => (user ? buildSupervisedSubordinateRows(user.id) : []),
    [user],
  );

  if (!rows.length) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Echipa mea — subordonați</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Evaluări tri-lunale, re-instruire și dosar 360° pentru fiecare angajat supervizat.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.userId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-corporate-border px-3 py-2 text-sm"
          >
            <div>
              <strong className="text-corporate-dark">{r.name}</strong>
              <span className="text-corporate-muted ml-2">{r.functie}</span>
              {r.evaluationStage && (
                <p className="text-xs text-corporate-muted mt-1">Etapa: {r.evaluationStage}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {r.retrainingActive && <Badge variant="warning">Re-instruire</Badge>}
              {r.evaluationStatus && (
                <Badge variant={r.evaluationStatus === 'intarziat' ? 'warning' : 'default'}>
                  {EVALUATION_STATUS_LABELS[r.evaluationStatus]}
                </Badge>
              )}
              <Link
                to={ingineriPath(`/angajat/${r.userId}`)}
                className="text-corporate-gold text-xs font-medium hover:underline"
              >
                Fișă 360° →
              </Link>
              <Link
                to={ingineriPath('/evaluari')}
                className="text-corporate-muted text-xs hover:underline"
              >
                Evaluări
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
