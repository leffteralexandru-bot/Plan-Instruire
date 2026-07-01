import { useMemo } from 'react';
import { STAGIARI } from '@/data/users';
import { storage } from '@/store/storage';
import { buildTraineeHrReport, getPendingMentorValidations } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { ingineriPath } from '@/data/departments';

interface MentorCohortDashboardProps {
  onSelectTrainee?: (traineeId: string) => void;
}

export function MentorCohortDashboard({ onSelectTrainee }: MentorCohortDashboardProps) {
  const rows = useMemo(
    () => STAGIARI.map((t) => buildTraineeHrReport(t, storage.getProgress(t.id))),
    [],
  );

  const pendingTotal = rows.reduce((n, r) => n + r.pendingMentorValidations.length, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Vedere cohortă — toți stagiarii</h2>
          <p className="text-sm text-corporate-muted">
            {STAGIARI.length} stagiari · {pendingTotal} validări în așteptare
          </p>
        </div>
        <Link to={ingineriPath('/admin')} className="text-xs text-corporate-accent-blue hover:underline">
          Raport HR complet →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGIARI.map((t) => {
          const row = rows.find((r) => r.userId === t.id)!;
          const status = getTraineeStatus(row);
          const pending = getPendingMentorValidations(storage.getProgress(t.id));
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTrainee?.(t.id)}
              className="rounded-xl border border-slate-200 p-3 text-left hover:border-corporate-gold hover:bg-corporate-gold-light/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-corporate-dark">{t.name}</p>
                <Badge variant={status === 'completed' ? 'success' : status === 'behind' ? 'warning' : 'info'}>
                  {getTraineeStatusLabel(status)}
                </Badge>
              </div>
              <p className="text-xs text-corporate-muted mt-1">
                {row.completedDays}/{row.totalDays} zile ({row.progressPercent}%)
              </p>
              {pending.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">Validare: Z{pending.join(', Z')}</p>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
