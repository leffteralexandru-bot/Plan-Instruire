import type { EmployeeProfile, User } from '@/types';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { userStore } from '@/lib/userStore';
import { resolveSupervisorId } from '@/lib/supervisor';
import { isActiveReTraining } from '@/lib/reTrainingWorkflow';

export interface MentorAssignment {
  userId?: string;
  name: string;
}

export interface EmployeeMentorAssignments {
  supervizor: MentorAssignment;
  /** Mentor la planul de instruire activ */
  instruire: MentorAssignment & { active: boolean };
  /** Re-instruire activă după erori */
  reInstruire: MentorAssignment & { active: boolean; status?: string };
}

function resolveUserName(users: User[], userId?: string): string {
  if (!userId) return '—';
  return users.find((u) => u.id === userId)?.name ?? '—';
}

export function getEmployeeMentorAssignments(
  profile: EmployeeProfile,
  users: User[],
): EmployeeMentorAssignments {
  const supervisorId = resolveSupervisorId(profile.userId);
  const enrollment = userStore.getActiveEnrollmentForAngajat(profile.userId);
  const reSession = trainingSystemStore
    .getReTrainingSessions({ angajatId: profile.userId })
    .find((s) => isActiveReTraining(s));

  return {
    supervizor: {
      userId: supervisorId,
      name: resolveUserName(users, supervisorId),
    },
    instruire: {
      userId: enrollment?.mentorId,
      name: enrollment ? resolveUserName(users, enrollment.mentorId) : '—',
      active: !!enrollment,
    },
    reInstruire: {
      userId: reSession?.supervisorId,
      name: reSession ? resolveUserName(users, reSession.supervisorId) : '—',
      active: !!reSession,
      status: reSession?.status,
    },
  };
}
