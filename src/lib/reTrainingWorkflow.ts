import type { ReTrainingSession, ReTrainingStatus } from '@/types';

export const RE_TRAINING_STATUS_LABELS: Record<ReTrainingStatus, string> = {
  alerta_supervizor: 'Alertă supervizor',
  planificat: 'Planificat',
  in_curs: 'În curs',
  raport_trainer: 'Raport trainer',
  confirmat_supervizor: 'Confirmat supervizor',
  finalizat: 'Finalizat · arhivat',
  obligatoriu: 'Alertă supervizor',
};

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
    trainerId: session.trainerId ?? (status !== 'alerta_supervizor' ? session.mentorId : undefined),
  };
}

export function canSupervisorPlan(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'alerta_supervizor';
}

export function canTrainerSubmitReport(session: ReTrainingSession): boolean {
  const s = normalizeReTrainingStatus(session.status);
  return s === 'planificat' || s === 'in_curs';
}

export function canSupervisorConfirm(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'raport_trainer';
}

export function canHrConfirm(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) === 'confirmat_supervizor';
}

export function isActiveReTraining(session: ReTrainingSession): boolean {
  return normalizeReTrainingStatus(session.status) !== 'finalizat';
}
