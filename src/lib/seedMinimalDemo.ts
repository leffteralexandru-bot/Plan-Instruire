import { credentials, DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';
import {
  PLATFORM_SETTINGS_ADMIN_EMAIL,
  PLATFORM_SETTINGS_ADMIN_ID,
} from '@/lib/platformSettingsAdmin';
import type { EmployeeProfile, User } from '@/types';

/** Scenariu: cont owner privat + 1 angajat demo public */
export const DEMO_DATA_VERSION = 'minimal-demo-v5b-demo-angajat-name';

export const DEMO_ANGAJAT_ID = 'u-demo-angajat';
export const DEMO_ANGAJAT_EMAIL = 'angajat@artgranit.ro';
export const DEMO_ANGAJAT_PASSWORD = DEFAULT_PLATFORM_PASSWORD;
export const DEMO_HR_ID = 'u-hr';

/** Contul public demo — doar rol angajat, toate departamentele deschise */
export function isDemoPublicAngajat(
  user: Pick<{ id: string }, 'id'> | null | undefined,
): boolean {
  return !!user && user.id === DEMO_ANGAJAT_ID;
}

/** Păstrate pentru compatibilitate — nu mai există în scenariul demo */
export const DEMO_SUPERVISOR_ID = 'u-demo-supervizor';
export const DEMO_MENTOR_ID = 'u-demo-mentor';

const USERS_KEY = 'artgranit_users';
const ENROLLMENTS_KEY = 'artgranit_enrollments';
const PROGRESS_KEY = 'artgranit_progress';
const PROFILES_KEY = 'artgranit_employee_profiles';
const EVALUATIONS_KEY = 'artgranit_evaluation_cycles';
const DEMO_VERSION_KEY = 'artgranit_demo_version';

const KEYS_TO_CLEAR = [
  'artgranit_quick_notes',
  'artgranit_error_cases',
  'artgranit_hr_documents',
  'artgranit_kpi_snapshots',
  'artgranit_re_training_sessions',
  'artgranit_error_repeat_alerts',
  'artgranit_plan_archives',
  'artgranit_selected_stagiar',
  'artgranit_hr_alerts_dismissed',
];

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Cont public — vizualizare panou angajat (pentru toți) */
export const MINIMAL_DEMO_ANGAJAT: User = {
  id: DEMO_ANGAJAT_ID,
  name: 'Demo Angajat',
  roles: ['angajat'],
  email: DEMO_ANGAJAT_EMAIL,
  active: true,
  createdAt: '2026-01-15T00:00:00.000Z',
};

export const MINIMAL_ORG_USERS: User[] = [];
export const MINIMAL_DEMO_USERS: User[] = [MINIMAL_DEMO_ANGAJAT];

/** Indicii publice — doar angajatul demo (fără contul owner) */
export const DEMO_LOGIN_HINTS: { email: string; rol: string }[] = [
  { email: 'Demo Angajat', rol: 'Demo angajat — vizualizare panou' },
];

function buildDemoProfiles(): EmployeeProfile[] {
  return [
    {
      userId: DEMO_ANGAJAT_ID,
      prenume: 'Demo',
      nume: 'Angajat',
      functie: 'Inginer Proiectant',
      departamentId: 'ingineri',
      dataAngajarii: '2026-01-15',
      status: 'activ',
      tipAngajat: 'experimentat',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: nowIso(),
    },
  ];
}

/** Șterge profilele vechi; lasă angajatul demo public (+ owner la login, nedezvăluit) */
export function resetMinimalDemoScenario(): User[] {
  for (const key of KEYS_TO_CLEAR) {
    localStorage.removeItem(key);
  }

  writeJson(USERS_KEY, MINIMAL_DEMO_USERS);
  writeJson(ENROLLMENTS_KEY, []);
  writeJson(PROFILES_KEY, buildDemoProfiles());
  writeJson(EVALUATIONS_KEY, []);
  writeJson(PROGRESS_KEY, {});
  localStorage.setItem(DEMO_VERSION_KEY, DEMO_DATA_VERSION);

  credentials.removePassword(PLATFORM_SETTINGS_ADMIN_ID);
  credentials.removePassword(DEMO_HR_ID);
  credentials.removePassword(DEMO_SUPERVISOR_ID);
  credentials.removePassword(DEMO_MENTOR_ID);
  credentials.removePassword('u-admin');
  credentials.removePassword('u-alex-hr');
  credentials.setPassword(DEMO_ANGAJAT_ID, DEMO_ANGAJAT_PASSWORD);

  return MINIMAL_DEMO_USERS.filter((u) => u.active);
}

/** Contul owner nu se persistă în lista de utilizatori */
export function purgePersistedPlatformSettingsAdmin(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    const next = users.filter(
      (u) =>
        u.id !== PLATFORM_SETTINGS_ADMIN_ID &&
        u.email.toLowerCase() !== PLATFORM_SETTINGS_ADMIN_EMAIL.toLowerCase() &&
        u.email.toLowerCase() !== 'alex@artgranit.ro',
    );
    if (next.length !== users.length) writeJson(USERS_KEY, next);
    credentials.removePassword(PLATFORM_SETTINGS_ADMIN_ID);
    credentials.removePassword('u-alex-hr');
  } catch {
    /* ignore */
  }
}

export function isMinimalDemoCurrent(): boolean {
  return localStorage.getItem(DEMO_VERSION_KEY) === DEMO_DATA_VERSION;
}

export function ensureMinimalDemoIfEmpty(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? (JSON.parse(raw) as User[]) : [];
    if (users.length === 0 || !isMinimalDemoCurrent()) {
      resetMinimalDemoScenario();
    }
    purgePersistedPlatformSettingsAdmin();
  } catch {
    resetMinimalDemoScenario();
  }
}
