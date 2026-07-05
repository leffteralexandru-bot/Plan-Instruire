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

/** Angajat legat de mentor — instruire activă/finalizată, plan săptămânal sau istoric HR */
export function profileLinkedToMentor(profile: EmployeeProfile, mentorId: string): boolean {
  const activeEnrollment = userStore.getActiveEnrollmentForAngajat(profile.userId);
  if (activeEnrollment?.mentorId === mentorId) return true;

  const mentoredBefore = userStore
    .getEnrollments()
    .some(
      (e) =>
        e.angajatId === profile.userId && e.mentorId === mentorId && e.status === 'completed',
    );
  if (mentoredBefore) return true;

  if (profile.managerId === mentorId) return true;

  if ((profile.weeklyEvalMentors ?? []).some((w) => w.mentorId === mentorId)) return true;

  const reTrainer = trainingSystemStore
    .getReTrainingSessions({ angajatId: profile.userId })
    .find((s) => isActiveReTraining(s));
  if (reTrainer && (reTrainer.trainerId ?? reTrainer.mentorId) === mentorId) return true;

  const principalHistory = profile.assignmentHistory?.principalMentor ?? [];
  return principalHistory.some((h) => h.toUserId === mentorId);
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
  const reTrainerId = reSession ? (reSession.trainerId ?? reSession.mentorId) : undefined;

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
      userId: reTrainerId,
      name: reSession ? resolveUserName(users, reTrainerId) : '—',
      active: !!reSession,
      status: reSession?.status,
    },
  };
}
