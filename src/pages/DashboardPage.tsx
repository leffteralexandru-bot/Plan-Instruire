import { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useCanSelectStagiar, useStagiarSelection } from '@/context/StagiarContext';
import { ProgressProvider } from '@/hooks/useProgress';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { MentorCohortDashboard } from '@/components/mentor/MentorCohortDashboard';
import { DepartmentPlanBanner } from '@/components/departments/DepartmentPlanBanner';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { ingineriPath } from '@/data/departments';
import { canAccessTrainingPlanDashboard } from '@/lib/roles';

export function DashboardPage() {
  const { loading, user, isInTraining } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  const canSelect = useCanSelectStagiar();
  const { setSelectedStagiarId, selectedStagiarId, selectedStagiarName } = useStagiarSelection();

  useEffect(() => {
    if (user && isInTraining && !canSelect) {
      setSelectedStagiarId(user.id);
    }
  }, [user, isInTraining, canSelect, setSelectedStagiarId]);

  if (loading || !user) return null;

  if (!canAccessTrainingPlanDashboard(user)) {
    return <Navigate to={ingineriPath('/admin')} replace />;
  }

  const mentorOnlyNoActiveTrainees = canOpenMentorPanel && !canSelect && !isInTraining;
  const dualRoleMentorTrainee = isInTraining && canSelect;
  const viewingOtherTrainee =
    canSelect && user != null && selectedStagiarId !== user.id;

  return (
    <div>
      <DepartmentPlanBanner />
      {dualRoleMentorTrainee && user && (
        <div className="mb-6">
          <ProgressProvider userId={user.id}>
            <DashboardView title="Plan de Instruire" />
          </ProgressProvider>
        </div>
      )}
      {canSelect && (
        <div className="space-y-6 mb-6">
          <TraineeSelector />
          <MentorCohortDashboard />
        </div>
      )}
      {mentorOnlyNoActiveTrainees ? (
        <ProfessionalPanel
          variant="neutral"
          icon="mentor"
          eyebrow="Plan de instruire"
          title="Niciun angajat în instruire activă"
          subtitle="Monitorizarea zilnică nu este necesară — toți au finalizat programul inițial"
          headerAction={
            <Link to={ingineriPath('/mentor')}>
              <Button type="button" variant="secondary" size="sm">
                Panou Mentor →
              </Button>
            </Link>
          }
        >
          <p className="text-sm text-corporate-muted">
            Certificatele și arhivele rămân disponibile în dosarul fiecărui angajat și în Panoul Mentor.
          </p>
        </ProfessionalPanel>
      ) : dualRoleMentorTrainee && viewingOtherTrainee ? (
        <DashboardView title={`Plan instruire — ${selectedStagiarName}`} />
      ) : dualRoleMentorTrainee ? null : (
        <DashboardView title="Plan de Instruire" />
      )}
    </div>
  );
}
