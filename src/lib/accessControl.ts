import type { User } from '@/types';
import type { EmployeeArchiveFolder, ErrorCase } from '@/types';
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
import { getSupervisedEmployeeIds, isSubordinateOf, isSupervisorOf } from '@/lib/supervisor';
import { canDeleteErrorCase } from '@/lib/errorCaseWorkflow';

/** Poate deschide fișa unui angajat (proprie sau subordonați) */
export function canViewEmployee(actor: User | null | undefined, targetId: string): boolean {
  if (!actor || !targetId) return false;
  if (actor.id === targetId) return true;
  if (hasRole(actor, 'admin') || canViewAllTrainees(actor)) return true;
  if (isMentorUser(actor) && isSubordinateOf(actor.id, targetId)) return true;
  if (isSupervisorOf(actor.id, targetId)) return true;
  if (
    trainingSystemStore.getReTrainingSessions({ angajatId: targetId }).some(
      (s) => s.supervisorId === actor.id,
    )
  ) {
    return true;
  }
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

/** Panou Mentor — HR/admin, statut mentor, sau mentor principal la înscriere activă */
export function canOpenMentorPanel(actor: User | null | undefined): boolean {
  if (!actor) return false;
  if (hasRole(actor, 'admin') || canViewAllTrainees(actor)) return true;
  if (isMentorUser(actor)) return true;
  return userStore.getTraineeProfiles({ mentorId: actor.id }).length > 0;
}

/** Panou Supervizor — angajați desemnați ca supervizor direct */
export function canOpenSupervisorPanel(actor: User | null | undefined): boolean {
  if (!actor) return false;
  if (canManageUsers(actor) || hasRole(actor, 'admin')) return true;
  return getSupervisedEmployeeIds(actor.id).length > 0;
}

/** ID-uri angajați vizibili pentru actor */
export function getAccessibleEmployeeIds(actor: User | null | undefined): string[] | 'all' {
  if (!actor) return [];
  if (hasRole(actor, 'admin') || canViewAllTrainees(actor)) return 'all';
  const ids = new Set<string>();

  if (isMentorUser(actor)) {
    for (const t of userStore.getTraineeProfiles({ mentorId: actor.id })) ids.add(t.id);
    for (const p of hrPerformanceStore.getProfiles().filter((p) => p.managerId === actor.id)) {
      ids.add(p.userId);
    }
  }

  for (const id of getSupervisedEmployeeIds(actor.id)) ids.add(id);

  if (ids.size > 0) return [...ids];
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

/** Înregistrare eroare — HR pentru orice angajat, supervizor doar pentru subordonați */
export function canRegisterErrorCase(actor: User | null | undefined, angajatId: string): boolean {
  if (!actor || !angajatId) return false;
  if (canManageUsers(actor) || hasRole(actor, 'admin')) return true;
  return isSupervisorOf(actor.id, angajatId);
}

/** Ștergere înregistrare eroare — blocată după confirmare HR. */
export function getErrorCaseDeleteBlockReason(
  actor: User | null | undefined,
  error: ErrorCase,
): string | null {
  if (!actor) return 'Neautorizat.';
  const isHr = canManageUsers(actor) || hasRole(actor, 'admin');
  const workflowBlock = canDeleteErrorCase(error, { isHr });
  if (workflowBlock) return workflowBlock;
  if (isHr) return null;
  if (!isSupervisorOf(actor.id, error.angajatId)) {
    return 'Nu puteți șterge erori pentru acest angajat.';
  }
  return null;
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
  if (getSupervisedEmployeeIds(user.id).length > 0) return ingineriPath('/panou-supervizor');
  return INGINERI_ANGAJAT_PANEL_PATH;
}
