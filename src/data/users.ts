import { getActiveCohort } from '@/data/cohorts';
import { userStore, getLoginUsers, getTrainees } from '@/lib/userStore';
import type { TraineeProfile, User } from '@/types';

export { getLoginUsers, getTrainees, getTraineesForMentor, getTraineesForCohort } from '@/lib/userStore';

export function getUserById(id: string): User | undefined {
  return userStore.getUserById(id);
}

export function getStagiariForMentor(mentorId: string): TraineeProfile[] {
  return userStore.getTraineeProfiles({ mentorId });
}

export function getStagiariForActiveCohort(): TraineeProfile[] {
  return userStore.getTraineeProfiles({ cohortId: getActiveCohort().id });
}

export function getTraineeProfileById(id: string): TraineeProfile | undefined {
  return userStore.getTraineeProfiles().find((t) => t.id === id);
}

/** Lista utilizatori activi — pentru login */
export function listDemoUsers(): User[] {
  return getLoginUsers();
}

/** Angajați cu înscriere activă */
export function listTrainees(): TraineeProfile[] {
  return getTrainees();
}
