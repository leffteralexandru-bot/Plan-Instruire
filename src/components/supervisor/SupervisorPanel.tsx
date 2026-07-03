import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { RoleSummaryCards } from '@/components/shared/RoleSummaryCards';
import { SupervisedTeamPanel } from '@/components/supervisor/SupervisedTeamPanel';
import { SupervisorErrorRegistrationPanel } from '@/components/shared/SupervisorErrorRegistrationPanel';
import { SupervisorWorkflowPanel } from '@/components/admin/performance/SupervisorWorkflowPanel';
import { getRoleDashboardMetrics } from '@/lib/roleDashboard';
import { ingineriPath } from '@/data/departments';

export function SupervisorPanel() {
  const { user } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();

  const metrics = useMemo(
    () => (user ? getRoleDashboardMetrics(user.id, 'supervisor') : null),
    [user],
  );

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

      {metrics && <RoleSummaryCards role="supervisor" metrics={metrics} />}

      <SupervisedTeamPanel />

      <SupervisorErrorRegistrationPanel />

      <SupervisorWorkflowPanel hideErrorRegistration />
    </div>
  );
}
