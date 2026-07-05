import { createDefaultEvaluationStages } from '@/lib/evaluationStages';
import { credentials } from '@/lib/credentials';
import {
  PLATFORM_SETTINGS_ADMIN_EMAIL,
  PLATFORM_SETTINGS_ADMIN_ID,
} from '@/lib/platformSettingsAdmin';
import type { EmployeeProfile, EvaluationCycle, TrainingEnrollment, User } from '@/types';

export const DEMO_DATA_VERSION = 'minimal-demo-v1';

export const DEMO_ANGAJAT_ID = 'u-demo-angajat';
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

export const MINIMAL_ORG_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'Radu State',
    roles: ['admin'],
    email: 'admin@artgranit.ro',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u-hr',
    name: 'Elena Vasilescu',
    roles: ['hr'],
    email: 'e.vasilescu@artgranit.ro',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const MINIMAL_DEMO_ANGAJAT: User = {
  id: DEMO_ANGAJAT_ID,
  name: 'Andrei Popescu',
  roles: ['angajat'],
  email: 'angajat@artgranit.ro',
  active: true,
  createdAt: '2026-01-15T00:00:00.000Z',
};

export const MINIMAL_DEMO_SUPERVISOR: User = {
  id: DEMO_SUPERVISOR_ID,
  name: 'Vasile Ionescu',
  roles: ['angajat'],
  email: 'supervizor@artgranit.ro',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MINIMAL_DEMO_MENTOR: User = {
  id: DEMO_MENTOR_ID,
  name: 'Maria Mentor',
  roles: ['angajat', 'mentor'],
  email: 'mentor@artgranit.ro',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MINIMAL_DEMO_USERS: User[] = [
  ...MINIMAL_ORG_USERS,
  MINIMAL_DEMO_ANGAJAT,
  MINIMAL_DEMO_SUPERVISOR,
  MINIMAL_DEMO_MENTOR,
];

export const DEMO_LOGIN_HINTS: { email: string; rol: string }[] = [
  { email: 'e.vasilescu@artgranit.ro', rol: 'HR — pornește evaluarea' },
  { email: 'angajat@artgranit.ro', rol: 'Angajat — auto-evaluare' },
  { email: 'supervizor@artgranit.ro', rol: 'Supervizor al angajatului' },
  { email: 'mentor@artgranit.ro', rol: 'Mentor instruire (S2/S4)' },
];

const DEMO_ENROLLMENT: TrainingEnrollment = {
  id: 'enr-demo-1',
  angajatId: DEMO_ANGAJAT_ID,
  departmentId: 'ingineri',
  cohortId: 'cohort-demo-2026',
  mentorId: DEMO_MENTOR_ID,
  programStart: '2026-02-03',
  status: 'active',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

function buildDemoProfiles(): EmployeeProfile[] {
  const ts = nowIso();
  return [
    {
      userId: DEMO_ANGAJAT_ID,
      prenume: 'Andrei',
      nume: 'Popescu',
      functie: 'Inginer Proiectant',
      departamentId: 'ingineri',
      dataAngajarii: '2026-01-15',
      supervisorId: DEMO_SUPERVISOR_ID,
      managerId: DEMO_SUPERVISOR_ID,
      status: 'activ',
      tipAngajat: 'experimentat',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: ts,
    },
    {
      userId: DEMO_SUPERVISOR_ID,
      prenume: 'Vasile',
      nume: 'Ionescu',
      functie: 'Supervizor proiectare',
      departamentId: 'ingineri',
      dataAngajarii: '2024-03-01',
      status: 'activ',
      tipAngajat: 'experimentat',
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: ts,
    },
    {
      userId: DEMO_MENTOR_ID,
      prenume: 'Maria',
      nume: 'Mentor',
      functie: 'Mentor instruire',
      departamentId: 'ingineri',
      dataAngajarii: '2023-06-01',
      status: 'activ',
      tipAngajat: 'experimentat',
      createdAt: '2023-06-01T00:00:00.000Z',
      updatedAt: ts,
    },
  ];
}

function buildDemoEvaluation(): EvaluationCycle {
  const start = '2026-05-30';
  const end = '2026-08-28';
  return {
    id: 'eval-demo-1',
    angajatId: DEMO_ANGAJAT_ID,
    evaluatorId: DEMO_SUPERVISOR_ID,
    perioadaStart: start,
    perioadaEnd: end,
    termenReevaluare: end,
    status: 'planificat',
    stages: createDefaultEvaluationStages(),
    createdAt: `${start}T00:00:00.000Z`,
    updatedAt: nowIso(),
  };
}

/** Șterge angajații vechi și creează scenariul minimal: 1 angajat + supervizor + mentor */
export function resetMinimalDemoScenario(): User[] {
  for (const key of KEYS_TO_CLEAR) {
    localStorage.removeItem(key);
  }

  writeJson(USERS_KEY, MINIMAL_DEMO_USERS);
  writeJson(ENROLLMENTS_KEY, [DEMO_ENROLLMENT]);
  writeJson(PROFILES_KEY, buildDemoProfiles());
  writeJson(EVALUATIONS_KEY, [buildDemoEvaluation()]);
  writeJson(PROGRESS_KEY, {});
  localStorage.setItem(DEMO_VERSION_KEY, DEMO_DATA_VERSION);

  credentials.seedDefaults(MINIMAL_DEMO_USERS.map((u) => u.id));

  return MINIMAL_DEMO_USERS.filter((u) => u.active);
}

/** Alex nu e profil salvat — eliminăm eventuale înregistrări vechi din localStorage */
export function purgePersistedPlatformSettingsAdmin(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    const next = users.filter(
      (u) =>
        u.id !== PLATFORM_SETTINGS_ADMIN_ID &&
        u.email.toLowerCase() !== PLATFORM_SETTINGS_ADMIN_EMAIL.toLowerCase(),
    );
    if (next.length !== users.length) writeJson(USERS_KEY, next);
    credentials.removePassword(PLATFORM_SETTINGS_ADMIN_ID);
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
    if (users.length === 0) {
      resetMinimalDemoScenario();
    }
    purgePersistedPlatformSettingsAdmin();
  } catch {
    resetMinimalDemoScenario();
  }
}
