import type { ErrorCase, ReTrainingSession, ReTrainingStatus } from '@/types';

export const RE_TRAINING_STATUS_LABELS: Record<ReTrainingStatus, string> = {
  alerta_supervizor: 'Pregătire supervizor',
  asteapta_hr: 'Așteaptă aprobare HR',
  planificat: 'Aprobat HR · de început',
  in_curs: 'În curs',
  raport_trainer: 'Raport trainer',
  confirmat_supervizor: 'Confirmat supervizor',
  finalizat: 'Finalizat · arhivat',
  obligatoriu: 'Pregătire supervizor',
};

export const COMPREHENSION_LABELS = {
  inteles: 'A înțeles lecția',
  neinteles: 'Nu a înțeles — necesită follow-up',
} as const;

export function normalizeReTrainingStatus(status: ReTrainingStatus): ReTrainingStatus {
  if (status === 'obligatoriu') return 'alerta_supervizor';
  return status;
}

export function migrateReTrainingSession(session: ReTrainingSession): ReTrainingSession {
  const status = normalizeReTrainingStatus(session.status);
  return {
    ...session,
    status,
    supervisorId: session.supervisorId ?? session.mentorId,
    trainerId: session.trainerId ?? (status !== 'alerta_supervizor' && status !== 'asteapta_hr' ? session.mentorId : undefined),
    lessonProgress: session.lessonProgress ?? { completedTasks: [], mentorValidated: false },
  };
}

export function isHrApprovedErrorSession(session: ReTrainingSession): boolean {
  return !!session.hrPlanApprovedAt && session.errorCaseIds.length > 0;
}

/** Supervizor pregătește planul (notă semnată + temă + trainer) */
export function canSupervisorPlan(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'alerta_supervizor';
}

/** HR aprobă planul înainte ca mentorul și angajatul să vadă sesiunea */
export function canHrApprovePlan(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'asteapta_hr';
}

/** Mentor finalizează după ce angajatul a parcurs lecția */
export function canTrainerSubmitReport(session: ReTrainingSession): boolean {
  const s = normalizeReTrainingStatus(session.status);
  if (session.trigger === 'cerere_angajat') {
    return s === 'in_curs' && !!session.traineeCompletedAt;
  }
  if (isHrApprovedErrorSession(session)) {
    return s === 'in_curs' && !!session.traineeCompletedAt;
  }
  return s === 'planificat' || s === 'in_curs';
}

/** Mentor vede sesiunea atribuită (lecție + status angajat) */
export function canMentorViewAssignedSession(session: ReTrainingSession, mentorId: string): boolean {
  const trainer = session.trainerId ?? session.mentorId;
  if (trainer !== mentorId) return false;
  const s = normalizeReTrainingStatus(session.status);
  return s === 'planificat' || s === 'in_curs' || s === 'raport_trainer';
}

export function canSupervisorConfirm(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'raport_trainer';
}

/** @deprecated al doilea pas HR — înlocuit cu aprobare plan la început */
export function canHrConfirm(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'confirmat_supervizor';
}

/** Vizibil în panoul angajat — poate deschide lecția */
export const RE_TRAINING_MATERIALS_TASK_ID = 'retrain-materials-reviewed';

export function canTraineeEditReTrainingLesson(session: ReTrainingSession): boolean {
  if (session.traineeCompletedAt) return false;
  const s = normalizeReTrainingStatus(session.status);
  return s === 'planificat' || s === 'in_curs';
}

export function isReTrainingVisibleToTrainee(session: ReTrainingSession): boolean {
  const s = normalizeReTrainingStatus(session.status);
  return s === 'planificat' || s === 'in_curs';
}

export function isActiveReTraining(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) !== 'finalizat';
}

export function isReTrainingLessonComplete(session: ReTrainingSession, totalTasks: number): boolean {
  if (session.traineeCompletedAt) return true;
  if (totalTasks === 0) return false;
  const done = session.lessonProgress?.completedTasks.length ?? 0;
  return done >= totalTasks;
}

export function errorCasesHaveSignedNota(cases: ErrorCase[]): boolean {
  return cases.length > 0 && cases.every((c) => !!c.signedDocumentId);
}
