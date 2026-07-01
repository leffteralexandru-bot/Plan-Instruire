import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  canViewMentorErrorAlerts,
  getSubordinatesWithErrorAlerts,
} from '@/lib/accessControl';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { ERROR_MOTIV_LABELS, hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { ingineriPath } from '@/data/departments';

export function MentorAlertsDashboard() {
  const { user } = useAuth();
  const { refresh } = useHrPerformance();
  const { users } = useUsers();

  if (!user || !canViewMentorErrorAlerts(user)) return null;

  const alertAngajatIds = getSubordinatesWithErrorAlerts(user.id);
  const alerts = trainingSystemStore
    .getErrorRepeatAlerts({ mentorId: user.id, unacknowledgedOnly: true })
    .filter((a) => alertAngajatIds.includes(a.angajatId));

  if (!alerts.length) return null;

  const handleAck = (alertId: string) => {
    trainingSystemStore.acknowledgeAlert(alertId);
    refresh();
  };

  return (
    <Card className="border-amber-400/60 bg-amber-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Dashboard Alerte — erori repetate</h2>
          <p className="text-sm text-corporate-muted">
            Subordonați care au atins pragul de erori de același tip. Re-instruire obligatorie activă.
          </p>
        </div>
        <Badge variant="warning">{alertAngajatIds.length} angajați</Badge>
      </div>

      <ul className="space-y-3">
        {alerts.map((alert) => {
          const angajat = users.find((u) => u.id === alert.angajatId);
          const profile = hrPerformanceStore.getProfile(alert.angajatId);
          const session = trainingSystemStore
            .getReTrainingSessions({ angajatId: alert.angajatId })
            .find((s) => s.id === alert.reTrainingSessionId);
          const name = profile
            ? `${profile.prenume} ${profile.nume}`
            : angajat?.name ?? alert.angajatId;

          return (
            <li
              key={alert.id}
              className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-corporate-dark">{name}</p>
                  <p className="text-corporate-muted mt-0.5">
                    {ERROR_MOTIV_LABELS[alert.errorMotiv]} · {alert.count} apariții în 90 zile
                  </p>
                  {session && (
                    <p className="text-xs text-amber-800 mt-1">
                      Re-instruire: termen {session.termenLimita} · status {session.status}
                    </p>
                  )}
                </div>
                <Badge variant={alert.severity === 'critical' ? 'warning' : 'default'}>
                  {alert.severity === 'critical' ? 'Critic' : 'Atenție'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link to={ingineriPath(`/angajat/${alert.angajatId}`)}>
                  <Button type="button" variant="primary" size="sm">
                    Deschide fișa
                  </Button>
                </Link>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleAck(alert.id)}>
                  Confirmă preluare
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
