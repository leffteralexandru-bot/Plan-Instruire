import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { getActiveStage, getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { getSupervisedEmployeeIds } from '@/lib/supervisor';
import { evaluationsLink } from '@/lib/actionFocus';
import { useHrPerformance } from '@/hooks/useHrPerformance';

interface SupervisorPendingEvaluationsPanelProps {
  supervisorId: string;
}

export function SupervisorPendingEvaluationsPanel({ supervisorId }: SupervisorPendingEvaluationsPanelProps) {
  const { evaluations } = useHrPerformance();

  const pending = useMemo(() => {
    const items: { angajatId: string; name: string; evalId: string; status: string }[] = [];
    for (const angajatId of getSupervisedEmployeeIds(supervisorId)) {
      const ev = evaluations.find(
        (e) =>
          e.angajatId === angajatId &&
          (e.status === 'in_curs' || e.status === 'intarziat'),
      ) ?? hrPerformanceStore.getCurrentEvaluation(angajatId);
      if (!ev || ev.status === 'evaluat' || ev.status === 'planificat') continue;
      const active = getActiveStage(ev);
      if (active?.id !== 'evaluare_mentor') continue;
      const profile = hrPerformanceStore.getProfile(angajatId);
      items.push({
        angajatId,
        name: profile ? `${profile.prenume} ${profile.nume}`.trim() : angajatId,
        evalId: ev.id,
        status: getEvaluationWorkflowLabel(ev),
      });
    }
    return items;
  }, [supervisorId, evaluations]);

  if (pending.length === 0) return null;

  return (
    <Card className="border-corporate-gold/40 bg-corporate-gold-light/15">
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Evaluări de completat</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Angajații de mai jos au trimis auto-evaluarea. Completați evaluarea supervizorului (matrice competențe).
      </p>
      <ul className="space-y-2">
        {pending.map((item) => (
          <li
            key={item.evalId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-corporate-border bg-white px-3 py-2.5"
          >
            <div>
              <p className="font-medium text-corporate-dark">{item.name}</p>
              <p className="text-xs text-corporate-muted">{item.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">Acțiune necesară</Badge>
              <Link to={evaluationsLink({ angajatId: item.angajatId, evalId: item.evalId })}>
                <Button type="button" variant="primary" size="sm">
                  Evaluează acum
                </Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
