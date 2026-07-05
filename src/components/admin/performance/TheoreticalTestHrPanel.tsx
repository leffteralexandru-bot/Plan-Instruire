import { useState } from 'react';
import type { QuizResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TheoreticalTestReview } from '@/components/mentor/TheoreticalTestReview';
import { downloadTheoreticalTestPdf } from '@/lib/exportTheoreticalTestPdf';
import { THEORETICAL_TEST } from '@/data/theoreticalTest';

interface TheoreticalTestHrPanelProps {
  employeeName: string;
  quizResult?: QuizResult;
  /** Instruire închisă (certificat emis) — rezultatul rămâne arhivat, fără alertă activă */
  trainingClosed?: boolean;
}

export function TheoreticalTestHrPanel({
  employeeName,
  quizResult,
  trainingClosed = false,
}: TheoreticalTestHrPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  return (
    <Card className="border-sky-200 bg-sky-50/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold text-corporate-dark">Test Teoretic — Ziua 10</h2>
            {quizResult ? (
              <Badge variant={quizResult.passed ? 'success' : 'warning'}>
                {quizResult.score}/{quizResult.total}
                {quizResult.passed ? ' Promovat' : ' Nepromovat'}
              </Badge>
            ) : (
              <Badge variant="locked">Necompletat</Badge>
            )}
          </div>
          <p className="text-xs text-corporate-muted">
            {THEORETICAL_TEST.questions.length} întrebări · Prag promovare {THEORETICAL_TEST.passPercent}%
          </p>
          {quizResult && (
            <p className="text-xs text-slate-500 mt-1">
              Completat: {new Date(quizResult.completedAt).toLocaleString('ro-RO')}
              {quizResult.attempts ? ` · Încercare ${quizResult.attempts}/${THEORETICAL_TEST.maxAttempts}` : ''}
            </p>
          )}
          {trainingClosed && quizResult && !quizResult.passed && (
            <p className="text-xs text-corporate-muted mt-2 max-w-xl">
              Instruire finalizată — scorul rămâne în dosar ca istoric. Certificatul emis nu depinde de
              retrimiterea testului; pentru reluare, folosiți re-instruire sau sesiune suplimentară cu
              supervizorul.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {quizResult && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? 'Restrânge' : 'Deschide detalii'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pdfLoading}
                onClick={async () => {
                  setPdfLoading(true);
                  try {
                    await downloadTheoreticalTestPdf(employeeName, quizResult);
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              >
                {pdfLoading ? 'PDF…' : 'Descarcă PDF'}
              </Button>
            </>
          )}
        </div>
      </div>

      {!quizResult && (
        <p className="text-sm text-corporate-muted mt-3">
          Angajatul nu a trimis încă testul teoretic din Ziua 10.
        </p>
      )}

      {quizResult && expanded && (
        <div className="mt-4 border-t border-sky-200 pt-4">
          <TheoreticalTestReview
            quizResult={quizResult}
            title="Comparație răspunsuri — angajat vs. corect"
          />
        </div>
      )}
    </Card>
  );
}
