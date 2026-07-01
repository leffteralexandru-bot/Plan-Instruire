import { useMemo, useState } from 'react';
import { STAGIARI } from '@/data/users';
import { storage } from '@/store/storage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { buildHrAggregateReport } from '@/lib/hrReport';
import {
  aggregateAuditLog,
  countByStatus,
  getCohortProgressAverage,
  getMentorWorkload,
  getTraineeStatusLabel,
  getWeekCompletionRates,
  getTraineeStatus,
} from '@/lib/hrAnalytics';
import { downloadAuditCsv, downloadCsv, downloadXlsx, printHrReport } from '@/lib/exportReport';
import { AdminOnboardingGuide } from '@/components/admin/AdminOnboardingGuide';
import { OrgSettingsForm } from '@/components/admin/OrgSettingsForm';
import { getActiveCohort } from '@/data/cohorts';
import { ProgressCohortChart, TraineeTable } from '@/components/admin/HrAnalyticsPanels';
import { AuditLogViewer, MentorWorkloadBoard } from '@/components/admin/AuditAndWorkload';
import { DataBackupPanel } from '@/components/admin/DataBackupPanel';
import { CloudSyncPanel } from '@/components/admin/CloudSyncPanel';
import { downloadWeeklyHrReport } from '@/lib/weeklyReport';

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'name' | 'progress' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const settings = storage.getSettings();

  const getProgress = (userId: string) => storage.getProgress(userId);

  const report = useMemo(
    () => buildHrAggregateReport(STAGIARI, getProgress, settings.programVersion),
    [settings.programVersion, refreshKey],
  );

  const statusCounts = useMemo(() => countByStatus(report.trainees), [report.trainees]);
  const weekRates = useMemo(() => getWeekCompletionRates(STAGIARI, getProgress), [refreshKey]);
  const cohortAverage = useMemo(() => getCohortProgressAverage(report.trainees), [report.trainees]);
  const auditEntries = useMemo(() => aggregateAuditLog(STAGIARI, getProgress, 30), [refreshKey]);
  const mentorWorkload = useMemo(() => getMentorWorkload(STAGIARI, getProgress), [refreshKey]);

  const handleSortSelect = (value: string) => {
    const [k, dir] = value.split('-') as ['name' | 'progress' | 'status', 'asc' | 'desc'];
    setSortKey(k);
    setSortAsc(dir === 'asc');
  };

  const handleXlsx = async () => {
    setXlsxLoading(true);
    try {
      await downloadXlsx(report);
    } finally {
      setXlsxLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Stagiari activi" value={String(report.summary.totalTrainees)} />
        <KpiCard label="Medie cohortă" value={`${cohortAverage}%`} />
        <KpiCard
          label="Validări în așteptare"
          value={String(report.summary.pendingValidationsTotal)}
          highlight={report.summary.pendingValidationsTotal > 0}
        />
        <KpiCard label="Cohortă activă" value={getActiveCohort().label.split('—')[0].trim()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="sm">
          <h2 className="text-sm font-semibold text-corporate-dark mb-3">Status cohortă</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(statusCounts) as [keyof typeof statusCounts, number][]).map(([key, count]) =>
              count > 0 ? (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                >
                  {getTraineeStatusLabel(key)}: <strong>{count}</strong>
                </span>
              ) : null,
            )}
            {!report.trainees.some((r) => getTraineeStatus(r) !== 'not_started') && (
              <span className="text-xs text-corporate-muted">Nicio activitate încă</span>
            )}
          </div>
        </Card>
        <ProgressCohortChart weekRates={weekRates} cohortAverage={cohortAverage} />
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-corporate-dark">Export rapoarte HR</h2>
            <p className="text-sm text-corporate-muted mt-1">
              {report.summary.fullyCompleted} finalizați · {report.summary.certificatesIssued} certificate
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => downloadWeeklyHrReport(report)}>
              Raport săptămânal
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={() => downloadCsv(report)}>
              CSV
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={handleXlsx} disabled={xlsxLoading}>
              {xlsxLoading ? 'Excel…' : 'Excel (.xlsx)'}
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={() => printHrReport(report)}>
              PDF / Print
            </Button>
          </div>
        </div>
      </Card>

      <MentorWorkloadBoard items={mentorWorkload} />

      <TraineeTable
        rows={report.trainees}
        search={search}
        statusFilter={statusFilter}
        sortKey={sortKey}
        sortAsc={sortAsc}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onSortSelect={handleSortSelect}
      />

      <AuditLogViewer entries={auditEntries} onExport={() => downloadAuditCsv(auditEntries)} />

      <CloudSyncPanel />

      <DataBackupPanel onRestored={() => setRefreshKey((k) => k + 1)} />

      <AdminOnboardingGuide />

      <OrgSettingsForm />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card padding="sm">
      <p className="text-xs text-corporate-muted uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-1 capitalize ${highlight ? 'text-amber-600' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-amber-600 mt-1">{sub}</p>}
    </Card>
  );
}
