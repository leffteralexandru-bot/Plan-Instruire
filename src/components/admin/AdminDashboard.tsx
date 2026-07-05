import { useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminTabNav, type AdminTab } from '@/components/admin/performance/AdminTabNav';
import { EmployeesPanel } from '@/components/admin/performance/EmployeesPanel';
import { EvaluationsPanel } from '@/components/admin/performance/EvaluationsPanel';
import { ErrorsKpiPanel } from '@/components/admin/performance/ErrorsKpiPanel';
import { TrainingPanel } from '@/components/admin/performance/TrainingPanel';
import { OrgSettingsForm } from '@/components/admin/OrgSettingsForm';
import { DataBackupPanel } from '@/components/admin/DataBackupPanel';
import { HrEmailSettingsPanel } from '@/components/admin/performance/HrEmailSettingsPanel';
import { SupervisorWorkflowPanel } from '@/components/admin/performance/SupervisorWorkflowPanel';
import { ResponsabilitatiPanel } from '@/components/admin/performance/ResponsabilitatiPanel';
import { ManagementDashboardPanel } from '@/components/admin/performance/ManagementDashboardPanel';
import { CloudSyncPanel } from '@/components/admin/CloudSyncPanel';
import { CloudSetupChecklist } from '@/components/admin/CloudSetupChecklist';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { AdminOnboardingGuide } from '@/components/admin/AdminOnboardingGuide';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { isAdminTab } from '@/lib/adminRoutes';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { highlightActionElement } from '@/lib/actionFocus';

function SettingsPanel() {
  const { canManageSettings } = useAuth();

  return (
    <div className="space-y-6">
      <CloudSetupChecklist />
      <UserManagementPanel />
      <AdminOnboardingGuide />
      <CloudSyncPanel />
      <HrEmailSettingsPanel />
      <DataBackupPanel onRestored={() => window.location.reload()} />
      {canManageSettings && <OrgSettingsForm />}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { errorCases } = useHrPerformance();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const tab: AdminTab = isAdminTab(rawTab) ? rawTab : 'management';
  const pendingHrErrors = useMemo(
    () => trainingSystemStore.getErrorsPendingHrReview().length,
    [errorCases],
  );

  const setTab = useCallback(
    (next: AdminTab) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('tab', next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus) return;

    const tabForFocus: Partial<Record<string, AdminTab>> = {
      settings: 'setari',
      eval: 'evaluari',
      error: 'erori',
      retrain: 'supervizor',
    };
    const targetTab = tabForFocus[focus];
    if (targetTab && tab !== targetTab) {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('tab', targetTab);
          return params;
        },
        { replace: true },
      );
      return;
    }

    if (focus === 'settings') {
      window.setTimeout(() => highlightActionElement('action-focus-settings'), 350);
    }
  }, [searchParams, tab, setSearchParams]);

  return (
    <div className="space-y-4">
      {user && (
        <ActionInboxPanel userId={user.id} roles={['hr']} maxItems={8} collapsible defaultExpanded />
      )}
      <AdminTabNav active={tab} onChange={setTab} pendingHrErrors={pendingHrErrors} />
      {tab === 'management' && <ManagementDashboardPanel onOpenTab={setTab} />}
      {tab === 'angajati' && <EmployeesPanel />}
      {tab === 'responsabilitati' && <ResponsabilitatiPanel />}
      {tab === 'evaluari' && <EvaluationsPanel />}
      {tab === 'erori' && <ErrorsKpiPanel />}
      {tab === 'supervizor' && <SupervisorWorkflowPanel />}
      {tab === 'instruire' && <TrainingPanel />}
      {tab === 'setari' && <SettingsPanel />}
    </div>
  );
}
