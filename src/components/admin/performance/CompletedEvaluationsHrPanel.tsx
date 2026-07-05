import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';
import {
  evaluationOrdinalLabel,
  formatEvaluationRoDate,
  resolveEvaluationEvaluatorName,
} from '@/lib/evaluationDisplay';
import { computeCompetencyOutcome, formatCoeficientSalarial, isCompetencyScoresComplete } from '@/lib/competencyScoring';
import { downloadCompletedEvaluationPdf } from '@/lib/exportCompletedEvaluationPdf';
import { ingineriPath } from '@/data/departments';
import type { EmployeeSelfAssessment, EvaluationCycle, User } from '@/types';

interface CompletedEvaluationsHrPanelProps {
  evaluations: EvaluationCycle[];
  users: User[];
  showSalaryCoefficient: boolean;
  onDownloadDocument?: (documentId: string) => void;
  getSignedDocumentName?: (cycleId: string) => string | undefined;
}

function AssessmentTexts({ title, assessment }: { title: string; assessment?: EmployeeSelfAssessment }) {
  if (!assessment?.completedAt) {
    return (
      <p className="text-xs text-corporate-muted italic">{title}: necompletat</p>
    );
  }
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs font-semibold text-corporate-dark uppercase tracking-wide">{title}</p>
      <p className="text-corporate-muted">
        <span className="font-medium text-corporate-stone">Realizări:</span> {assessment.realizari}
      </p>
      <p className="text-corporate-muted">
        <span className="font-medium text-corporate-stone">Dificultăți:</span> {assessment.dificultati}
      </p>
      <p className="text-corporate-muted">
        <span className="font-medium text-corporate-stone">Obiective:</span> {assessment.obiectiveViitoare}
      </p>
    </div>
  );
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

const INITIAL_VISIBLE_COUNT = 3;
const LOAD_MORE_STEP = 10;

export function CompletedEvaluationsHrPanel({
  evaluations,
  users,
  showSalaryCoefficient,
  onDownloadDocument,
  getSignedDocumentName,
}: CompletedEvaluationsHrPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const completed = useMemo(() => {
    const byEmployee = new Map<string, EvaluationCycle[]>();
    for (const ev of evaluations) {
      if (ev.status !== 'evaluat' || !ev.competencyResult) continue;
      const list = byEmployee.get(ev.angajatId) ?? [];
      list.push(ev);
      byEmployee.set(ev.angajatId, list);
    }

    const rows: {
      ev: EvaluationCycle;
      angajat?: User;
      evaluatorName?: string;
      ordinal: number;
    }[] = [];

    for (const [, cycles] of byEmployee) {
      const sorted = [...cycles].sort((a, b) =>
        (a.dataEvaluare ?? a.updatedAt).localeCompare(b.dataEvaluare ?? b.updatedAt),
      );
      sorted.forEach((ev, index) => {
        rows.push({
          ev,
          angajat: users.find((u) => u.id === ev.angajatId),
          evaluatorName: resolveEvaluationEvaluatorName(ev),
          ordinal: index + 1,
        });
      });
    }

    return rows.sort((a, b) =>
      (b.ev.dataEvaluare ?? b.ev.updatedAt).localeCompare(a.ev.dataEvaluare ?? a.ev.updatedAt),
    );
  }, [evaluations, users]);

  const visibleRows = completed.slice(0, visibleCount);
  const remaining = completed.length - visibleCount;

  if (!completed.length) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Evaluări finalizate</h2>
        <p className="text-sm text-corporate-muted">
          După validare HR, rezultatele (matrice angajat vs. supervizor și coeficient salarial) apar aici.
        </p>
        <p className="text-sm text-corporate-muted italic mt-3">Nicio evaluare tri-lunară finalizată încă.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Evaluări finalizate</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Istoric validat de HR — ultimele evaluări afișate mai jos
        {completed.length > INITIAL_VISIBLE_COUNT && ` (${completed.length} în total)`}.
        {' '}Comparați auto-evaluarea angajatului cu evaluarea supervizorului
        {showSalaryCoefficient ? ' și coeficientul de majorare aplicat' : ''}.
        {!showSalaryCoefficient && (
          <span className="block mt-1 text-xs">Coeficientul salarial este vizibil doar pentru HR.</span>
        )}
      </p>

      <ul className="space-y-2">
        {visibleRows.map(({ ev, angajat, evaluatorName, ordinal }) => {
          const result = ev.competencyResult!;
          const expanded = expandedId === ev.id;
          const selfOutcome =
            ev.competencySelfScores && isCompetencyScoresComplete(ev.competencySelfScores)
              ? computeCompetencyOutcome(ev.competencySelfScores)
              : undefined;
          const supervisorOutcome =
            ev.competencySupervisorScores && isCompetencyScoresComplete(ev.competencySupervisorScores)
              ? computeCompetencyOutcome(ev.competencySupervisorScores)
              : undefined;
          const signedDocName = getSignedDocumentName?.(ev.id);

          return (
            <li key={ev.id} className="rounded-lg border border-corporate-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : ev.id)}
                aria-expanded={expanded}
                className={[
                  'flex w-full flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                  expanded ? 'bg-corporate-gold-light/20' : 'hover:bg-corporate-surface',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <p className="font-medium text-corporate-dark">
                    {angajat?.name ?? ev.angajatId}
                    <span className="text-corporate-muted font-normal ml-2">
                      {evaluationOrdinalLabel(ordinal)}
                    </span>
                  </p>
                  <p className="text-xs text-corporate-muted mt-0.5">
                    {ev.dataEvaluare ? formatEvaluationRoDate(ev.dataEvaluare) : '—'}
                    {evaluatorName && ` · Supervizor: ${evaluatorName}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="success">
                    {result.nivelLabel} {result.incadrare}
                  </Badge>
                  <span className="text-xs text-corporate-muted">{result.total}/40</span>
                  {showSalaryCoefficient && (
                    <Badge variant="info">{formatCoeficientSalarial(result.coeficientSalarialPercent)}</Badge>
                  )}
                  <RowChevron expanded={expanded} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-corporate-border px-3 py-4 space-y-5 bg-white">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide mb-2">
                      Rezultat final validat de HR
                    </p>
                    <DesignerCompetencySummary
                      scores={result.scores}
                      outcome={result}
                      showSalaryCoefficient={showSalaryCoefficient}
                      evaluatedOn={ev.dataEvaluare}
                      evaluatedBy={evaluatorName}
                      evaluationNumber={ordinal}
                    />
                    {ev.concluzii && (
                      <p className="text-sm text-corporate-muted mt-3">
                        <span className="font-medium text-corporate-dark">Concluzii HR:</span> {ev.concluzii}
                      </p>
                    )}
                    {ev.planDezvoltare && (
                      <p className="text-sm text-corporate-muted mt-2">
                        <span className="font-medium text-corporate-dark">Plan dezvoltare:</span> {ev.planDezvoltare}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3">
                      <p className="text-sm font-semibold text-corporate-dark">Auto-evaluare angajat</p>
                      <AssessmentTexts title="Răspunsuri text" assessment={ev.employeeSelfAssessment} />
                      {selfOutcome ? (
                        <DesignerCompetencySummary
                          scores={ev.competencySelfScores!}
                          outcome={selfOutcome}
                          hideCriteriaTable={false}
                        />
                      ) : (
                        <p className="text-xs text-corporate-muted italic">Matrice competențe necompletată</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3 space-y-3">
                      <p className="text-sm font-semibold text-corporate-dark">Evaluare supervizor</p>
                      <AssessmentTexts title="Răspunsuri text" assessment={ev.supervisorAssessment} />
                      {supervisorOutcome ? (
                        <DesignerCompetencySummary
                          scores={ev.competencySupervisorScores!}
                          outcome={supervisorOutcome}
                          hideCriteriaTable={false}
                        />
                      ) : (
                        <p className="text-xs text-corporate-muted italic">Matrice competențe necompletată</p>
                      )}
                    </div>
                  </div>

                  {selfOutcome && supervisorOutcome && selfOutcome.total !== supervisorOutcome.total && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Diferență total puncte: angajat {selfOutcome.total}/40 · supervizor {supervisorOutcome.total}/40
                      · HR a validat {result.total}/40
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={pdfLoadingId === ev.id}
                      onClick={async () => {
                        setPdfLoadingId(ev.id);
                        try {
                          await downloadCompletedEvaluationPdf({
                            employeeName: angajat?.name ?? ev.angajatId,
                            evaluatorName,
                            ordinal,
                            cycle: ev,
                            showSalaryCoefficient,
                          });
                        } finally {
                          setPdfLoadingId(null);
                        }
                      }}
                    >
                      {pdfLoadingId === ev.id ? 'PDF…' : 'Descarcă PDF evaluare'}
                    </Button>
                    <Link to={ingineriPath(`/angajat/${ev.angajatId}`)}>
                      <Button type="button" variant="secondary" size="sm">
                        Deschide fișa angajat →
                      </Button>
                    </Link>
                    {signedDocName && ev.documentId && onDownloadDocument && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadDocument(ev.documentId!)}
                      >
                        Evaluare semnată: {signedDocName}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {remaining > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, completed.length))
            }
          >
            Arată încă {Math.min(LOAD_MORE_STEP, remaining)}
          </Button>
          <span className="text-xs text-corporate-muted">
            {visibleCount} din {completed.length} afișate
          </span>
        </div>
      )}

      {visibleCount > INITIAL_VISIBLE_COUNT && remaining === 0 && completed.length > INITIAL_VISIBLE_COUNT && (
        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
          >
            Restrânge la ultimele {INITIAL_VISIBLE_COUNT}
          </Button>
        </div>
      )}
    </Card>
  );
}
