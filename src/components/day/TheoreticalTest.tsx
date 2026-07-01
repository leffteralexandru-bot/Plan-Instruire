import { useState } from 'react';
import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import { useProgress } from '@/hooks/useProgress';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TheoreticalTestProps {
  readOnly?: boolean;
}

export function TheoreticalTest({ readOnly }: TheoreticalTestProps) {
  const { getDayProgress, saveQuizResult } = useProgress();
  const existing = getDayProgress(THEORETICAL_TEST.dayId).quizResult;

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const attempts = existing?.attempts ?? 0;
  const passed = existing?.passed ?? false;
  const canAttempt = !readOnly && !passed && attempts < THEORETICAL_TEST.maxAttempts;

  const handleSubmit = () => {
    const total = THEORETICAL_TEST.questions.length;
    let score = 0;
    THEORETICAL_TEST.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) score++;
    });
    const percent = Math.round((score / total) * 100);
    const didPass = percent >= THEORETICAL_TEST.passPercent;

    saveQuizResult(
      THEORETICAL_TEST.dayId,
      {
        score,
        total,
        passed: didPass,
        completedAt: new Date().toISOString(),
        attempts: attempts + 1,
      },
      THEORETICAL_TEST.autoTaskId,
    );

    setLastScore(score);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSubmitted(false);
    setAnswers({});
    setLastScore(null);
  };

  if (passed && existing) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-emerald-800">Test Teoretic — Promovat</h2>
            <p className="text-sm text-emerald-700 mt-1">
              Scor: {existing.score}/{existing.total} ({Math.round((existing.score / existing.total) * 100)}%)
              · Încercare {existing.attempts}/{THEORETICAL_TEST.maxAttempts}
            </p>
          </div>
          <Badge variant="success">Admis</Badge>
        </div>
      </Card>
    );
  }

  if (!canAttempt && !passed) {
    return (
      <Card className="border-red-200 bg-red-50/40">
        <h2 className="text-lg font-semibold text-red-800">Test Teoretic — Nepromovat</h2>
        <p className="text-sm text-red-700 mt-1">
          Ați epuizat cele {THEORETICAL_TEST.maxAttempts} încercări. Contactați mentorul pentru reluare.
        </p>
        {existing && (
          <p className="text-sm text-slate-600 mt-2">
            Ultimul scor: {existing.score}/{existing.total}
          </p>
        )}
      </Card>
    );
  }

  if (readOnly) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark">Test Teoretic</h2>
        <p className="text-sm text-corporate-muted mt-1">
          {existing
            ? `Stagiarul: ${existing.score}/${existing.total} — ${existing.passed ? 'promovat' : 'nepromovat'}`
            : 'Stagiarul nu a completat încă testul.'}
        </p>
      </Card>
    );
  }

  const allAnswered = THEORETICAL_TEST.questions.every((q) => answers[q.id] !== undefined);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Test Teoretic</h2>
          <p className="text-sm text-corporate-muted mt-1">
            {THEORETICAL_TEST.questions.length} întrebări · Promovare: min. {THEORETICAL_TEST.passPercent}%
            · Încercare {attempts + 1}/{THEORETICAL_TEST.maxAttempts}
          </p>
        </div>
        <Badge variant="warning">Obligatoriu</Badge>
      </div>

      {submitted && lastScore !== null && !passed && attempts < THEORETICAL_TEST.maxAttempts && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-2">
          <p>
            Scor {lastScore}/{THEORETICAL_TEST.questions.length} — nu ați atins {THEORETICAL_TEST.passPercent}%.
            {THEORETICAL_TEST.maxAttempts - attempts > 0
              ? ` Mai aveți ${THEORETICAL_TEST.maxAttempts - attempts} încercări.`
              : ''}
          </p>
          <Button variant="ghost" size="sm" onClick={handleRetry}>
            Reîncearcă testul
          </Button>
        </div>
      )}

      <ol className="space-y-5">
        {THEORETICAL_TEST.questions.map((q, idx) => (
          <li key={q.id} className="space-y-2">
            <p className="text-sm font-medium text-corporate-dark">
              {idx + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, optIdx) => (
                <label
                  key={opt}
                  className={[
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                    answers[q.id] === optIdx
                      ? 'border-corporate-gold bg-corporate-gold-light/50'
                      : 'border-slate-100 hover:border-slate-200',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === optIdx}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                    className="text-corporate-accent-blue"
                  />
                  {opt}
                </label>
              ))}
            </div>
            {submitted && answers[q.id] !== q.correctIndex && q.explanation && (
              <p className="text-xs text-slate-500 pl-1">{q.explanation}</p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <Button onClick={handleSubmit} disabled={!allAnswered} variant="secondary">
          Trimite testul
        </Button>
      </div>
    </Card>
  );
}
