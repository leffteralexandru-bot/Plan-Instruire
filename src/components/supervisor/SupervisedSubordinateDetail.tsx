import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { ReTrainingLessonView } from '@/components/retraining/ReTrainingLessonView';
import { EmployeeEvaluationHistory } from '@/components/angajat/EmployeeEvaluationHistory';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { getAngajatTrainingReport, isTrainingPlanComplete } from '@/lib/hrReport';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { sortReTrainingSessionsNewestFirst } from '@/lib/errorReTrainingDisplay';
import { EvaluationStagesFlow } from '@/components/evaluation/EvaluationStagesFlow';
import { getActiveStage } from '@/lib/evaluationStages';
import { isSupervisorOf } from '@/lib/supervisor';
import { evaluationsLink } from '@/lib/actionFocus';
import { ingineriPath } from '@/data/departments';
import { ViewAsEmployeeBar } from '@/components/shared/ViewAsEmployeeBar';
import { hrPerformanceStore, EVALUATION_STATUS_LABELS, ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import { getReTrainingLessonProgress } from '@/lib/reTrainingLessonProgress';
import { isReTrainingLessonReadOnly } from '@/lib/reTrainingAccess';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { formatEvaluationShortDate } from '@/lib/evaluationDisplay';
import { RE_TRAINING_FLOW_SHELL } from '@/lib/reTrainingTheme';
import type { SubordinateRow } from '@/lib/roleDashboard';

interface SupervisedSubordinateDetailProps {
  row: SubordinateRow;
}

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

export function SupervisedSubordinateDetail({ row }: SupervisedSubordinateDetailProps) {
  const { user } = useAuth();
  const { users } = useUsers();
  const { evaluations, downloadDocument, refresh } = useHrPerformance();
  const trainingVersion = useTrainingSystemVersion();
  const [expandedRetrainId, setExpandedRetrainId] = useState<string | null>(null);

  const profile = hrPerformanceStore.getProfile(row.userId);
  const trainingReport = getAngajatTrainingReport(row.userId);
  const trainingFinished = trainingReport ? isTrainingPlanComplete(trainingReport) : false;
  const currentEval = hrPerformanceStore.getCurrentEvaluation(row.userId);
  const employeeEvals = evaluations.filter((e) => e.angajatId === row.userId);

  const activeEvalStage = currentEval ? getActiveStage(currentEval) : undefined;
  const showSupervisorEvalForm =
    !!user &&
    !!currentEval &&
    currentEval.status !== 'evaluat' &&
    isSupervisorOf(user.id, row.userId) &&
    activeEvalStage?.id === 'evaluare_mentor';

  const retrainingSessions = useMemo(
    () =>
      sortReTrainingSessionsNewestFirst(
        trainingSystemStore.getReTrainingSessions({ angajatId: row.userId }),
      ),
    [row.userId, trainingVersion],
  );

  return (
    <div className="border-t border-corporate-border px-3 py-4 space-y-5 bg-white">
      <div className="rounded-lg border border-corporate-border bg-corporate-surface/30 p-3 space-y-3">
        <p className="text-xs font-semibold text-corporate-dark uppercase tracking-wide">
          Dosar angajat — {row.name}
        </p>
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-corporate-muted">Funcție</dt>
            <dd className="font-medium text-corporate-dark">{row.functie}</dd>
          </div>
          {profile?.departamentId && (
            <div>
              <dt className="text-xs text-corporate-muted">Departament</dt>
              <dd className="font-medium text-corporate-dark">{profile.departamentId}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-corporate-muted">Evaluare tri-lunară</dt>
            <dd className="font-medium text-corporate-dark">
              {currentEval
                ? `${EVALUATION_STATUS_LABELS[currentEval.status]} · ${getEvaluationWorkflowLabel(currentEval)}`
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-3 space-y-2">
        <p className="text-sm font-semibold text-corporate-dark">Instruire inițială · 4 săptămâni</p>
        {!trainingReport ? (
          <p className="text-sm text-corporate-muted italic">Nicio înscriere în plan.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-corporate-dark">
                {trainingReport.completedDays}/{trainingReport.totalDays} zile
              </span>
              <Badge variant={trainingFinished ? 'success' : 'default'}>
                {trainingFinished ? 'Finalizată' : 'În curs'}
              </Badge>
            </div>
            <ProgressBar percent={trainingReport.progressPercent} size="sm" label="Completare totală" />
          </>
        )}
      </div>

      {retrainingSessions.length > 0 && (
        <div className={`rounded-lg border p-3 space-y-2 ${RE_TRAINING_FLOW_SHELL}`}>
          <p className="text-sm font-semibold text-corporate-dark">Re-instruiri</p>
          <ul className="space-y-2">
            {retrainingSessions.map((session) => {
              const live = trainingSystemStore.getSessionById(session.id) ?? session;
              const isFinalized = normalizeReTrainingStatus(live.status) === 'finalizat';
              const subExpanded = expandedRetrainId === session.id;
              const topic = live.topicTitle ?? live.titlu;
              const progress = getReTrainingLessonProgress(live);
              const trainerName =
                users.find((u) => u.id === (live.trainerId ?? live.mentorId))?.name ?? '—';
              const finalizedDate = live.finalizatLa
                ? formatEvaluationShortDate(live.finalizatLa.slice(0, 10))
                : undefined;

              return (
                <li
                  key={session.id}
                  className="rounded-lg border border-corporate-border overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedRetrainId(subExpanded ? null : session.id)}
                    aria-expanded={subExpanded}
                    className={[
                      'flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors',
                      subExpanded ? 'bg-orange-50/60' : 'hover:bg-corporate-surface',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-corporate-dark">{topic}</p>
                      <p className="text-xs text-corporate-muted mt-0.5">
                        {isFinalized && finalizedDate ? `Finalizată ${finalizedDate}` : 'În curs'}
                        {` · Mentor: ${trainerName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={isFinalized ? 'success' : 'warning'}>
                        {isFinalized ? 'Finalizat' : 'În curs'}
                      </Badge>
                      <span className="text-xs text-corporate-muted tabular-nums">{progress.percent}%</span>
                      <RowChevron expanded={subExpanded} />
                    </div>
                  </button>

                  {subExpanded && user && (
                    <div className="border-t border-corporate-border px-3 py-3 bg-white space-y-3">
                      <p className="text-xs text-corporate-muted">
                        Motiv: {ERROR_MOTIV_LABELS[live.errorMotiv]}
                      </p>
                      {live.trainerReport?.text && (
                        <p className="text-sm text-corporate-muted">
                          <span className="font-medium text-corporate-dark">Raport mentor:</span>{' '}
                          {live.trainerReport.text}
                        </p>
                      )}
                      <ReTrainingLessonView
                        session={live}
                        readOnly={isReTrainingLessonReadOnly(live, user)}
                        embedded
                        hideHeader
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showSupervisorEvalForm && user && currentEval && (
        <div className="rounded-lg border border-corporate-gold/50 bg-corporate-gold-light/20 p-3">
          <p className="text-sm font-semibold text-corporate-dark mb-3">
            Evaluare supervizor — de completat acum
          </p>
          <EvaluationStagesFlow
            cycle={currentEval}
            mode="evaluator"
            actorId={user.id}
            actorName={user.name}
            onDownloadDocument={(id) => void downloadDocument(id)}
            onUpdated={refresh}
          />
        </div>
      )}

      {employeeEvals.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-corporate-dark">Istoric evaluări</p>
          <EmployeeEvaluationHistory
            cycles={employeeEvals}
            nextEvaluationDate={
              currentEval && currentEval.status !== 'evaluat'
                ? currentEval.termenReevaluare
                : undefined
            }
          />
        </div>
      )}

      <ViewAsEmployeeBar angajatId={row.userId} angajatName={row.name} />

      <div className="flex flex-wrap gap-2 pt-1 border-t border-corporate-border/60">
        <Link to={ingineriPath(`/angajat/${row.userId}`)}>
          <Button type="button" variant="secondary" size="sm">
            Dosar 360° →
          </Button>
        </Link>
        <Link to={evaluationsLink({ angajatId: row.userId, evalId: currentEval?.id })}>
          <Button type="button" variant="ghost" size="sm">
            Evaluări →
          </Button>
        </Link>
      </div>
    </div>
  );
}

export { RowChevron };
