import type { DepartmentId } from '@/data/departments';
import type { TrainingEnrollment, TraineeProfile, User, UserRole } from '@/types';
import {
  canCreateRoles,
  canManageUsers,
  hasRole,
  isAngajatUser,
  isMentorUser,
  normalizeRoles,
} from '@/lib/roles';
import { credentials, DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';
import { isSupabaseAuthEnabled } from '@/lib/authService';
import {
  DEMO_LOGIN_HINTS,
  ensureMinimalDemoIfEmpty,
  MINIMAL_DEMO_USERS,
  resetMinimalDemoScenario,
} from '@/lib/seedMinimalDemo';
import {
  buildPlatformSettingsAdminUser,
  isPlatformSettingsAdminLogin,
  PLATFORM_SETTINGS_ADMIN_ID,
} from '@/lib/platformSettingsAdmin';

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

function seedIfEmpty(): void {
  ensureMinimalDemoIfEmpty();
  const users = readJson<RawUser[]>(USERS_KEY, []);
  if (users.length === 0) return;

  const normalized = users.map((u) => normalizeUser(u));
  let usersChanged = false;
  for (let i = 0; i < normalized.length; i++) {
    const legacy = users[i];
    if (legacy.email === 'e.vasilescu@artgranit.ro' && legacy.role === 'admin') {
      normalized[i] = { ...normalized[i], roles: ['hr'] };
      usersChanged = true;
    }
  }
  if (usersChanged) writeJson(USERS_KEY, normalized);
  credentials.seedDefaults(normalized.map((u) => u.id));
}

/** Asigură parole demo pentru profilele salvate (fără reîncărcare userStore) */
export function repairLoginCredentials(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users: { id: string }[] = raw ? (JSON.parse(raw) as { id: string }[]) : [];
    if (users.length > 0) {
      credentials.seedDefaults(users.map((u) => u.id));
    }
  } catch {
    /* ignore */
  }
}

/** Reîncarcă scenariul demo minimal (1 angajat + supervizor + mentor) */
export function repairDemoProfiles(): User[] {
  return resetMinimalDemoScenario();
}

export { DEMO_LOGIN_HINTS };

function loadUsers(): User[] {
  seedIfEmpty();
  return readJson<RawUser[]>(USERS_KEY, MINIMAL_DEMO_USERS).map((u) => normalizeUser(u));
}

function saveUsers(users: User[]): void {
  writeJson(USERS_KEY, users);
}

function loadEnrollments(): TrainingEnrollment[] {
  seedIfEmpty();
  return readJson<TrainingEnrollment[]>(ENROLLMENTS_KEY, []);
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

function assertMentorAssignable(
  user: User | undefined,
  angajatId?: string,
): asserts user is User {
  if (!user || !user.active) {
    throw new Error('Mentor invalid — selectați un angajat activ.');
  }
  if (hasRole(user, 'admin') || hasRole(user, 'hr')) {
    throw new Error('Conturile Admin/HR nu pot fi mentori.');
  }
  if (!isAngajatUser(user) && !isMentorUser(user)) {
    throw new Error('Doar angajații pot fi mentori.');
  }
  if (angajatId && user.id === angajatId) {
    throw new Error('Angajatul nu poate fi propriul mentor.');
  }
}

function ensureMentorRole(mentorId: string): void {
  const mentor = loadUsers().find((u) => u.id === mentorId);
  if (!mentor || isMentorUser(mentor)) return;
  userStore.setMentorStatus(mentorId, true);
}

export const userStore = {
  getUsers(): User[] {
    return loadUsers().filter((u) => u.active);
  },

  getAllUsers(): User[] {
    return loadUsers();
  },

  getUserById(id: string): User | undefined {
    if (id === PLATFORM_SETTINGS_ADMIN_ID) {
      return buildPlatformSettingsAdminUser();
    }
    return loadUsers().find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    const norm = email.toLowerCase().trim();
    return loadUsers().find((u) => u.email.toLowerCase() === norm && u.active);
  },

  getMentors(): User[] {
    return loadUsers().filter((u) => u.active && isMentorUser(u));
  },

  /** Orice angajat activ poate fi ales mentor — devine mentor la atribuire */
  getMentorCandidates(excludeUserId?: string): User[] {
    return loadUsers()
      .filter(
        (u) =>
          u.active &&
          !hasRole(u, 'admin') &&
          !hasRole(u, 'hr') &&
          (isAngajatUser(u) || isMentorUser(u)) &&
          u.id !== excludeUserId,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'));
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
    if (!password.trim()) return null;
    if (isPlatformSettingsAdminLogin(email, password)) {
      return buildPlatformSettingsAdminUser();
    }
    const user = userStore.getUserByEmail(email);
    if (!user) return null;
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

  resetUserPassword(actor: User, userId: string, newPassword: string): void {
    if (!canManageUsers(actor)) {
      throw new Error('Nu aveți dreptul să modificați parole.');
    }
    if (isSupabaseAuthEnabled()) {
      throw new Error(
        'Parolele se gestionează în Supabase Auth când autentificarea cloud este activă.',
      );
    }
    const target = loadUsers().find((u) => u.id === userId);
    if (!target) throw new Error('Utilizator negăsit.');
    if (hasRole(target, 'admin') || hasRole(target, 'hr')) {
      throw new Error('Nu puteți reseta parola conturilor Admin/HR din acest panou.');
    }
    const pwd = newPassword.trim();
    if (pwd.length < 6) {
      throw new Error('Parola trebuie să aibă cel puțin 6 caractere.');
    }
    credentials.setPassword(userId, pwd);
  },

  archiveEmployee(actor: User, userId: string): void {
    if (!canManageUsers(actor)) {
      throw new Error('Nu aveți dreptul să arhivați angajați.');
    }
    if (actor.id === userId) {
      throw new Error('Nu vă puteți arhiva propriul cont.');
    }
    const target = loadUsers().find((u) => u.id === userId);
    if (!target) throw new Error('Utilizator negăsit.');
    if (hasRole(target, 'admin') || hasRole(target, 'hr')) {
      throw new Error('Nu puteți arhiva conturi Admin sau HR.');
    }
    if (!isAngajatUser(target) && !isMentorUser(target)) {
      throw new Error('Doar angajații pot fi arhivați din acest panou.');
    }

    const menteeCount = loadEnrollments().filter(
      (e) => e.status === 'active' && e.mentorId === userId,
    ).length;
    if (menteeCount > 0) {
      throw new Error(
        `Angajatul este mentor principal pentru ${menteeCount} persoane. Reatribuiți mentorul înainte de arhivare.`,
      );
    }

    const enrollments = loadEnrollments();
    let enrollmentsChanged = false;
    const updatedEnrollments = enrollments.map((e) => {
      if (e.angajatId !== userId || e.status !== 'active') return e;
      enrollmentsChanged = true;
      return { ...e, status: 'suspended' as const, updatedAt: nowIso() };
    });
    if (enrollmentsChanged) saveEnrollments(updatedEnrollments);

    userStore.updateUser(userId, { active: false });
  },

  getEnrollments(): TrainingEnrollment[] {
    return loadEnrollments();
  },

  getActiveEnrollmentForAngajat(angajatId: string): TrainingEnrollment | undefined {
    return loadEnrollments().find((e) => e.angajatId === angajatId && e.status === 'active');
  },

  /** Înscriere activă sau finalizată — acces plan / certificat */
  getEnrollmentForAngajat(angajatId: string): TrainingEnrollment | undefined {
    return loadEnrollments().find(
      (e) => e.angajatId === angajatId && (e.status === 'active' || e.status === 'completed'),
    );
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

  ensureMentorOnAssignment(mentorId: string, angajatId?: string): void {
    const mentor = loadUsers().find((u) => u.id === mentorId);
    assertMentorAssignable(mentor, angajatId);
    ensureMentorRole(mentorId);
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
    assertMentorAssignable(mentor, input.angajatId);
    ensureMentorRole(input.mentorId);

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
      assertMentorAssignable(mentor, enrollments[idx].angajatId);
      ensureMentorRole(patch.mentorId);
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
