import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useCanSelectStagiar } from '@/context/StagiarContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useStagiarId } from '@/hooks/useStagiarId';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { canManageUsers } from '@/lib/roles';
import { ActConstatareForm } from '@/components/forms/ActConstatareForm';
import { FeedbackSummary } from '@/components/mentor/FeedbackForm';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { EvaluationStagesFlow } from '@/components/evaluation/EvaluationStagesFlow';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function EvaluationsPage() {
  const { isInTraining, canAccessMentor, loading, user } = useAuth();
  const { progress, saveActConstatare } = useProgress();
  const { downloadDocument, refresh } = useHrPerformance();
  const canSelect = useCanSelectStagiar();
  const stagiarId = useStagiarId();
  const isHrOrAdmin = user && canManageUsers(user);

  const targetAngajatId = isHrOrAdmin && stagiarId ? stagiarId : user?.id;
  const currentEval = targetAngajatId ? hrPerformanceStore.getCurrentEvaluation(targetAngajatId) : undefined;
  const employeeProfile = targetAngajatId ? hrPerformanceStore.getProfile(targetAngajatId) : undefined;
  const supervisorId = employeeProfile?.supervisorId ?? employeeProfile?.managerId;
  const isSupervisorEvaluator =
    !!currentEval &&
    !!user &&
    (user.id === currentEval.evaluatorId || (!!supervisorId && user.id === supervisorId));

  if (loading || !user) return null;

  const feedbackWeek2 = progress?.feedbacks.find((f) => f.weekNumber === 2);
  const feedbackWeek4 = progress?.feedbacks.find((f) => f.weekNumber === 4);

  return (
    <div className="space-y-6">
      {canSelect && <TraineeSelector />}

      {currentEval && currentEval.status !== 'evaluat' && (
        <TestingHighlightZone zoneId="zone-supervisor-eval">
        <EvaluationStagesFlow
          cycle={currentEval}
          mode={
            isHrOrAdmin
              ? 'hr'
              : user.id === currentEval.angajatId
                ? 'employee'
                : isSupervisorEvaluator
                  ? 'evaluator'
                  : 'view'
          }
          actorId={user.id}
          actorName={user.name}
          onDownloadDocument={(id) => void downloadDocument(id)}
          onUpdated={refresh}
        />
        </TestingHighlightZone>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Evaluări & Rapoarte</h1>
        <p className="text-corporate-muted mt-1">Acte de constatare și feedback evaluări săptămânale</p>
      </div>

      {isInTraining && <ActConstatareForm defaultDayId="day-18" onSubmit={saveActConstatare} />}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-corporate-dark">Feedback Evaluări</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-corporate-dark">Săptămâna II</h3>
              <Badge variant={feedbackWeek2 ? 'success' : 'warning'}>
                {feedbackWeek2 ? 'Completat' : 'În așteptare'}
              </Badge>
            </div>
            {feedbackWeek2 ? (
              <FeedbackSummary feedback={feedbackWeek2} />
            ) : (
              <p className="text-sm text-corporate-muted">
                {canAccessMentor
                  ? 'Completați formularul din Panoul Mentor.'
                  : 'Feedback-ul va fi completat de mentor la finalul Săptămânii II.'}
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-corporate-dark">Săptămâna IV</h3>
              <Badge variant={feedbackWeek4 ? 'success' : 'warning'}>
                {feedbackWeek4 ? 'Completat' : 'În așteptare'}
              </Badge>
            </div>
            {feedbackWeek4 ? (
              <FeedbackSummary feedback={feedbackWeek4} />
            ) : (
              <p className="text-sm text-corporate-muted">
                {canAccessMentor
                  ? 'Completați formularul din Panoul Mentor.'
                  : 'Evaluarea finală va fi completată de mentor la Ziua 20.'}
              </p>
            )}
          </Card>
        </div>
      </section>

      {progress && progress.acteConstatare.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-corporate-dark">
            Acte de Constatare ({progress.acteConstatare.length})
          </h2>
          <div className="space-y-3">
            {[...progress.acteConstatare].reverse().map((act) => (
              <Card key={act.id} padding="sm">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-medium text-corporate-dark">{act.proiectNume}</h3>
                    {act.dayId && (
                      <p className="text-xs text-corporate-muted">Zi program: {act.dayId}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{new Date(act.dataMasuratoare).toLocaleDateString('ro-RO')}</Badge>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-slate-600">
                  <p><strong>Erori:</strong> {act.eroriIdentificate}</p>
                  <p><strong>Abateri:</strong> {act.abateriMasuratori}</p>
                  <p><strong>Măsuri corective:</strong> {act.masuriCorective}</p>
                  {act.observatii && <p><strong>Observații:</strong> {act.observatii}</p>}
                  <p className="text-xs text-slate-400">
                    Înregistrat: {new Date(act.createdAt).toLocaleString('ro-RO')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
