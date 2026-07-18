import type { User } from '@/types';

/** Singurul cont cu acces complet: setări platformă + panou Admin/HR */
export const PLATFORM_SETTINGS_ADMIN_ID = 'u-platform-owner';
export const PLATFORM_SETTINGS_ADMIN_EMAIL = 'leffteralexandru@gmail.com';
export const PLATFORM_SETTINGS_ADMIN_FIRST_NAME = 'Alexandru';
export const PLATFORM_SETTINGS_ADMIN_LAST_NAME = 'Lefter';
export const PLATFORM_SETTINGS_ADMIN_NAME = `${PLATFORM_SETTINGS_ADMIN_FIRST_NAME} ${PLATFORM_SETTINGS_ADMIN_LAST_NAME}`;
export const PLATFORM_SETTINGS_ADMIN_DEFAULT_PASSWORD = '122312';

export function normalizePersonNamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function personNamesMatch(
  prenume: string,
  nume: string,
  firstName: string,
  lastName: string,
): boolean {
  const p = normalizePersonNamePart(prenume);
  const n = normalizePersonNamePart(nume);
  const f = normalizePersonNamePart(firstName);
  const l = normalizePersonNamePart(lastName);
  if (!p || !n || !f || !l) return false;
  return (p === f && n === l) || (p === l && n === f);
}

/** Potrivire doar după nume de familie (sau singurul cuvânt din numele afișat) */
export function lastNamesMatch(inputNume: string, ...candidates: string[]): boolean {
  const needle = normalizePersonNamePart(inputNume);
  if (!needle) return false;
  return candidates.some((c) => normalizePersonNamePart(c) === needle);
}

export function isPlatformSettingsAdmin(
  user: Pick<User, 'id'> & Partial<Pick<User, 'email'>> | null | undefined,
): boolean {
  if (!user) return false;
  if (user.id === PLATFORM_SETTINGS_ADMIN_ID) return true;
  if (user.email?.toLowerCase() === PLATFORM_SETTINGS_ADMIN_EMAIL.toLowerCase()) return true;
  return false;
}

export function canEditPlatformSettings(
  user: Pick<User, 'id'> & Partial<Pick<User, 'email'>> | null | undefined,
): boolean {
  return isPlatformSettingsAdmin(user);
}

/** Cont doar la autentificare — nu este salvat în lista de utilizatori */
export function isPlatformSettingsAdminLogin(email: string, password: string): boolean {
  return (
    email.toLowerCase().trim() === PLATFORM_SETTINGS_ADMIN_EMAIL.toLowerCase() &&
    password === PLATFORM_SETTINGS_ADMIN_DEFAULT_PASSWORD
  );
}

/** Autentificare owner după nume de familie */
export function isPlatformSettingsAdminNameLogin(nume: string, password: string): boolean {
  return (
    lastNamesMatch(nume, PLATFORM_SETTINGS_ADMIN_LAST_NAME, PLATFORM_SETTINGS_ADMIN_NAME) &&
    password === PLATFORM_SETTINGS_ADMIN_DEFAULT_PASSWORD
  );
}

export function buildPlatformSettingsAdminUser(): User {
  return {
    id: PLATFORM_SETTINGS_ADMIN_ID,
    name: PLATFORM_SETTINGS_ADMIN_NAME,
    email: PLATFORM_SETTINGS_ADMIN_EMAIL,
    roles: ['admin', 'hr'],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}
