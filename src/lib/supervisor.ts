import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { userStore } from '@/lib/userStore';

/** Supervizor desemnat de HR pentru angajat */
export function resolveSupervisorId(angajatId: string): string | undefined {
  const profile = hrPerformanceStore.getProfile(angajatId);
  if (profile?.supervisorId) return profile.supervisorId;
  if (profile?.managerId) return profile.managerId;
  const enr = userStore.getActiveEnrollmentForAngajat(angajatId);
  return enr?.mentorId;
}

export function isSupervisorOf(supervisorId: string, angajatId: string): boolean {
  if (supervisorId === angajatId) return false;
  return resolveSupervisorId(angajatId) === supervisorId;
}

/** Mentor/manager responsabil de un angajat (inclusiv supervizor HR) */
export function isSubordinateOf(supervisorId: string, angajatId: string): boolean {
  if (isSupervisorOf(supervisorId, angajatId)) return true;
  const enr = userStore.getActiveEnrollmentForAngajat(angajatId);
  return enr?.mentorId === supervisorId;
}

export function getSupervisedEmployeeIds(supervisorId: string): string[] {
  return hrPerformanceStore
    .getProfiles()
    .filter((p) => resolveSupervisorId(p.userId) === supervisorId)
    .map((p) => p.userId);
}
