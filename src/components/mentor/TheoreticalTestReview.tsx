import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import type { QuizResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface TheoreticalTestReviewProps {
  quizResult: QuizResult;
  /** Titlu secțiune — implicit pentru mentor */
  title?: string;
}

export function TheoreticalTestReview({
  quizResult,
  title = 'Detaliu test teoretic — răspunsuri angajat vs. corect',
}: TheoreticalTestReviewProps) {
  const answers = quizResult.answers;
  const hasAnswers = answers && Object.keys(answers).length > 0;

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-corporate-dark">{title}</h4>
        <Badge variant={quizResult.passed ? 'success' : 'warning'}>
          {quizResult.score}/{quizResult.total}
          {quizResult.passed ? ' — Promovat' : ' — Nepromovat'}
        </Badge>
      </div>

      {!hasAnswers && (
        <p className="text-xs text-amber-700 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          Detaliul pe întrebări nu este disponibil (test trimis înainte de această funcție). Doar scorul
          agregat este înregistrat.
        </p>
      )}

      {hasAnswers && (
        <div className="flex flex-wrap gap-3 text-[11px] text-corporate-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            Răspuns corect
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
            Ales greșit de angajat
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600" aria-hidden />
            Ales corect de angajat
          </span>
        </div>
      )}

      <ol className="space-y-4">
        {THEORETICAL_TEST.questions.map((q, idx) => {
          const selected = answers?.[q.id];
          const correct = q.correctIndex;
          const answered = selected !== undefined;
          const isCorrect = answered && selected === correct;

          return (
            <li
              key={q.id}
              className={[
                'rounded-xl border p-3',
                !answered
                  ? 'border-slate-200 bg-slate-50/50'
                  : isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-red-200 bg-red-50/30',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-corporate-dark">
                  {idx + 1}. {q.question}
                </p>
                {answered && (
                  <Badge variant={isCorrect ? 'success' : 'warning'}>
                    {isCorrect ? 'Corect' : 'Greșit'}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                {q.options.map((opt, optIdx) => {
                  const isCorrectOption = optIdx === correct;
                  const isSelected = selected === optIdx;

                  let rowClass =
                    'rounded-lg border px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2';
                  if (isCorrectOption && isSelected) {
                    rowClass += ' border-emerald-600 bg-emerald-100 text-emerald-950 font-medium';
                  } else if (isCorrectOption) {
                    rowClass += ' border-emerald-400 bg-emerald-50 text-emerald-900';
                  } else if (isSelected) {
                    rowClass += ' border-red-500 bg-red-100 text-red-900 font-medium';
                  } else {
                    rowClass += ' border-slate-100 bg-white text-slate-600';
                  }

                  return (
                    <div key={opt} className={rowClass}>
                      <span>{opt}</span>
                      <span className="text-[10px] uppercase tracking-wide shrink-0">
                        {isCorrectOption && isSelected && 'Ales · corect'}
                        {isCorrectOption && !isSelected && 'Răspuns corect'}
                        {!isCorrectOption && isSelected && 'Ales de angajat'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {answered && !isCorrect && (
                <p className="text-xs text-red-800 mt-2">
                  Angajatul a bifat: <strong>{q.options[selected]}</strong>
                  {' · '}
                  Corect era: <strong>{q.options[correct]}</strong>
                </p>
              )}

              {q.explanation && answered && !isCorrect && (
                <p className="text-xs text-slate-600 mt-1 pl-0.5">{q.explanation}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
