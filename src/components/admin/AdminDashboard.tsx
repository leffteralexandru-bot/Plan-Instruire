import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminTabNav, type AdminTab } from '@/components/admin/performance/AdminTabNav';
import { EmployeesPanel } from '@/components/admin/performance/EmployeesPanel';
import { EvaluationsPanel } from '@/components/admin/performance/EvaluationsPanel';
import { ErrorsKpiPanel } from '@/components/admin/performance/ErrorsKpiPanel';
import { TrainingPanel } from '@/components/admin/performance/TrainingPanel';
import { AdminOnboardingGuide } from '@/components/admin/AdminOnboardingGuide';
import { OrgSettingsForm } from '@/components/admin/OrgSettingsForm';
import { DataBackupPanel } from '@/components/admin/DataBackupPanel';
import { HrEmailSettingsPanel } from '@/components/admin/performance/HrEmailSettingsPanel';
import { SupervisorWorkflowPanel } from '@/components/admin/performance/SupervisorWorkflowPanel';
import { ResponsabilitatiPanel } from '@/components/admin/performance/ResponsabilitatiPanel';
import { ManagementDashboardPanel } from '@/components/admin/performance/ManagementDashboardPanel';
import { CloudSyncPanel } from '@/components/admin/CloudSyncPanel';
import { CloudSetupChecklist } from '@/components/admin/CloudSetupChecklist';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { ActionInboxPanel } from '@/components/shared/ActionInboxPanel';
import { useAuth } from '@/hooks/useAuth';
import { isAdminTab } from '@/lib/adminRoutes';

function SettingsPanel() {
  const { canManageSettings } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <CloudSetupChecklist />
      <UserManagementPanel />
      <CloudSyncPanel />
      <HrEmailSettingsPanel />
      <DataBackupPanel onRestored={() => setRefreshKey((k) => k + 1)} />
      <AdminOnboardingGuide key={refreshKey} />
      {canManageSettings && <OrgSettingsForm />}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const tab: AdminTab = isAdminTab(rawTab) ? rawTab : 'management';

  const setTab = useCallback(
    (next: AdminTab) => {
      setSearchParams({ tab: next }, { replace: true });
    },
    [setSearchParams],
  );

  return (
    <div className="space-y-4">
      {user && (
        <ActionInboxPanel userId={user.id} roles={['hr']} maxItems={8} collapsible defaultExpanded />
      )}
      <AdminTabNav active={tab} onChange={setTab} />
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
