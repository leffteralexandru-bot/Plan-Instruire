import type { DepartmentId } from '@/data/departments';
import type { TrainingEnrollment, TraineeProfile, User, UserRole } from '@/types';
import { hasRole, isAngajatUser, isMentorUser, normalizeRoles, canCreateRoles } from '@/lib/roles';
import { credentials, DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';
import { isSupabaseAuthEnabled } from '@/lib/authService';

const USERS_KEY = 'artgranit_users';
const ENROLLMENTS_KEY = 'artgranit_enrollments';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type RawUser = User & { role?: string };

function normalizeUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    roles: normalizeRoles(raw.roles, raw.role),
    active: raw.active !== false,
    createdAt: raw.createdAt ?? nowIso(),
  };
}

const SEED_USERS: User[] = [
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
  {
    id: 'u-mentor',
    name: 'Ing. Maria Ionescu',
    roles: ['mentor'],
    email: 'm.ionescu@artgranit.ro',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u-stagiar-1',
    name: 'Alexandru Popescu',
    roles: ['angajat'],
    email: 'a.popescu@artgranit.ro',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u-stagiar-2',
    name: 'Andrei Dumitrescu',
    roles: ['angajat', 'mentor'],
    email: 'a.dumitrescu@artgranit.ro',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u-stagiar-3',
    name: 'Cristina Marin',
    roles: ['angajat'],
    email: 'c.marin@artgranit.ro',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const SEED_ENROLLMENTS: TrainingEnrollment[] = [
  {
    id: 'enr-1',
    angajatId: 'u-stagiar-1',
    departmentId: 'ingineri',
    cohortId: 'cohort-2026-i',
    mentorId: 'u-mentor',
    programStart: '2026-06-01',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'enr-2',
    angajatId: 'u-stagiar-2',
    departmentId: 'ingineri',
    cohortId: 'cohort-2026-i',
    mentorId: 'u-mentor',
    programStart: '2026-06-15',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'enr-3',
    angajatId: 'u-stagiar-3',
    departmentId: 'ingineri',
    cohortId: 'cohort-2026-i',
    mentorId: 'u-mentor',
    programStart: '2026-05-20',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function seedIfEmpty(): void {
  let users = readJson<RawUser[]>(USERS_KEY, []);
  let enrollments = readJson<TrainingEnrollment[]>(ENROLLMENTS_KEY, []);

  if (users.length === 0) {
    writeJson(USERS_KEY, SEED_USERS);
    writeJson(ENROLLMENTS_KEY, SEED_ENROLLMENTS);
    credentials.seedDefaults(SEED_USERS.map((u) => u.id));
    return;
  }

  const byId = new Map(users.map((u) => [u.id, u]));
  let usersChanged = false;
  for (const seed of SEED_USERS) {
    if (!byId.has(seed.id)) {
      users.push(seed);
      usersChanged = true;
    }
  }

  const normalized = users.map((u) => normalizeUser(u));
  for (let i = 0; i < normalized.length; i++) {
    const legacy = users[i];
    if (legacy.email === 'e.vasilescu@artgranit.ro' && legacy.role === 'admin') {
      normalized[i] = { ...normalized[i], roles: ['hr'] };
      usersChanged = true;
    }
    if (legacy.role && !legacy.roles) {
      usersChanged = true;
    }
  }

  if (usersChanged) writeJson(USERS_KEY, normalized);

  if (enrollments.length === 0) {
    writeJson(ENROLLMENTS_KEY, SEED_ENROLLMENTS);
    return;
  }

  const enrByAngajat = new Set(enrollments.map((e) => e.angajatId));
  let enrChanged = false;
  for (const seed of SEED_ENROLLMENTS) {
    if (!enrByAngajat.has(seed.angajatId)) {
      enrollments.push(seed);
      enrChanged = true;
    }
  }
  if (enrChanged) writeJson(ENROLLMENTS_KEY, enrollments);

  credentials.seedDefaults(normalized.map((u) => u.id));
}

function loadUsers(): User[] {
  seedIfEmpty();
  return readJson<RawUser[]>(USERS_KEY, SEED_USERS).map((u) => normalizeUser(u));
}

function saveUsers(users: User[]): void {
  writeJson(USERS_KEY, users);
}

function loadEnrollments(): TrainingEnrollment[] {
  seedIfEmpty();
  return readJson<TrainingEnrollment[]>(ENROLLMENTS_KEY, SEED_ENROLLMENTS);
}

function saveEnrollments(enrollments: TrainingEnrollment[]): void {
  writeJson(ENROLLMENTS_KEY, enrollments);
}

export function toTraineeProfile(user: User, enrollment: TrainingEnrollment): TraineeProfile {
  return {
    ...user,
    enrollmentId: enrollment.id,
    mentorId: enrollment.mentorId,
    cohortId: enrollment.cohortId,
    departmentId: enrollment.departmentId,
    programStart: enrollment.programStart,
    enrollmentStatus: enrollment.status,
  };
}

function assertValidMentor(user: User | undefined): asserts user is User {
  if (!user || !isMentorUser(user)) {
    throw new Error('Mentor invalid — HR trebuie să acorde statutul de mentor.');
  }
}

export const userStore = {
  getUsers(): User[] {
    return loadUsers().filter((u) => u.active);
  },

  getAllUsers(): User[] {
    return loadUsers();
  },

  getUserById(id: string): User | undefined {
    return loadUsers().find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    const norm = email.toLowerCase().trim();
    return loadUsers().find((u) => u.email.toLowerCase() === norm && u.active);
  },

  getMentors(): User[] {
    return loadUsers().filter((u) => u.active && isMentorUser(u));
  },

  /** Profilul standard Administrator (afișat permanent la login) */
  getAdministratorProfiles(): User[] {
    return loadUsers().filter((u) => u.active && hasRole(u, 'admin'));
  },

  /** Profile HR create de Administrator */
  getHrProfiles(): User[] {
    return loadUsers().filter((u) => u.active && hasRole(u, 'hr'));
  },

  /** Profile demo — angajați & mentori temporari (instruire) */
  getTemporaryLoginProfiles(): User[] {
    return loadUsers().filter(
      (u) =>
        u.active &&
        !hasRole(u, 'admin') &&
        !hasRole(u, 'hr') &&
        (isAngajatUser(u) || isMentorUser(u)),
    );
  },

  verifyPassword(email: string, password: string): User | null {
    const user = userStore.getUserByEmail(email);
    if (!user || !password.trim()) return null;
    if (isSupabaseAuthEnabled()) return user;
    return credentials.verify(user.id, password) ? user : null;
  },

  createUser(
    actor: User,
    input: { name: string; email: string; roles: UserRole[]; password?: string },
  ): User {
    const roles = normalizeRoles(input.roles);
    if (!canCreateRoles(actor, roles)) {
      if (hasRole(actor, 'admin')) {
        throw new Error('Administratorul poate crea doar profile Resurse Umane (HR).');
      }
      if (hasRole(actor, 'hr')) {
        throw new Error('HR poate crea doar profile Angajat și Mentor.');
      }
      throw new Error('Nu aveți dreptul să creați acest tip de profil.');
    }

    const users = loadUsers();
    const email = input.email.toLowerCase().trim();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Există deja un utilizator cu acest email.');
    }
    if (!roles.length) throw new Error('Selectați cel puțin un rol.');

    const user: User = {
      id: newId('u'),
      name: input.name.trim(),
      email,
      roles,
      active: true,
      createdAt: nowIso(),
    };
    saveUsers([...users, user]);
    credentials.setPassword(user.id, input.password?.trim() || DEFAULT_PLATFORM_PASSWORD);
    return user;
  },

  getEnrollments(): TrainingEnrollment[] {
    return loadEnrollments();
  },

  getActiveEnrollmentForAngajat(angajatId: string): TrainingEnrollment | undefined {
    return loadEnrollments().find((e) => e.angajatId === angajatId && e.status === 'active');
  },

  getTraineeProfiles(filters?: {
    mentorId?: string;
    cohortId?: string;
    departmentId?: DepartmentId;
  }): TraineeProfile[] {
    const users = loadUsers().filter((u) => u.active);
    const enrollments = loadEnrollments().filter((e) => e.status === 'active');

    return users
      .map((u) => {
        const enr = enrollments.find((e) => e.angajatId === u.id);
        return enr ? toTraineeProfile(u, enr) : null;
      })
      .filter((p): p is TraineeProfile => {
        if (!p) return false;
        if (filters?.mentorId && p.mentorId !== filters.mentorId) return false;
        if (filters?.cohortId && p.cohortId !== filters.cohortId) return false;
        if (filters?.departmentId && p.departmentId !== filters.departmentId) return false;
        return true;
      });
  },

  updateUser(
    id: string,
    patch: Partial<Pick<User, 'name' | 'email' | 'roles' | 'active'>>,
  ): User {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Utilizator negăsit.');
    if (patch.email) {
      const email = patch.email.toLowerCase().trim();
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
        throw new Error('Există deja un utilizator cu acest email.');
      }
      patch = { ...patch, email };
    }
    if (patch.roles) {
      patch = { ...patch, roles: normalizeRoles(patch.roles) };
    }
    const updated = { ...users[idx], ...patch };
    users[idx] = updated;
    saveUsers(users);
    return updated;
  },

  /** HR acordă sau retrage statutul de mentor unui angajat */
  setMentorStatus(userId: string, enabled: boolean): User {
    const user = loadUsers().find((u) => u.id === userId);
    if (!user) throw new Error('Utilizator negăsit.');
    if (hasRole(user, 'admin') || hasRole(user, 'hr')) {
      throw new Error('Conturile Admin/HR nu primesc statut de mentor.');
    }

    let roles = [...user.roles];
    if (enabled) {
      if (!roles.includes('mentor')) roles.push('mentor');
      if (!roles.includes('angajat') && !roles.includes('mentor')) roles.push('angajat');
    } else {
      if (roles.length === 1 && roles[0] === 'mentor') {
        throw new Error('Utilizatorul este doar mentor — folosiți dezactivare profil.');
      }
      roles = roles.filter((r) => r !== 'mentor');
    }

    return userStore.updateUser(userId, { roles: normalizeRoles(roles) });
  },

  createEnrollment(input: {
    angajatId: string;
    departmentId: DepartmentId;
    cohortId: string;
    mentorId: string;
    programStart: string;
  }): TrainingEnrollment {
    const user = loadUsers().find((u) => u.id === input.angajatId);
    if (!user || !isAngajatUser(user)) {
      throw new Error('Înscrierea este permisă doar pentru angajați.');
    }
    const mentor = loadUsers().find((u) => u.id === input.mentorId);
    assertValidMentor(mentor);

    const enrollments = loadEnrollments();
    const existing = enrollments.find(
      (e) => e.angajatId === input.angajatId && e.status === 'active',
    );
    if (existing) {
      throw new Error('Angajatul are deja o înscriere activă. Editați înscrierea existentă.');
    }
    const enrollment: TrainingEnrollment = {
      id: newId('enr'),
      angajatId: input.angajatId,
      departmentId: input.departmentId,
      cohortId: input.cohortId,
      mentorId: input.mentorId,
      programStart: input.programStart,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveEnrollments([...enrollments, enrollment]);
    return enrollment;
  },

  updateEnrollment(
    id: string,
    patch: Partial<Pick<TrainingEnrollment, 'mentorId' | 'cohortId' | 'departmentId' | 'programStart' | 'status'>>,
  ): TrainingEnrollment {
    const enrollments = loadEnrollments();
    const idx = enrollments.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error('Înscriere negăsită.');
    if (patch.mentorId) {
      const mentor = loadUsers().find((u) => u.id === patch.mentorId);
      assertValidMentor(mentor);
    }
    const updated = { ...enrollments[idx], ...patch, updatedAt: nowIso() };
    enrollments[idx] = updated;
    saveEnrollments(enrollments);
    return updated;
  },

  assignMentor(enrollmentId: string, mentorId: string): TrainingEnrollment {
    return userStore.updateEnrollment(enrollmentId, { mentorId });
  },
};

export function getTrainees(): TraineeProfile[] {
  return userStore.getTraineeProfiles();
}

export function getTraineesForMentor(mentorId: string): TraineeProfile[] {
  return userStore.getTraineeProfiles({ mentorId });
}

export function getTraineesForCohort(cohortId: string): TraineeProfile[] {
  return userStore.getTraineeProfiles({ cohortId });
}

export function getLoginUsers(): User[] {
  return userStore.getUsers();
}
