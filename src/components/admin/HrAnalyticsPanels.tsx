import type { TraineeHrReport } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import { CertificateTableCell } from '@/components/certificate/CertificateTableCell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ProgressCohortChartProps {
  weekRates: { week: number; label: string; percent: number }[];
  cohortAverage: number;
}

export function ProgressCohortChart({ weekRates, cohortAverage }: ProgressCohortChartProps) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Progres grupă</h2>
          <p className="text-sm text-corporate-muted">Media generală: {cohortAverage}%</p>
        </div>
      </div>
      <div className="space-y-3">
        {weekRates.map((w) => (
          <div key={w.week}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">{w.label}</span>
              <span className="text-corporate-muted">{w.percent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-corporate-gold transition-all"
                style={{ width: `${w.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const STATUS_BADGE: Record<
  ReturnType<typeof getTraineeStatus>,
  'success' | 'info' | 'warning' | 'default'
> = {
  completed: 'success',
  on_track: 'info',
  at_risk: 'warning',
  behind: 'warning',
  not_started: 'default',
};

interface TraineeTableProps {
  rows: TraineeHrReport[];
  search: string;
  statusFilter: string;
  sortKey: 'name' | 'progress' | 'status';
  sortAsc: boolean;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onSortSelect: (value: string) => void;
}

export function TraineeTable({
  rows,
  search,
  statusFilter,
  sortKey,
  sortAsc,
  onSearchChange,
  onStatusFilterChange,
  onSortSelect,
}: TraineeTableProps) {
  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const status = getTraineeStatus(r);
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name, 'ro');
      if (sortKey === 'progress') return dir * (a.progressPercent - b.progressPercent);
      const sa = getTraineeStatusLabel(getTraineeStatus(a));
      const sb = getTraineeStatusLabel(getTraineeStatus(b));
      return dir * sa.localeCompare(sb, 'ro');
    });

  return (
    <Card>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Caută stagiar..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[180px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">Toate statusurile</option>
          <option value="completed">Finalizat</option>
          <option value="on_track">La zi</option>
          <option value="at_risk">Risc moderat</option>
          <option value="behind">Întârziat</option>
          <option value="not_started">Neînceput</option>
        </select>
        <select
          value={`${sortKey}-${sortAsc ? 'asc' : 'desc'}`}
          onChange={(e) => onSortSelect(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="name-asc">Nume A→Z</option>
          <option value="name-desc">Nume Z→A</option>
          <option value="progress-desc">Progres ↓</option>
          <option value="progress-asc">Progres ↑</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-corporate-muted">
              <th className="py-2 pr-3">Stagiar</th>
              <th className="py-2 pr-3">Progres</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Test Z10</th>
              <th className="py-2 pr-3">Mentor</th>
              <th className="py-2">Certificat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const status = getTraineeStatus(r);
              return (
                <tr key={r.userId} className="border-b border-slate-50">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-corporate-muted">{r.email}</p>
                  </td>
                  <td className="py-3 pr-3">
                    {r.completedDays}/{r.totalDays} ({r.progressPercent}%)
                  </td>
                  <td className="py-3 pr-3">
                    <Badge variant={STATUS_BADGE[status]}>{getTraineeStatusLabel(status)}</Badge>
                  </td>
                  <td className="py-3 pr-3 text-xs">{r.quizScoreLabel ?? '—'}</td>
                  <td className="py-3 pr-3 text-xs">
                    {r.pendingMentorValidations.length
                      ? `Z${r.pendingMentorValidations.join(', Z')}`
                      : 'La zi'}
                  </td>
                  <td className="py-3">
                    <CertificateTableCell userId={r.userId} issued={r.certificateIssued} />
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-corporate-muted">
                  Niciun rezultat pentru filtrele selectate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
