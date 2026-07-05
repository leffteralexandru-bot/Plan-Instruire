import { sortReTrainingSessionsNewestFirst } from '@/lib/errorReTrainingDisplay';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { getSupervisedEmployeeIds } from '@/lib/supervisor';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import type { ReTrainingSession } from '@/types';

function sessionsForSupervisor(supervisorId: string): ReTrainingSession[] {
  const supervised = new Set(getSupervisedEmployeeIds(supervisorId));
  return trainingSystemStore.getReTrainingSessions().filter(
    (s) => supervised.has(s.angajatId) || s.supervisorId === supervisorId,
  );
}

export function getSupervisorActiveReTrainingSessions(supervisorId: string): ReTrainingSession[] {
  return sessionsForSupervisor(supervisorId).filter(
    (s) => normalizeReTrainingStatus(s.status) !== 'finalizat',
  );
}

export function getSupervisorCompletedReTrainingSessions(supervisorId: string): ReTrainingSession[] {
  return sortReTrainingSessionsNewestFirst(
    sessionsForSupervisor(supervisorId).filter(
      (s) => normalizeReTrainingStatus(s.status) === 'finalizat',
    ),
  );
}

/** Pentru link din echipa supervizorului — prioritate sesiune activă, apoi ultima finalizată */
export function getPreferredRetrainSessionIdForPlan(angajatId: string): string | undefined {
  const sessions = sortReTrainingSessionsNewestFirst(
    trainingSystemStore.getReTrainingSessions({ angajatId }),
  );
  const active = sessions.find((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
  return active?.id ?? sessions[0]?.id;
}
