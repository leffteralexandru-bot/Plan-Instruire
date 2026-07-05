import type { EmployeeSelfAssessment, EvaluationCycle } from '@/types';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';
import { computeCompetencyOutcome, isCompetencyScoresComplete } from '@/lib/competencyScoring';

function AssessmentBlock({
  title,
  assessment,
}: {
  title: string;
  assessment?: EmployeeSelfAssessment;
}) {
  if (!assessment?.completedAt) {
    return <p className="text-xs text-corporate-muted italic">{title}: necompletat</p>;
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

interface EvaluationDualReviewPanelProps {
  cycle: EvaluationCycle;
  showSalaryCoefficient?: boolean;
}

/** Compară auto-evaluarea angajatului cu evaluarea supervizorului — HR validează, nu renota. */
export function EvaluationDualReviewPanel({
  cycle,
  showSalaryCoefficient = false,
}: EvaluationDualReviewPanelProps) {
  const selfOutcome =
    cycle.competencySelfScores && isCompetencyScoresComplete(cycle.competencySelfScores)
      ? computeCompetencyOutcome(cycle.competencySelfScores)
      : undefined;
  const supervisorOutcome =
    cycle.competencySupervisorScores && isCompetencyScoresComplete(cycle.competencySupervisorScores)
      ? computeCompetencyOutcome(cycle.competencySupervisorScores)
      : undefined;

  return (
    <div className="space-y-4">
      <p className="text-sm text-corporate-muted">
        HR compară cele două evaluări și confirmă rezultatul <strong className="text-corporate-dark">supervizorului</strong>
        {' '}(evaluarea oficială). Auto-evaluarea angajatului este doar pentru context.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3">
          <p className="text-sm font-semibold text-corporate-dark">1 · Auto-evaluare angajat</p>
          <AssessmentBlock title="Răspunsuri text" assessment={cycle.employeeSelfAssessment} />
          {selfOutcome ? (
            <DesignerCompetencySummary scores={cycle.competencySelfScores!} outcome={selfOutcome} hideCriteriaTable />
          ) : (
            <p className="text-xs text-corporate-muted italic">Matrice competențe necompletată</p>
          )}
        </div>

        <div className="rounded-lg border border-corporate-gold/50 bg-corporate-gold-light/15 p-3 space-y-3">
          <p className="text-sm font-semibold text-corporate-dark">2 · Evaluare supervizor (oficială)</p>
          <AssessmentBlock title="Răspunsuri text" assessment={cycle.supervisorAssessment} />
          {supervisorOutcome ? (
            <DesignerCompetencySummary
              scores={cycle.competencySupervisorScores!}
              outcome={supervisorOutcome}
              showSalaryCoefficient={showSalaryCoefficient}
            />
          ) : (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Supervizorul nu a finalizat încă evaluarea. HR nu poate valida ciclul.
            </p>
          )}
        </div>
      </div>

      {selfOutcome && supervisorOutcome && selfOutcome.total !== supervisorOutcome.total && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Diferență punctaj total: angajat {selfOutcome.total}/40 · supervizor {supervisorOutcome.total}/40.
          La validare HR se înregistrează rezultatul supervizorului ({supervisorOutcome.total}/40,{' '}
          {supervisorOutcome.nivelLabel}).
        </p>
      )}
    </div>
  );
}
