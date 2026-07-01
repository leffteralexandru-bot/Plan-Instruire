import type { UserRole, User } from '@/types';

/** Roluri canonice: admin, hr, angajat, mentor */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  hr: 'Resurse Umane (HR)',
  angajat: 'Angajat',
  mentor: 'Mentor',
};

export const ROLE_EMOJI: Record<UserRole, string> = {
  admin: '⚙️',
  hr: '📋',
  angajat: '🎓',
  mentor: '👤',
};

const ORG_ROLES: UserRole[] = ['admin', 'hr', 'angajat'];

/** Acceptă și rolul vechi „stagiar” din date migrate */
export function normalizeRole(role: string): UserRole {
  if (role === 'stagiar') return 'angajat';
  if (role === 'admin' || role === 'hr' || role === 'angajat' || role === 'mentor') return role;
  return 'angajat';
}

export function normalizeRoles(input: UserRole[] | string[] | undefined, legacyRole?: string): UserRole[] {
  if (input?.length) {
    return [...new Set(input.map((r) => normalizeRole(r)))];
  }
  if (legacyRole) {
    const r = normalizeRole(legacyRole);
    if (r === 'mentor') return ['mentor'];
    if (r === 'angajat') return ['angajat'];
    return [r];
  }
  return ['angajat'];
}

export function hasRole(user: Pick<User, 'roles'> | null | undefined, role: UserRole): boolean {
  if (!user) return false;
  const roles = user.roles ?? normalizeRoles(undefined, (user as User & { role?: string }).role);
  return roles.includes(role);
}

export function hasAnyRole(user: Pick<User, 'roles'> | null | undefined, roles: UserRole[]): boolean {
  return roles.some((r) => hasRole(user, r));
}

/** Angajat în companie (poate avea și statut mentor) */
export function isAngajatUser(user: Pick<User, 'roles'> | null | undefined): boolean {
  return hasRole(user, 'angajat');
}

/** Statut mentor temporar — acordat/retras de HR unui angajat */
export function isMentorUser(user: Pick<User, 'roles'> | null | undefined): boolean {
  return hasRole(user, 'mentor');
}

/** Angajat cu statut mentor temporar (HR) */
export function isAngajatMentor(user: Pick<User, 'roles'> | null | undefined): boolean {
  return isAngajatUser(user) && isMentorUser(user);
}

export function canManageUsers(user: Pick<User, 'roles'> | null | undefined): boolean {
  return hasAnyRole(user, ['admin', 'hr']);
}

export function canAccessAdminPanel(user: Pick<User, 'roles'> | null | undefined): boolean {
  return canManageUsers(user);
}

export function canAccessMentorPanel(user: Pick<User, 'roles'> | null | undefined): boolean {
  if (!user) return false;
  return isMentorUser(user) || hasRole(user, 'admin');
}

export function canManageSystemSettings(user: Pick<User, 'roles'> | null | undefined): boolean {
  return hasRole(user, 'admin');
}

export function canViewAllTrainees(user: Pick<User, 'roles'> | null | undefined): boolean {
  return hasAnyRole(user, ['admin', 'hr']);
}

/** Etichetă afișată în UI (ex: „Angajat · Mentor”) */
export function formatUserRoles(user: Pick<User, 'roles'> & { role?: string }): string {
  const roles = user.roles ?? normalizeRoles(undefined, user.role);
  return roles.map((r) => ROLE_LABELS[r]).join(' · ');
}

/** Emoji principal pentru card login */
export function primaryRoleEmoji(user: Pick<User, 'roles'>): string {
  if (hasRole(user, 'admin')) return ROLE_EMOJI.admin;
  if (hasRole(user, 'hr')) return ROLE_EMOJI.hr;
  if (hasRole(user, 'mentor') && !hasRole(user, 'angajat')) return ROLE_EMOJI.mentor;
  if (hasRole(user, 'mentor')) return ROLE_EMOJI.mentor;
  return ROLE_EMOJI.angajat;
}

export function isOrganizationalRole(role: UserRole): boolean {
  return ORG_ROLES.includes(role);
}

/** Cine poate crea ce profile — ierarhie artGRANIT */
export function canCreateRoles(actor: Pick<User, 'roles'> | null | undefined, targetRoles: UserRole[]): boolean {
  if (!actor || !targetRoles.length) return false;
  const targets = normalizeRoles(targetRoles);
  if (hasRole(actor, 'admin')) {
    return targets.every((r) => r === 'hr');
  }
  if (hasRole(actor, 'hr')) {
    return targets.every((r) => r === 'angajat' || r === 'mentor');
  }
  return false;
}
