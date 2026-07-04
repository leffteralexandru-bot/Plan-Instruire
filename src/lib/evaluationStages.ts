import type {
  EvaluationCycle,
  EvaluationStage,
  EvaluationStageId,
  EvaluationStageStatus,
  EmployeeSelfAssessment,
} from '@/types';

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
  const stage = getActiveStage(cycle);
  return stage?.id === 'auto_evaluare' && (cycle.status === 'in_curs' || cycle.status === 'intarziat');
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
  return (
    data.realizari.trim().length >= 20 &&
    data.dificultati.trim().length >= 10 &&
    data.obiectiveViitoare.trim().length >= 10
  );
}

/** Mesaj de eroare sau null dacă poate fi trimisă */
export function validateSelfAssessmentSubmission(
  data: EmployeeSelfAssessment,
  competencyComplete: boolean,
): string | null {
  if (data.realizari.trim().length < 20) {
    return 'Realizările trebuie să aibă minim 20 caractere.';
  }
  if (data.dificultati.trim().length < 10) {
    return 'Dificultățile trebuie să aibă minim 10 caractere.';
  }
  if (data.obiectiveViitoare.trim().length < 10) {
    return 'Obiectivele viitoare trebuie să aibă minim 10 caractere.';
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

/** Evaluare fără date completate — așteaptă acțiunea HR „Pornește evaluarea” */
export function needsEvaluationWorkflowStart(cycle: EvaluationCycle): boolean {
  if (cycle.status === 'evaluat') return false;
  const withStages = ensureEvaluationStages(cycle);
  const started = withStages.stages?.some(
    (s) => s.status === 'in_curs' || s.status === 'completat',
  );
  if (started) return false;
  const hasWork =
    cycle.employeeSelfAssessment?.completedAt ||
    cycle.competencySelfScores ||
    cycle.supervisorAssessment?.completedAt ||
    cycle.scoruri ||
    cycle.observatiiMentor;
  return !hasWork;
}
