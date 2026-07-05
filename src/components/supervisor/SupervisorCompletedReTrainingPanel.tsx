import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { ReTrainingLessonView } from '@/components/retraining/ReTrainingLessonView';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { getSupervisorCompletedReTrainingSessions } from '@/lib/supervisorReTraining';
import { traineePlanPath, ingineriPath } from '@/data/departments';
import { formatEvaluationShortDate } from '@/lib/evaluationDisplay';
import { hrPerformanceStore, ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import { getReTrainingLessonProgress } from '@/lib/reTrainingLessonProgress';
import { isReTrainingLessonReadOnly } from '@/lib/reTrainingAccess';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { getErrorsForSession } from '@/lib/errorReTrainingDisplay';
import { RE_TRAINING_FLOW_SHELL_SUCCESS } from '@/lib/reTrainingTheme';

function RowChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={[
        'inline-flex h-7 w-7 items-center justify-center rounded-md border border-corporate-border/70 text-corporate-stone transition-transform',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function SupervisorCompletedReTrainingPanel() {
  const { user } = useAuth();
  const { users } = useUsers();
  const version = useTrainingSystemVersion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completed = useMemo(
    () => (user ? getSupervisorCompletedReTrainingSessions(user.id) : []),
    [user, version],
  );

  if (!user || completed.length === 0) return null;

  const resolveName = (angajatId: string) => {
    const p = hrPerformanceStore.getProfile(angajatId);
    if (p) return `${p.prenume} ${p.nume}`.trim();
    return users.find((u) => u.id === angajatId)?.name ?? angajatId;
  };

  return (
    <Card className={RE_TRAINING_FLOW_SHELL_SUCCESS}>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">
        Re-instruiri finalizate — arhivă supervizor
      </h2>
      <p className="text-sm text-corporate-muted mb-4">
        Apăsați pe rând pentru a vedea lecția completă, erorile remediate și raportul mentorului — totul
        rămâne în panoul supervizor, ca la evaluările finalizate.
      </p>

      <ul className="space-y-2">
        {completed.map((session) => {
          const live = trainingSystemStore.getSessionById(session.id) ?? session;
          const finalizedDate = live.finalizatLa
            ? formatEvaluationShortDate(live.finalizatLa.slice(0, 10))
            : '—';
          const expanded = expandedId === session.id;
          const topic = live.topicTitle ?? live.titlu;
          const progress = getReTrainingLessonProgress(live);
          const errors = getErrorsForSession(live);
          const trainerName =
            users.find((u) => u.id === (live.trainerId ?? live.mentorId))?.name ?? '—';

          return (
            <li key={session.id} className="rounded-lg border border-corporate-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : session.id)}
                aria-expanded={expanded}
                className={[
                  'flex w-full flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                  expanded ? 'bg-orange-50/60' : 'hover:bg-corporate-surface',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <p className="font-medium text-corporate-dark">
                    {resolveName(live.angajatId)}
                    <span className="text-corporate-muted font-normal ml-2">{topic}</span>
                  </p>
                  <p className="text-xs text-corporate-muted mt-0.5">
                    Finalizată {finalizedDate}
                    {errors.length > 0 &&
                      ` · ${errors.length} ${errors.length === 1 ? 'eroare remediată' : 'erori remediate'}`}
                    {trainerName !== '—' && ` · Trainer: ${trainerName}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="success">Instruire de succes ✓</Badge>
                  <span className="text-xs text-corporate-muted tabular-nums">{progress.percent}%</span>
                  <RowChevron expanded={expanded} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-corporate-border px-3 py-4 space-y-5 bg-white">
                  <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-3 space-y-3">
                    <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
                      Re-instruire finalizată — rezumat
                    </p>
                    <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="text-xs text-corporate-muted">Angajat</dt>
                        <dd className="font-medium text-corporate-dark">{resolveName(live.angajatId)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-corporate-muted">Temă lecție</dt>
                        <dd className="font-medium text-corporate-dark">{topic}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-corporate-muted">Trainer / mentor</dt>
                        <dd className="font-medium text-corporate-dark">{trainerName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-corporate-muted">Motiv</dt>
                        <dd className="font-medium text-corporate-dark">
                          {ERROR_MOTIV_LABELS[live.errorMotiv]}
                        </dd>
                      </div>
                    </dl>
                    <ProgressBar percent={progress.percent} size="sm" label="Progres lecție" />
                    {live.trainerReport?.text && (
                      <p className="text-sm text-corporate-muted">
                        <span className="font-medium text-corporate-dark">Raport mentor:</span>{' '}
                        {live.trainerReport.text}
                      </p>
                    )}
                  </div>

                  {errors.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                      <p className="text-sm font-semibold text-amber-900">Erori remediate</p>
                      <ul className="space-y-2 text-sm text-amber-900/90">
                        {errors.map((e) => (
                          <li key={e.id} className="border-b border-amber-100/80 pb-2 last:border-0 last:pb-0">
                            <p className="font-medium">{ERROR_MOTIV_LABELS[e.motiv]}</p>
                            {e.descriere && (
                              <p className="text-xs text-amber-800/90 mt-0.5">{e.descriere}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-lg border border-corporate-border bg-corporate-surface/30 p-3">
                    <p className="text-sm font-semibold text-corporate-dark mb-3">
                      Lecție de re-instruire — conținut complet
                    </p>
                    <ReTrainingLessonView
                      session={live}
                      readOnly={isReTrainingLessonReadOnly(live, user)}
                      embedded
                      hideHeader
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link to={traineePlanPath(live.angajatId, { retrain: live.id })}>
                      <Button type="button" variant="primary" size="sm">
                        Plan instruire angajat →
                      </Button>
                    </Link>
                    <Link to={ingineriPath(`/angajat/${live.angajatId}`)}>
                      <Button type="button" variant="secondary" size="sm">
                        Deschide fișa angajat →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
