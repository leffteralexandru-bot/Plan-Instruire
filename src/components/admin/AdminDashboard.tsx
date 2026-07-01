import { useState } from 'react';
import { AdminTabNav, type AdminTab } from '@/components/admin/performance/AdminTabNav';
import { EmployeesPanel } from '@/components/admin/performance/EmployeesPanel';
import { EvaluationsPanel } from '@/components/admin/performance/EvaluationsPanel';
import { ErrorsKpiPanel } from '@/components/admin/performance/ErrorsKpiPanel';
import { TrainingPanel } from '@/components/admin/performance/TrainingPanel';
import { AdminOnboardingGuide } from '@/components/admin/AdminOnboardingGuide';
import { OrgSettingsForm } from '@/components/admin/OrgSettingsForm';
import { DataBackupPanel } from '@/components/admin/DataBackupPanel';
import { HrEmailSettingsPanel } from '@/components/admin/performance/HrEmailSettingsPanel';
import { CloudSyncPanel } from '@/components/admin/CloudSyncPanel';
import { useAuth } from '@/hooks/useAuth';

function SettingsPanel() {
  const { canManageSettings } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <CloudSyncPanel />
      <HrEmailSettingsPanel />
      <DataBackupPanel onRestored={() => setRefreshKey((k) => k + 1)} />
      <AdminOnboardingGuide key={refreshKey} />
      {canManageSettings && <OrgSettingsForm />}
    </div>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('angajati');

  return (
    <div>
      <AdminTabNav active={tab} onChange={setTab} />
      {tab === 'angajati' && <EmployeesPanel />}
      {tab === 'evaluari' && <EvaluationsPanel />}
      {tab === 'erori' && <ErrorsKpiPanel />}
      {tab === 'instruire' && <TrainingPanel />}
      {tab === 'setari' && <SettingsPanel />}
    </div>
  );
}
