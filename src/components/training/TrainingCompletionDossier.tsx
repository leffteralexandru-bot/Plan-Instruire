import { ALL_DAYS } from '@/data/trainingPlan';
import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import { FeedbackSummary } from '@/components/mentor/FeedbackForm';
import { TheoreticalTestReview } from '@/components/mentor/TheoreticalTestReview';
import { Badge } from '@/components/ui/Badge';
import { CERTIFICATE_DURATION } from '@/lib/certificateContent';
import { storage } from '@/store/storage';

interface TrainingCompletionDossierProps {
  angajatId: string;
}

function formatRoDateTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countCorrectAnswers(quiz: { answers?: Record<string, number> }): number | null {
  if (!quiz.answers || Object.keys(quiz.answers).length === 0) return null;
  return THEORETICAL_TEST.questions.filter((q) => quiz.answers![q.id] === q.correctIndex).length;
}

/** Anexe la certificatul de finalizare — doar planul de instruire la angajare (4 săpt.) */
export function TrainingCompletionDossier({ angajatId }: TrainingCompletionDossierProps) {
  const progress = storage.getProgress(angajatId);
  const validationDays = ALL_DAYS.filter((d) => d.requiresMentorValidation);
  const quiz = progress.days[THEORETICAL_TEST.dayId]?.quizResult;
  const feedbackS2 = progress.feedbacks.find((f) => f.weekNumber === 2);
  const feedbackS4 = progress.feedbacks.find((f) => f.weekNumber === 4);
  const correctCount = quiz ? countCorrectAnswers(quiz) : null;

  return (
    <div className="mt-6 space-y-5 border-t border-corporate-border pt-5">
      <div>
        <h3 className="text-sm font-semibold text-corporate-dark">
          Anexe — Plan de instruire la angajare
        </h3>
        <p className="text-xs text-corporate-muted mt-0.5">
          {CERTIFICATE_DURATION} · validări mentor, feedback și test teoretic din programul inițial
        </p>
      </div>

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
          Validări mentor — zile cheie
        </h4>
        <div className="space-y-2">
          {validationDays.map((day) => {
            const dp = progress.days[day.id] ?? { completedTasks: [], mentorValidated: false };
            const tasksDone = day.tasks.every((t) => dp.completedTasks.includes(t.id));
            const dayQuiz = day.id === THEORETICAL_TEST.dayId ? dp.quizResult : undefined;
            const statusLabel = dp.mentorValidated
              ? 'Validat'
              : tasksDone
                ? 'Așteaptă validare mentor'
                : 'Activități incomplete';
            const statusVariant = dp.mentorValidated ? 'success' : tasksDone ? 'warning' : 'locked';

            return (
              <div
                key={day.id}
                className={[
                  'rounded-lg border px-3 py-2 text-sm',
                  dp.mentorValidated ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/50',
                ].join(' ')}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-corporate-dark">
                    Ziua {day.dayNumber} — {day.title}
                  </span>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
                {day.mentorValidationLabel && (
                  <p className="text-xs text-corporate-muted mt-0.5">{day.mentorValidationLabel}</p>
                )}
                {dayQuiz && (
                  <p className="text-xs mt-1">
                    Scor test teoretic:{' '}
                    <span className={dayQuiz.passed ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                      {dayQuiz.score}/{dayQuiz.total} ({Math.round((dayQuiz.score / dayQuiz.total) * 100)}%)
                      {dayQuiz.passed ? ' — Promovat' : ' — Nepromovat'}
                    </span>
                  </p>
                )}
                {day.id === THEORETICAL_TEST.dayId && !dayQuiz && (
                  <p className="text-xs text-amber-700 mt-1">
                    Testul teoretic nu a fost încă completat de angajat.
                  </p>
                )}
                {dp.mentorValidatedAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Validat la: {formatRoDateTime(dp.mentorValidatedAt)}
                  </p>
                )}
                {dp.mentorNotes ? (
                  <p className="text-xs text-corporate-stone mt-2 bg-white/70 rounded p-2">
                    <strong>Evaluare mentor:</strong> {dp.mentorNotes}
                  </p>
                ) : dp.mentorValidated ? (
                  <p className="text-xs text-corporate-muted mt-1 italic">Fără note suplimentare.</p>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-corporate-muted">
          „Așteaptă validare mentor” înseamnă că activitățile sunt făcute, dar mentorul nu a confirmat încă ziua.
        </p>
      </section>

      {(feedbackS2 || feedbackS4) && (
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
            Evaluări mentor — feedback instruire
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {feedbackS2 && (
              <div className="rounded-lg border border-corporate-border p-3">
                <p className="text-xs font-medium text-corporate-dark mb-2">Săptămâna II</p>
                <FeedbackSummary feedback={feedbackS2} />
              </div>
            )}
            {feedbackS4 && (
              <div className="rounded-lg border border-corporate-border p-3">
                <p className="text-xs font-medium text-corporate-dark mb-2">Săptămâna IV</p>
                <FeedbackSummary feedback={feedbackS4} />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
          Test teoretic — Ziua 10
        </h4>
        {quiz ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50/30 p-3">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="text-center rounded-xl bg-white border border-sky-100 px-4 py-2">
                <p className="text-2xl font-bold text-corporate-dark">
                  {quiz.score}/{quiz.total}
                </p>
                <p className="text-[10px] text-corporate-muted uppercase">Puncte acumulate</p>
              </div>
              <div className="text-center rounded-xl bg-white border border-sky-100 px-4 py-2">
                <p className="text-2xl font-bold text-corporate-dark">
                  {Math.round((quiz.score / quiz.total) * 100)}%
                </p>
                <p className="text-[10px] text-corporate-muted uppercase">Procent</p>
              </div>
              {correctCount !== null && (
                <div className="text-center rounded-xl bg-white border border-sky-100 px-4 py-2">
                  <p className="text-2xl font-bold text-emerald-700">{correctCount}</p>
                  <p className="text-[10px] text-corporate-muted uppercase">Răspunsuri corecte</p>
                </div>
              )}
              <Badge variant={quiz.passed ? 'success' : 'warning'}>
                {quiz.passed ? 'Promovat' : 'Nepromovat'}
              </Badge>
            </div>
            <p className="text-xs text-corporate-muted mb-2">
              Prag promovare: {THEORETICAL_TEST.passPercent}% · Încercare {quiz.attempts}/
              {THEORETICAL_TEST.maxAttempts} · {formatRoDateTime(quiz.completedAt)}
            </p>
            <TheoreticalTestReview quizResult={quiz} title="Detaliu răspunsuri test teoretic" />
          </div>
        ) : (
          <p className="text-sm text-corporate-muted">Testul teoretic nu a fost completat.</p>
        )}
      </section>
    </div>
  );
}
