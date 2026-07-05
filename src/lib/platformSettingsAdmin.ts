import type { User } from '@/types';

/** Singurul cont care poate modifica planul, testul de evaluare și conținutul din Setări HR */
export const PLATFORM_SETTINGS_ADMIN_ID = 'u-alex-hr';
export const PLATFORM_SETTINGS_ADMIN_EMAIL = 'alex@artgranit.ro';
export const PLATFORM_SETTINGS_ADMIN_NAME = 'Alex';
export const PLATFORM_SETTINGS_ADMIN_DEFAULT_PASSWORD = '122312';

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

export function buildPlatformSettingsAdminUser(): User {
  return {
    id: PLATFORM_SETTINGS_ADMIN_ID,
    name: PLATFORM_SETTINGS_ADMIN_NAME,
    email: PLATFORM_SETTINGS_ADMIN_EMAIL,
    roles: ['hr'],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}
