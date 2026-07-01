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
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const users = useMemo(() => userStore.getAllUsers(), [tick]);
  const mentors = useMemo(() => userStore.getMentors(), [tick]);
  const enrollments = useMemo(() => userStore.getEnrollments(), [tick]);
  const allTrainees = useMemo(() => userStore.getTraineeProfiles(), [tick]);

  const visibleTrainees = useMemo(() => {
    if (!user) return [];
    if (canViewAllTrainees(user)) return allTrainees;
    if (isMentorUser(user)) return userStore.getTraineeProfiles({ mentorId: user.id });
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
      }
      refresh();
      return created;
    },
    [refresh],
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
      const updated = userStore.assignMentor(enrollmentId, mentorId);
      refresh();
      return updated;
    },
    [refresh],
  );

  const setMentorStatus = useCallback(
    (userId: string, enabled: boolean) => {
      const updated = userStore.setMentorStatus(userId, enabled);
      refresh();
      return updated;
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      users,
      mentors,
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
    }),
    [
      users,
      mentors,
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
    ],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers în UsersProvider');
  return ctx;
}
