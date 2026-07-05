import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmployeeReTrainingCard } from '@/components/shared/EmployeeReTrainingCard';
import { getAngajatTrainingReport, isTrainingPlanComplete } from '@/lib/hrReport';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { sortReTrainingSessionsNewestFirst } from '@/lib/errorReTrainingDisplay';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { ingineriPath, INGINERI_PLAN_PATH } from '@/data/departments';
import { PROGRAM_AREA_THEMES } from '@/lib/programAreaTheme';

interface EmployeeTrainingHistoryPanelProps {
  angajatId: string;
  showPlanLink?: boolean;
  /** Plan angajat (supervizor: traineePlanPath cu viewAs) */
  planHref?: string;
  /** Pentru linkuri re-instruire din planul subordonatului */
  planViewAsAngajatId?: string;
  onDownloadDocument?: (id: string) => void;
}

export function EmployeeTrainingHistoryPanel({
  angajatId,
  showPlanLink,
  planHref = INGINERI_PLAN_PATH,
  planViewAsAngajatId,
  onDownloadDocument,
}: EmployeeTrainingHistoryPanelProps) {
  const trainingReport = getAngajatTrainingReport(angajatId);
  const trainingFinished = trainingReport ? isTrainingPlanComplete(trainingReport) : false;
  const sessions = sortReTrainingSessionsNewestFirst(
    trainingSystemStore.getReTrainingSessions({ angajatId }),
  );
  const activeSessions = sessions.filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
  const completedSessions = sessions.filter((s) => normalizeReTrainingStatus(s.status) === 'finalizat');

  const trainingTheme = PROGRAM_AREA_THEMES.training;
  const retrainingTheme = PROGRAM_AREA_THEMES.retraining;

  return (
    <div className="space-y-4">
      <Card className={`border-t-4 border-t-amber-400 ${trainingTheme.blockShell}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className={`text-lg font-semibold ${trainingTheme.blockTitle}`}>Instruire inițială</h2>
            <p className="text-sm text-corporate-muted">Plan de 4 săptămâni la angajare</p>
          </div>
          {showPlanLink && (
            <Link to={planHref}>
              <Button type="button" variant="secondary" size="sm">
                Deschide planul →
              </Button>
            </Link>
          )}
        </div>
        {!trainingReport ? (
          <p className="text-sm text-corporate-muted italic">Nicio înscriere în planul de instruire.</p>
        ) : (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 ${trainingTheme.itemShell}`}>
            <div>
              <p className="font-medium text-corporate-dark">
                {trainingFinished ? 'Instruire de succes' : 'Plan în curs'}
              </p>
              <p className="text-xs text-corporate-muted mt-0.5">
                {trainingReport.completedDays}/{trainingReport.totalDays} zile · {trainingReport.progressPercent}%
              </p>
            </div>
            <Badge variant={trainingFinished ? 'success' : 'default'}>
              {trainingFinished ? 'Finalizată' : 'În curs'}
            </Badge>
          </div>
        )}
      </Card>

      {(activeSessions.length > 0 || completedSessions.length > 0) && (
        <div className={`space-y-3 rounded-xl border p-4 ${retrainingTheme.flowShell}`}>
          <h2 className={`text-lg font-semibold ${retrainingTheme.flowEyebrow}`}>Re-instruiri</h2>
          {activeSessions.map((session) => (
            <EmployeeReTrainingCard
              key={session.id}
              session={session}
              planViewAsAngajatId={planViewAsAngajatId}
              onOpenNota={onDownloadDocument ? (id) => void onDownloadDocument(id) : undefined}
            />
          ))}
          {completedSessions.map((session) => (
            <EmployeeReTrainingCard
              key={session.id}
              session={session}
              planViewAsAngajatId={planViewAsAngajatId}
              onOpenNota={onDownloadDocument ? (id) => void onDownloadDocument(id) : undefined}
            />
          ))}
        </div>
      )}

      {sessions.length === 0 && (
        <Card padding="sm" className={`border ${retrainingTheme.blockShell}`}>
          <p className="text-sm text-corporate-muted italic">Nicio re-instruire înregistrată.</p>
        </Card>
      )}

      {sessions.some((s) => s.trainerReport) && (
        <p className="text-xs text-corporate-muted">
          Rapoartele mentorului rămân și în{' '}
          <Link to={ingineriPath(`/angajat/${angajatId}`)} className="text-corporate-gold hover:underline">
            dosar 360° → Arhivă → Istoric instruire
          </Link>
          .
        </p>
      )}
    </div>
  );
}
