import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DepartmentId } from '@/data/departments';
import type { TrainingEnrollment, TraineeProfile, User, UserRole } from '@/types';
import { userStore } from '@/lib/userStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { useAuth } from '@/hooks/useAuth';
import { canViewAllTrainees, isMentorUser } from '@/lib/roles';

interface UsersContextValue {
  users: User[];
  mentors: User[];
  /** Orice angajat activ — poate fi ales mentor; devine mentor la atribuire */
  mentorCandidates: User[];
  enrollments: TrainingEnrollment[];
  /** Angajați vizibili pentru utilizatorul curent (mentor → doar ai săi) */
  visibleTrainees: TraineeProfile[];
  allTrainees: TraineeProfile[];
  refresh: () => void;
  createUser: (
    input: { name: string; email: string; roles: UserRole[]; password?: string },
  ) => User;
  updateUser: (
    id: string,
    patch: Partial<Pick<User, 'name' | 'email' | 'roles' | 'active'>>,
  ) => User;
  createEnrollment: (input: {
    angajatId: string;
    departmentId: DepartmentId;
    cohortId: string;
    mentorId: string;
    programStart: string;
  }) => TrainingEnrollment;
  updateEnrollment: (
    id: string,
    patch: Partial<
      Pick<TrainingEnrollment, 'mentorId' | 'cohortId' | 'departmentId' | 'programStart' | 'status'>
    >,
  ) => TrainingEnrollment;
  assignMentor: (enrollmentId: string, mentorId: string) => TrainingEnrollment;
  setMentorStatus: (userId: string, enabled: boolean) => User;
  resetUserPassword: (userId: string, newPassword: string) => void;
  archiveEmployee: (userId: string) => void;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const users = useMemo(() => userStore.getAllUsers(), [tick]);
  const mentors = useMemo(() => userStore.getMentors(), [tick]);
  const mentorCandidates = useMemo(() => userStore.getMentorCandidates(), [tick]);
  const enrollments = useMemo(() => userStore.getEnrollments(), [tick]);
  const allTrainees = useMemo(() => userStore.getTraineeProfiles(), [tick]);

  const visibleTrainees = useMemo(() => {
    if (!user) return [];
    if (canViewAllTrainees(user)) return allTrainees;
    const mine = userStore.getTraineeProfiles({ mentorId: user.id });
    if (mine.length > 0) return mine;
    if (isMentorUser(user)) return mine;
    return [];
  }, [user, allTrainees, tick]);

  const createUser = useCallback(
    (input: { name: string; email: string; roles: UserRole[]; password?: string }) => {
      if (!user) throw new Error('Autentificare necesară.');
      const created = userStore.createUser(user, input);
      if (input.roles.includes('angajat')) {
        hrPerformanceStore.createProfileForUser(created, {
          tipAngajat: 'incepator',
          departamentId: 'ingineri',
        });
      }
      refresh();
      return created;
    },
    [user, refresh],
  );

  const updateUser = useCallback(
    (id: string, patch: Partial<Pick<User, 'name' | 'email' | 'roles' | 'active'>>) => {
      const updated = userStore.updateUser(id, patch);
      refresh();
      return updated;
    },
    [refresh],
  );

  const createEnrollment = useCallback(
    (input: {
      angajatId: string;
      departmentId: DepartmentId;
      cohortId: string;
      mentorId: string;
      programStart: string;
    }) => {
      const created = userStore.createEnrollment(input);
      const profile = hrPerformanceStore.getProfile(input.angajatId);
      if (profile) {
        hrPerformanceStore.updateProfile(input.angajatId, {
          managerId: input.mentorId,
          departamentId: input.departmentId,
          tipAngajat: 'incepator',
        });
        hrPerformanceStore.recordPrincipalMentorChange(
          input.angajatId,
          undefined,
          input.mentorId,
          user ? { id: user.id, name: user.name } : undefined,
        );
      }
      refresh();
      return created;
    },
    [user, refresh],
  );

  const updateEnrollment = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<TrainingEnrollment, 'mentorId' | 'cohortId' | 'departmentId' | 'programStart' | 'status'>
      >,
    ) => {
      const updated = userStore.updateEnrollment(id, patch);
      refresh();
      return updated;
    },
    [refresh],
  );

  const assignMentor = useCallback(
    (enrollmentId: string, mentorId: string) => {
      const enrollment = userStore.getEnrollments().find((e) => e.id === enrollmentId);
      const previousMentorId = enrollment?.mentorId;
      const updated = userStore.assignMentor(enrollmentId, mentorId);
      if (enrollment && previousMentorId !== mentorId) {
        hrPerformanceStore.recordPrincipalMentorChange(
          enrollment.angajatId,
          previousMentorId,
          mentorId,
          user ? { id: user.id, name: user.name } : undefined,
        );
      }
      refresh();
      return updated;
    },
    [user, refresh],
  );

  const setMentorStatus = useCallback(
    (userId: string, enabled: boolean) => {
      const updated = userStore.setMentorStatus(userId, enabled);
      refresh();
      return updated;
    },
    [refresh],
  );

  const resetUserPassword = useCallback(
    (userId: string, newPassword: string) => {
      if (!user) throw new Error('Autentificare necesară.');
      userStore.resetUserPassword(user, userId, newPassword);
    },
    [user],
  );

  const archiveEmployee = useCallback(
    (userId: string) => {
      if (!user) throw new Error('Autentificare necesară.');
      userStore.archiveEmployee(user, userId);
      const profile = hrPerformanceStore.getProfile(userId);
      if (profile && profile.status !== 'incetat') {
        hrPerformanceStore.updateProfile(userId, { status: 'incetat' });
      }
      refresh();
    },
    [user, refresh],
  );

  const value = useMemo(
    () => ({
      users,
      mentors,
      mentorCandidates,
      enrollments,
      visibleTrainees,
      allTrainees,
      refresh,
      createUser,
      updateUser,
      createEnrollment,
      updateEnrollment,
      assignMentor,
      setMentorStatus,
      resetUserPassword,
      archiveEmployee,
    }),
    [
      users,
      mentors,
      mentorCandidates,
      enrollments,
      visibleTrainees,
      allTrainees,
      refresh,
      createUser,
      updateUser,
      createEnrollment,
      updateEnrollment,
      assignMentor,
      setMentorStatus,
      resetUserPassword,
      archiveEmployee,
    ],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers în UsersProvider');
  return ctx;
}
