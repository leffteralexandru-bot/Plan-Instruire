import type {
  EvaluationCycle,
  EvaluationStage,
  EvaluationStageId,
  EvaluationStageStatus,
  EmployeeSelfAssessment,
} from '@/types';
import { getEvaluationSelfAssessmentFields } from '@/lib/evaluationSettings';

export const EVALUATION_STAGE_LABELS: Record<EvaluationStageId, string> = {
  auto_evaluare: 'Auto-evaluare angajat',
  evaluare_mentor: 'Evaluare supervizor',
  validare_hr: 'Validare HR',
};

export const EVALUATION_STAGE_STATUS_LABELS: Record<EvaluationStageStatus, string> = {
  neinceput: 'Neînceput',
  in_curs: 'În curs',
  completat: 'Completat',
};

export function createDefaultEvaluationStages(): EvaluationStage[] {
  return (Object.keys(EVALUATION_STAGE_LABELS) as EvaluationStageId[]).map((id) => ({
    id,
    label: EVALUATION_STAGE_LABELS[id],
    status: 'neinceput',
  }));
}

/** Migrează cicluri vechi fără etape și deduce statusul din date existente */
export function ensureEvaluationStages(cycle: EvaluationCycle): EvaluationCycle {
  const syncLabels = (stages: EvaluationStage[]): EvaluationStage[] =>
    stages.map((s) => ({ ...s, label: EVALUATION_STAGE_LABELS[s.id] ?? s.label }));

  if (cycle.stages?.length) {
    return { ...cycle, stages: syncLabels(cycle.stages) };
  }

  const stages = createDefaultEvaluationStages();

  if (cycle.status === 'evaluat') {
    return {
      ...cycle,
      stages: stages.map((s) => ({
        ...s,
        status: 'completat' as const,
        completedAt: cycle.dataEvaluare ?? cycle.updatedAt,
      })),
    };
  }

  if (cycle.employeeSelfAssessment?.completedAt) {
    stages[0] = {
      ...stages[0],
      status: 'completat',
      completedAt: cycle.employeeSelfAssessment.completedAt,
    };
    stages[1].status = cycle.scoruri ? 'completat' : 'in_curs';
  } else if (cycle.status === 'in_curs' || cycle.status === 'intarziat') {
    const autoStage = cycle.stages?.find((s) => s.id === 'auto_evaluare');
    if (!autoStage || autoStage.status === 'neinceput') {
      stages[0].status = 'in_curs';
    }
  }

  if (cycle.scoruri) {
    stages[1] = { ...stages[1], status: 'completat' };
    stages[2].status = 'in_curs';
  }

  return { ...cycle, stages };
}

export function getActiveStage(cycle: EvaluationCycle): EvaluationStage | undefined {
  const withStages = ensureEvaluationStages(cycle);
  return (
    withStages.stages?.find((s) => s.status === 'in_curs') ??
    withStages.stages?.find((s) => s.status === 'neinceput')
  );
}

export function canEmployeeSubmitSelfAssessment(cycle: EvaluationCycle): boolean {
  const withStages = ensureEvaluationStages(cycle);
  const auto = withStages.stages?.find((s) => s.id === 'auto_evaluare');
  if (auto?.status !== 'in_curs') return false;
  return cycle.status === 'in_curs' || cycle.status === 'intarziat';
}

/** Etapa curentă pentru afișare în tabele / inbox */
export function getEvaluationWorkflowLabel(cycle: EvaluationCycle): string {
  if (cycle.status === 'evaluat') return 'Finalizată';
  if (cycle.status === 'planificat') return 'Planificată — pornește din Panou HR';
  const withStages = ensureEvaluationStages(cycle);
  const active = getActiveStage(withStages);
  if (active?.status === 'in_curs') return active.label;
  const next = withStages.stages?.find((s) => s.status === 'neinceput');
  if (next) return `Urmează: ${next.label}`;
  return 'În curs';
}

export function isSelfAssessmentComplete(data?: EmployeeSelfAssessment): boolean {
  if (!data) return false;
  const fields = getEvaluationSelfAssessmentFields();
  return (
    data.realizari.trim().length >= fields.realizari.minLength &&
    data.dificultati.trim().length >= fields.dificultati.minLength &&
    data.obiectiveViitoare.trim().length >= fields.obiectiveViitoare.minLength
  );
}

/** Mesaj de eroare sau null dacă poate fi trimisă */
export function validateSelfAssessmentSubmission(
  data: EmployeeSelfAssessment,
  competencyComplete: boolean,
): string | null {
  const fields = getEvaluationSelfAssessmentFields();
  if (data.realizari.trim().length < fields.realizari.minLength) {
    return `${fields.realizari.label} trebuie să aibă minim ${fields.realizari.minLength} caractere.`;
  }
  if (data.dificultati.trim().length < fields.dificultati.minLength) {
    return `${fields.dificultati.label} trebuie să aibă minim ${fields.dificultati.minLength} caractere.`;
  }
  if (data.obiectiveViitoare.trim().length < fields.obiectiveViitoare.minLength) {
    return `${fields.obiectiveViitoare.label} trebuie să aibă minim ${fields.obiectiveViitoare.minLength} caractere.`;
  }
  if (!competencyComplete) {
    return 'Bifează un nivel (1–4) la fiecare din cele 10 criterii.';
  }
  return null;
}

export function validateSupervisorAssessmentSubmission(
  data: EmployeeSelfAssessment,
  competencyComplete: boolean,
): string | null {
  return validateSelfAssessmentSubmission(data, competencyComplete);
}

export function isSupervisorAssessmentComplete(data?: EmployeeSelfAssessment): boolean {
  return isSelfAssessmentComplete(data);
}

export function isEmployeeSelfAssessmentStageDone(cycle: EvaluationCycle): boolean {
  const withStages = ensureEvaluationStages(cycle);
  const auto = withStages.stages?.find((s) => s.id === 'auto_evaluare');
  return auto?.status === 'completat';
}

export function isSupervisorEvaluationStageDone(cycle: EvaluationCycle): boolean {
  const withStages = ensureEvaluationStages(cycle);
  const mentor = withStages.stages?.find((s) => s.id === 'evaluare_mentor');
  return mentor?.status === 'completat';
}

/** Etape vizibile secvențial — următoarea apare doar după finalizarea celei anterioare */
export function getVisibleEvaluationStages(cycle: EvaluationCycle): EvaluationStage[] {
  if (needsEvaluationWorkflowStart(cycle)) return [];

  const all = ensureEvaluationStages(cycle).stages ?? [];
  const visible: EvaluationStage[] = [];
  for (const stage of all) {
    visible.push(stage);
    if (stage.status !== 'completat') break;
  }
  return visible;
}

/** HR poate închide ciclul doar după evaluarea supervizorului */
export function canHrFinalizeEvaluation(cycle: EvaluationCycle): boolean {
  if (cycle.status === 'evaluat') return false;
  const withStages = ensureEvaluationStages(cycle);
  const hrStage = withStages.stages?.find((s) => s.id === 'validare_hr');
  return hrStage?.status === 'in_curs' && isSupervisorEvaluationStageDone(cycle);
}

export function getHrFinalizeBlockReason(cycle: EvaluationCycle): string | null {
  if (cycle.status === 'evaluat') return 'Evaluarea este deja finalizată.';
  if (needsEvaluationWorkflowStart(cycle)) {
    return 'Porniți evaluarea (butonul Pornește).';
  }
  if (!isEmployeeSelfAssessmentStageDone(cycle)) {
    return 'Așteptați finalizarea auto-evaluării angajatului.';
  }
  if (!isSupervisorEvaluationStageDone(cycle)) {
    return 'Așteptați evaluarea supervizorului.';
  }
  if (!canHrFinalizeEvaluation(cycle)) {
    return 'Validarea HR nu este încă activă.';
  }
  return null;
}

export function isEvaluationWorkflowStarted(cycle: EvaluationCycle): boolean {
  if (cycle.status === 'evaluat') return true;
  const withStages = ensureEvaluationStages(cycle);
  const auto = withStages.stages?.find((s) => s.id === 'auto_evaluare');
  return auto?.status === 'in_curs' || auto?.status === 'completat';
}

/** Evaluare fără flux pornit — așteaptă acțiunea HR „Pornește” */
export function needsEvaluationWorkflowStart(cycle: EvaluationCycle): boolean {
  if (cycle.status === 'evaluat') return false;
  return !isEvaluationWorkflowStarted(cycle);
}
