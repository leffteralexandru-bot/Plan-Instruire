import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccessControl } from '@/hooks/useAccessControl';
import { TraineeSelector } from './TraineeSelector';
import { MentorCohortDashboard } from './MentorCohortDashboard';
import { MentorSubordinatesPanel } from './MentorSubordinatesPanel';
import { MentorAlertsDashboard } from './MentorAlertsDashboard';
import { TrainerReTrainingPanel } from './TrainerReTrainingPanel';
import { HrMentorOverviewPanel } from './HrMentorOverviewPanel';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { RoleSummaryCards } from '@/components/shared/RoleSummaryCards';
import { getSupervisedEmployeeIds } from '@/lib/supervisor';
import { getRoleDashboardMetrics } from '@/lib/roleDashboard';
import { isMentorUser } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import { INGINERI_SUPERVISOR_PANEL_PATH } from '@/data/departments';
import { useStagiarSelection } from '@/context/StagiarContext';
import { DesktopPageHeader } from '@/components/layout/DesktopPageHeader';
import { DesktopPageIntro } from '@/components/layout/DesktopPageIntro';

export function MentorPanel() {
  const { user, canAccessAdmin } = useAuth();
  const { canOpenSupervisorPanel } = useAccessControl();
  const { progress } = useProgress();
  const [searchParams] = useSearchParams();
  const { setSelectedStagiarId } = useStagiarSelection();

  useNotifications();

  useEffect(() => {
    const trainee = searchParams.get('trainee');
    if (trainee) setSelectedStagiarId(trainee);
  }, [searchParams, setSelectedStagiarId]);

  const inboxRoles = useMemo(() => {
    if (!user) return [] as ('mentor' | 'supervisor')[];
    const roles: ('mentor' | 'supervisor')[] = [];
    if (isMentorUser(user) || canAccessAdmin) roles.push('mentor');
    if (getSupervisedEmployeeIds(user.id).length > 0) roles.push('supervisor');
    return roles;
  }, [user, canAccessAdmin]);

  const mentorMetrics = useMemo(
    () => (user && (isMentorUser(user) || canAccessAdmin) ? getRoleDashboardMetrics(user.id, 'mentor') : null),
    [user, canAccessAdmin],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <DesktopPageHeader>
            <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Mentor</h1>
          </DesktopPageHeader>
          <DesktopPageIntro>
            {canAccessAdmin
              ? 'Vedere HR: mentori, responsabilități, progres angajați'
              : 'Monitorizare progres · Validări · Feedback'}
          </DesktopPageIntro>
        </div>
        {canOpenSupervisorPanel && (
          <Link
            to={INGINERI_SUPERVISOR_PANEL_PATH}
            className="text-sm text-corporate-gold font-medium hover:underline"
          >
            Panou Supervizor →
          </Link>
        )}
      </div>

      {canAccessAdmin && <HrMentorOverviewPanel />}

      {user && inboxRoles.length > 0 && (
        <ActionInboxPanel userId={user.id} roles={inboxRoles} maxItems={6} />
      )}

      {mentorMetrics && <RoleSummaryCards role="mentor" metrics={mentorMetrics} />}

      <TraineeSelector />

      <MentorCohortDashboard />

      <MentorAlertsDashboard />

      <TrainerReTrainingPanel />

      <MentorSubordinatesPanel />

      {progress && progress.auditLog.length > 0 && (
        <Card padding="sm">
          <h2 className="font-semibold text-corporate-dark mb-2">Audit trail (recent)</h2>
          <ul className="text-xs text-corporate-muted space-y-1 max-h-32 overflow-y-auto">
            {[...progress.auditLog].reverse().slice(0, 8).map((a) => (
              <li key={a.id}>
                {new Date(a.createdAt).toLocaleString('ro-RO')} — {a.action} — {a.actorName}
                {a.details ? `: ${a.details}` : ''}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
