import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useCanSelectStagiar, useStagiarSelection } from '@/context/StagiarContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActionFocusEffect } from '@/hooks/useActionFocus';
import { actionFocusElementId, highlightActionElement } from '@/lib/actionFocus';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { canManageUsers } from '@/lib/roles';
import { ReinstruireCerereForm } from '@/components/forms/ReinstruireCerereForm';
import { FeedbackSummary } from '@/components/mentor/FeedbackForm';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { EvaluationStagesFlow } from '@/components/evaluation/EvaluationStagesFlow';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DesktopPageHeader } from '@/components/layout/DesktopPageHeader';
import { DesktopPageIntro } from '@/components/layout/DesktopPageIntro';

export function EvaluationsPage() {
  const { canAccessMentor, loading, user } = useAuth();
  const { canViewEmployee } = useAccessControl();
  const { progress } = useProgress();
  const { downloadDocument, refresh } = useHrPerformance();
  const canSelect = useCanSelectStagiar();
  const stagiarId = useStagiarId();
  const { setSelectedStagiarId } = useStagiarSelection();
  const [searchParams] = useSearchParams();
  const isHrOrAdmin = user && canManageUsers(user);

  const viewAsParam = searchParams.get('viewAs') ?? searchParams.get('angajat');

  useEffect(() => {
    if (viewAsParam && user && canViewEmployee(viewAsParam)) {
      setSelectedStagiarId(viewAsParam);
    }
  }, [viewAsParam, user, canViewEmployee, setSelectedStagiarId]);

  useActionFocusEffect({
    eval: () => highlightActionElement(actionFocusElementId('eval', 'flow')),
  });

  const targetAngajatId = useMemo(() => {
    if (!user) return undefined;
    if (isHrOrAdmin && (stagiarId || viewAsParam)) {
      const id = stagiarId ?? viewAsParam;
      if (id && canViewEmployee(id)) return id;
    }
    if (viewAsParam && canViewEmployee(viewAsParam)) return viewAsParam;
    return user.id;
  }, [user, isHrOrAdmin, stagiarId, viewAsParam, canViewEmployee]);

  const viewingSubordinate = !!targetAngajatId && !!user && targetAngajatId !== user.id;
  const employeeProfile = targetAngajatId ? hrPerformanceStore.getProfile(targetAngajatId) : undefined;
  const viewedEmployeeName = employeeProfile
    ? `${employeeProfile.prenume} ${employeeProfile.nume}`.trim()
    : targetAngajatId;
  const currentEval = targetAngajatId ? hrPerformanceStore.getCurrentEvaluation(targetAngajatId) : undefined;
  const supervisorId = employeeProfile?.supervisorId ?? employeeProfile?.managerId;
  const isSupervisorEvaluator =
    !!currentEval &&
    !!user &&
    (user.id === currentEval.evaluatorId || (!!supervisorId && user.id === supervisorId));
  const canSubmitCerere = targetAngajatId === user?.id;

  if (loading || !user) return null;

  const feedbackWeek2 = viewingSubordinate ? undefined : progress?.feedbacks.find((f) => f.weekNumber === 2);
  const feedbackWeek4 = viewingSubordinate ? undefined : progress?.feedbacks.find((f) => f.weekNumber === 4);

  return (
    <div className="space-y-6">
      {canSelect && <TraineeSelector />}

      {currentEval && currentEval.status !== 'evaluat' && (
        <TestingHighlightZone zoneId="zone-supervisor-eval">
        <div id={actionFocusElementId('eval', 'flow')}>
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
        </div>
        </TestingHighlightZone>
      )}

      {viewingSubordinate && (
        <p className="text-sm text-corporate-muted -mt-2">
          Evaluare pentru: <strong className="text-corporate-dark">{viewedEmployeeName}</strong>
        </p>
      )}

      <div>
        <DesktopPageHeader>
          <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Evaluări & Rapoarte</h1>
        </DesktopPageHeader>
        <DesktopPageIntro>
          Cereri de re-instruire, evaluare tri-lunară și feedback săptămânal
        </DesktopPageIntro>
      </div>

      {canSubmitCerere && targetAngajatId && (
        <ReinstruireCerereForm angajatId={targetAngajatId} />
      )}

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
    </div>
  );
}
