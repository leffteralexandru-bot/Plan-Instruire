import { useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useCanSelectStagiar, useStagiarSelection } from '@/context/StagiarContext';
import { ProgressProvider } from '@/hooks/useProgress';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { MentorCohortDashboard } from '@/components/mentor/MentorCohortDashboard';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { ingineriPath, INGINERI_SUPERVISOR_PANEL_PATH } from '@/data/departments';
import { canAccessTrainingPlanDashboard } from '@/lib/roles';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { isSupervisorOf } from '@/lib/supervisor';

export function DashboardPage() {
  const { loading, user, isInTraining } = useAuth();
  const { canOpenMentorPanel, canViewEmployee, canOpenSupervisorPanel } = useAccessControl();
  const canSelect = useCanSelectStagiar();
  const { setSelectedStagiarId, selectedStagiarId, selectedStagiarName } = useStagiarSelection();
  const [searchParams] = useSearchParams();
  const viewAs = searchParams.get('viewAs');

  useEffect(() => {
    if (user && isInTraining && !canSelect) {
      setSelectedStagiarId(user.id);
    }
  }, [user, isInTraining, canSelect, setSelectedStagiarId]);

  if (loading || !user) return null;

  if (viewAs && canViewEmployee(viewAs)) {
    const profile = hrPerformanceStore.getProfile(viewAs);
    const traineeName = profile
      ? `${profile.prenume} ${profile.nume}`.trim()
      : viewAs;
    const supervisorView = isSupervisorOf(user.id, viewAs);
    const backTo =
      supervisorView && canOpenSupervisorPanel
        ? INGINERI_SUPERVISOR_PANEL_PATH
        : canOpenMentorPanel
          ? ingineriPath('/mentor')
          : ingineriPath('/admin');
    const backLabel =
      supervisorView && canOpenSupervisorPanel
        ? 'panou supervizor'
        : canOpenMentorPanel
          ? 'panou mentor'
          : 'panou HR';
    return (
      <div>
        <Link
          to={backTo}
          className="text-sm text-corporate-gold hover:underline mb-4 inline-block"
        >
          ← Înapoi la {backLabel}
        </Link>
        <ProgressProvider userId={viewAs}>
          <DashboardView title={`Plan instruire — ${traineeName}`} />
        </ProgressProvider>
      </div>
    );
  }

  if (!canAccessTrainingPlanDashboard(user)) {
    return <Navigate to={ingineriPath('/admin')} replace />;
  }

  const mentorOnlyNoActiveTrainees = canOpenMentorPanel && !canSelect && !isInTraining;
  const dualRoleMentorTrainee = isInTraining && canSelect;
  const viewingOtherTrainee =
    canSelect && user != null && selectedStagiarId !== user.id;

  return (
    <div>
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
