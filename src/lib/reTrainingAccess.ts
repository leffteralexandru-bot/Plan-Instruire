import type { ReTrainingSession, User } from '@/types';
import { canManageUsers } from '@/lib/roles';
import { isSupervisorOf } from '@/lib/supervisor';
import {
  canMentorViewAssignedSession,
  isReTrainingVisibleToTrainee,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';

/** Cine poate deschide lecția (inclusiv arhivată read-only). */
export function canViewReTrainingLesson(
  session: ReTrainingSession,
  user: Pick<User, 'id' | 'roles'> | null | undefined,
): boolean {
  if (!user) return false;
  if (canManageUsers(user)) return true;
  if (session.angajatId === user.id) return true;
  if (session.supervisorId === user.id || isSupervisorOf(user.id, session.angajatId)) return true;
  const st = normalizeReTrainingStatus(session.status);
  if (st === 'finalizat') return false;
  return canMentorViewAssignedSession(session, user.id);
}

export function isReTrainingLessonReadOnly(
  session: ReTrainingSession,
  user: Pick<User, 'id'> | null | undefined,
): boolean {
  const st = normalizeReTrainingStatus(session.status);
  if (st === 'finalizat') return true;
  if (user?.id === session.angajatId && !isReTrainingVisibleToTrainee(session)) return true;
  if (user?.id === session.angajatId && session.traineeCompletedAt) return true;
  return false;
}
