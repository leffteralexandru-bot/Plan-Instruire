import type { User } from '@/types';
import type { EmployeeArchiveFolder } from '@/types';
import { ingineriPath, INGINERI_ANGAJAT_PANEL_PATH, INGINERI_PLAN_PATH } from '@/data/departments';
import {
  canManageUsers,
  canViewAllTrainees,
  hasRole,
  isAngajatUser,
  isMentorUser,
} from '@/lib/roles';
import { userStore } from '@/lib/userStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';

/** Mentor/manager responsabil de un angajat */
export function isSubordinateOf(supervisorId: string, angajatId: string): boolean {
  if (supervisorId === angajatId) return false;
  const profile = hrPerformanceStore.getProfile(angajatId);
  if (profile?.managerId === supervisorId) return true;
  const enr = userStore.getActiveEnrollmentForAngajat(angajatId);
  return enr?.mentorId === supervisorId;
}

/** Poate deschide fișa unui angajat (proprie sau subordonați) */
export function canViewEmployee(actor: User | null | undefined, targetId: string): boolean {
  if (!actor || !targetId) return false;
  if (actor.id === targetId) return true;
  if (hasRole(actor, 'admin') || canViewAllTrainees(actor)) return true;
  if (isMentorUser(actor) && isSubordinateOf(actor.id, targetId)) return true;
  return false;
}

export function canEditEmployeeProfile(actor: User | null | undefined): boolean {
  return canManageUsers(actor);
}

export function canExportEmployeeDossier(actor: User | null | undefined, targetId: string): boolean {
  if (!actor) return false;
  if (actor.id === targetId) return true;
  return canManageUsers(actor) || hasRole(actor, 'admin');
}

export function canAddEmployeeNote(actor: User | null | undefined, targetId: string): boolean {
  if (!actor) return false;
  if (canManageUsers(actor)) return true;
  if (isMentorUser(actor) && isSubordinateOf(actor.id, targetId)) return true;
  return false;
}

export function canSendEvaluationReminder(actor: User | null | undefined): boolean {
  return canManageUsers(actor) || hasRole(actor, 'admin');
}

/** Panou Mentor — statut temporar acordat de HR (+ admin supraveghere) */
export function canOpenMentorPanel(actor: User | null | undefined): boolean {
  if (!actor) return false;
  if (hasRole(actor, 'admin')) return true;
  return isMentorUser(actor);
}

/** ID-uri angajați vizibili pentru actor */
export function getAccessibleEmployeeIds(actor: User | null | undefined): string[] | 'all' {
  if (!actor) return [];
  if (hasRole(actor, 'admin') || canViewAllTrainees(actor)) return 'all';
  if (isMentorUser(actor)) {
    const fromEnroll = userStore.getTraineeProfiles({ mentorId: actor.id }).map((t) => t.id);
    const fromManager = hrPerformanceStore
      .getProfiles()
      .filter((p) => p.managerId === actor.id)
      .map((p) => p.userId);
    return [...new Set([...fromEnroll, ...fromManager])];
  }
  if (isAngajatUser(actor)) return [actor.id];
  return [];
}

export function filterProfilesForActor<T extends { userId: string }>(
  actor: User | null | undefined,
  items: T[],
): T[] {
  const allowed = getAccessibleEmployeeIds(actor);
  if (allowed === 'all') return items;
  const set = new Set(allowed);
  return items.filter((i) => set.has(i.userId));
}

/** Acces la foldere arhivă angajat (documentație, evaluări, re-instruire) */
export function canAccessEmployeeArchive(
  actor: User | null | undefined,
  angajatId: string,
  _folder?: EmployeeArchiveFolder,
): boolean {
  return canViewEmployee(actor, angajatId);
}

/** Dashboard alerte erori repetate — doar mentor pentru subordonați */
export function canViewMentorErrorAlerts(actor: User | null | undefined): boolean {
  return canOpenMentorPanel(actor);
}

/** Subordonați cu alerte active la prag (pentru dashboard mentor) */
export function getSubordinatesWithErrorAlerts(mentorId: string): string[] {
  const alerts = trainingSystemStore
    .getErrorRepeatAlerts({ mentorId, unacknowledgedOnly: true })
    .filter((a) => {
      const session = trainingSystemStore
        .getReTrainingSessions({ angajatId: a.angajatId })
        .find((s) => s.id === a.reTrainingSessionId);
      return session && session.status !== 'finalizat';
    });
  return [...new Set(alerts.map((a) => a.angajatId))];
}

/** Destinație după autentificare */
export function getPostLoginPath(user: User): string {
  if (hasRole(user, 'admin')) return INGINERI_PLAN_PATH;
  if (hasRole(user, 'hr')) return ingineriPath('/admin');
  if (isAngajatUser(user)) return INGINERI_ANGAJAT_PANEL_PATH;
  if (isMentorUser(user)) return ingineriPath('/mentor');
  return INGINERI_ANGAJAT_PANEL_PATH;
}
