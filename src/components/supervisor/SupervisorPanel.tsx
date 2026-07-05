import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { RoleSummaryCards } from '@/components/shared/RoleSummaryCards';
import { SupervisedTeamPanel } from '@/components/supervisor/SupervisedTeamPanel';
import { SupervisorErrorRegistrationPanel } from '@/components/shared/SupervisorErrorRegistrationPanel';
import { SupervisorPendingEvaluationsPanel } from '@/components/supervisor/SupervisorPendingEvaluationsPanel';
import { SupervisorReinstruireCereriPanel } from '@/components/supervisor/SupervisorReinstruireCereriPanel';
import { SupervisorWorkflowPanel } from '@/components/admin/performance/SupervisorWorkflowPanel';
import { CompletedEvaluationsHrPanel } from '@/components/admin/performance/CompletedEvaluationsHrPanel';
import { getRoleDashboardMetrics } from '@/lib/roleDashboard';
import { getSupervisedEmployeeIds } from '@/lib/supervisor';
import { ingineriPath } from '@/data/departments';

export function SupervisorPanel() {
  const { user } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  const { evaluations, documents, downloadDocument } = useHrPerformance();
  const { users } = useUsers();

  const metrics = useMemo(
    () => (user ? getRoleDashboardMetrics(user.id, 'supervisor') : null),
    [user],
  );

  const supervisedEvaluations = useMemo(() => {
    if (!user) return [];
    const ids = new Set(getSupervisedEmployeeIds(user.id));
    return evaluations.filter((e) => ids.has(e.angajatId));
  }, [user, evaluations]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Supervizor</h1>
          <p className="text-corporate-muted mt-1">
            Erori · evaluări · re-instruire — responsabilitățile tale ca supervizor direct.
          </p>
        </div>
        {canOpenMentorPanel && (
          <Link
            to={ingineriPath('/mentor')}
            className="text-sm text-corporate-gold font-medium hover:underline"
          >
            Panou Mentor →
          </Link>
        )}
      </div>

      <ActionInboxPanel userId={user.id} roles={['supervisor']} maxItems={8} />

      <SupervisorPendingEvaluationsPanel supervisorId={user.id} />

      {metrics && <RoleSummaryCards role="supervisor" metrics={metrics} />}

      <SupervisedTeamPanel />

      <SupervisorErrorRegistrationPanel />

      <SupervisorReinstruireCereriPanel supervisorId={user.id} />

      <CompletedEvaluationsHrPanel
        evaluations={supervisedEvaluations}
        users={users}
        showSalaryCoefficient={false}
        onDownloadDocument={(id) => void downloadDocument(id)}
        getSignedDocumentName={(cycleId) => {
          const ev = supervisedEvaluations.find((e) => e.id === cycleId);
          if (!ev?.documentId) return undefined;
          return documents.find((d) => d.id === ev.documentId)?.nume;
        }}
      />

      <SupervisorWorkflowPanel hideErrorRegistration />
    </div>
  );
}
