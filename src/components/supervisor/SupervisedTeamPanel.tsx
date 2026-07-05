import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { buildSupervisedSubordinateRows } from '@/lib/roleDashboard';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { useActionFocusEffect } from '@/hooks/useActionFocus';
import { actionFocusElementId, highlightActionElement } from '@/lib/actionFocus';
import { EVALUATION_STATUS_LABELS } from '@/lib/hrPerformanceStore';
import { SupervisedSubordinateDetail, RowChevron } from '@/components/supervisor/SupervisedSubordinateDetail';

export function SupervisedTeamPanel() {
  const { user } = useAuth();
  const trainingVersion = useTrainingSystemVersion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(
    () => (user ? buildSupervisedSubordinateRows(user.id) : []),
    [user, trainingVersion],
  );

  useActionFocusEffect(
    {
      team: () => {
        const angajat = new URLSearchParams(window.location.search).get('angajat');
        if (!angajat) return;
        setExpandedId(angajat);
        highlightActionElement(actionFocusElementId('team', angajat));
      },
    },
    [rows.length],
  );

  if (!rows.length) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Echipa mea — subordonați</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Apăsați pe numele angajatului — panoul se extinde aici, în panoul supervizor. Re-instruirea și
        evaluările se deschid doar la expand, fără navigare automată.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => {
          const expanded = expandedId === r.userId;

          return (
            <li key={r.userId} id={actionFocusElementId('team', r.userId)} className="rounded-lg border border-corporate-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : r.userId)}
                aria-expanded={expanded}
                className={[
                  'flex w-full flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                  expanded ? 'bg-corporate-gold-light/20' : 'hover:bg-corporate-surface',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <p className="font-medium text-corporate-dark">
                    {r.name}
                    <span className="text-corporate-muted font-normal ml-2">{r.functie}</span>
                  </p>
                  {r.evaluationStage && (
                    <p className="text-xs text-corporate-muted mt-0.5">Etapa: {r.evaluationStage}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {r.retrainingActive && <Badge variant="warning">Re-instruire în curs</Badge>}
                  {r.retrainingCompleted && !r.retrainingActive && (
                    <Badge variant="success">Re-instruire finalizată</Badge>
                  )}
                  {r.evaluationStatus && (
                    <Badge variant={r.evaluationStatus === 'intarziat' ? 'warning' : 'default'}>
                      {EVALUATION_STATUS_LABELS[r.evaluationStatus]}
                    </Badge>
                  )}
                  <RowChevron expanded={expanded} />
                </div>
              </button>

              {expanded && <SupervisedSubordinateDetail row={r} />}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
