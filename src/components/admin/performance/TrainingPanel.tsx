import { useMemo, useState } from 'react';
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
} from '@/lib/hrAnalytics';
import { downloadAuditCsv, downloadCsv, downloadXlsx, printHrReport } from '@/lib/exportReport';
import { getActiveCohort } from '@/data/cohorts';
import { ProgressCohortChart, TraineeTable } from '@/components/admin/HrAnalyticsPanels';
import { AuditLogViewer, MentorWorkloadBoard } from '@/components/admin/AuditAndWorkload';
import { downloadWeeklyHrReport } from '@/lib/weeklyReport';
import { useUsers } from '@/context/UsersContext';

export function TrainingPanel() {
  const { visibleTrainees } = useUsers();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'name' | 'progress' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const settings = storage.getSettings();
  const getProgress = (userId: string) => storage.getProgress(userId);

  const report = useMemo(
    () => buildHrAggregateReport(visibleTrainees, getProgress, settings.programVersion),
    [visibleTrainees, settings.programVersion],
  );

  const statusCounts = useMemo(() => countByStatus(report.trainees), [report.trainees]);
  const weekRates = useMemo(() => getWeekCompletionRates(visibleTrainees, getProgress), [visibleTrainees]);
  const cohortAverage = useMemo(() => getCohortProgressAverage(report.trainees), [report.trainees]);
  const auditEntries = useMemo(() => aggregateAuditLog(visibleTrainees, getProgress, 30), [visibleTrainees]);
  const mentorWorkload = useMemo(() => getMentorWorkload(visibleTrainees, getProgress), [visibleTrainees]);

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
        <KpiCard label="Medie grupă" value={`${cohortAverage}%`} />
        <KpiCard
          label="Validări în așteptare"
          value={String(report.summary.pendingValidationsTotal)}
          highlight={report.summary.pendingValidationsTotal > 0}
        />
        <KpiCard label="Grupă activă" value={getActiveCohort().label.split('—')[0].trim()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="sm">
          <h2 className="text-sm font-semibold text-corporate-dark mb-3">Status grupă</h2>
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
          </div>
        </Card>
        <ProgressCohortChart weekRates={weekRates} cohortAverage={cohortAverage} />
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-corporate-dark">Export rapoarte instruire</h2>
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
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card padding="sm">
      <p className="text-xs text-corporate-muted uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-amber-600' : ''}`}>{value}</p>
    </Card>
  );
}
