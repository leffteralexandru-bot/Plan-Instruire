import { useMemo, useState } from 'react';
import { storage } from '@/store/storage';
import { buildTraineeHrReport, getPendingMentorValidations } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { ingineriPath } from '@/data/departments';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { TraineeCohortExpandPanel } from '@/components/mentor/TraineeCohortExpandPanel';

function RowChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={[
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-corporate-border/70 bg-white/90 text-corporate-stone shadow-sm transition-transform duration-200',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function MentorCohortDashboard() {
  const { visibleTrainees } = useUsers();
  const { canAccessAdmin } = useAuth();
  const { profiles } = useHrPerformance();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [listRefresh, setListRefresh] = useState(0);

  const rows = useMemo(
    () => visibleTrainees.map((t) => buildTraineeHrReport(t, storage.getProgress(t.id))),
    [visibleTrainees, listRefresh],
  );

  const profileByUserId = useMemo(
    () => new Map(profiles.map((p) => [p.userId, p])),
    [profiles],
  );

  const pendingTotal = rows.reduce((n, r) => n + r.pendingMentorValidations.length, 0);

  const toggleExpanded = (traineeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(traineeId)) next.delete(traineeId);
      else next.add(traineeId);
      return next;
    });
  };

  return (
    <ProfessionalPanel
      variant="training"
      icon="mentor"
      eyebrow="Cohortă instruire"
      title={canAccessAdmin ? 'Vedere grupă — toți angajații' : 'Angajații mei în instruire'}
      subtitle={`${visibleTrainees.length} angajat(i) · ${pendingTotal} validări în așteptare · apăsați pe rând pentru detalii`}
      badge={
        pendingTotal > 0 ? (
          <Badge variant="warning">{pendingTotal} validări</Badge>
        ) : (
          <Badge variant="success">La zi</Badge>
        )
      }
      headerAction={
        canAccessAdmin ? (
          <Link
            to={ingineriPath('/admin')}
            className="text-xs font-medium text-corporate-gold hover:underline"
          >
            Raport HR →
          </Link>
        ) : undefined
      }
    >
      <ul className="space-y-2">
        {visibleTrainees.map((t) => {
          const row = rows.find((r) => r.userId === t.id)!;
          const profile = profileByUserId.get(t.id);
          const status = getTraineeStatus(row);
          const pending = getPendingMentorValidations(storage.getProgress(t.id));
          const functie = profile?.functie ?? t.email;
          const expanded = expandedIds.has(t.id);

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => toggleExpanded(t.id)}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? `Restrânge progresul pentru ${t.name}`
                    : `Deschide progresul pentru ${t.name}`
                }
                className={[
                  'flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors',
                  expanded
                    ? 'border-corporate-gold/50 bg-corporate-gold-light/15'
                    : 'border-corporate-border hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <strong className="text-corporate-dark">{t.name}</strong>
                  <span className="text-corporate-muted ml-2">{functie}</span>
                  <p className="text-xs text-corporate-muted mt-1">
                    {row.completedDays}/{row.totalDays} zile · {row.progressPercent}% complet
                  </p>
                  {pending.length > 0 && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Validare mentor: Z{pending.join(', Z')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      status === 'completed' ? 'success' : status === 'behind' ? 'warning' : 'info'
                    }
                  >
                    {getTraineeStatusLabel(status)}
                  </Badge>
                  <RowChevron expanded={expanded} />
                </div>
              </button>
              {expanded && (
                <TraineeCohortExpandPanel
                  traineeId={t.id}
                  onProgressChange={() => setListRefresh((k) => k + 1)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </ProfessionalPanel>
  );
}
