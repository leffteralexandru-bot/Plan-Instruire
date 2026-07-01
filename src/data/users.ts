import type { User } from '@/types';
import { getActiveCohort } from '@/data/cohorts';

const activeCohort = getActiveCohort();

export const DEMO_USERS: User[] = [
  {
    id: 'u-stagiar-1',
    name: 'Alexandru Popescu',
    role: 'stagiar',
    email: 'a.popescu@artgranit.ro',
    mentorId: 'u-mentor',
    programStart: '2026-06-01',
    cohortId: 'cohort-2026-i',
    departmentId: 'ingineri',
  },
  {
    id: 'u-stagiar-2',
    name: 'Andrei Dumitrescu',
    role: 'stagiar',
    email: 'a.dumitrescu@artgranit.ro',
    mentorId: 'u-mentor',
    programStart: '2026-06-15',
    cohortId: 'cohort-2026-i',
    departmentId: 'ingineri',
  },
  {
    id: 'u-stagiar-3',
    name: 'Cristina Marin',
    role: 'stagiar',
    email: 'c.marin@artgranit.ro',
    mentorId: 'u-mentor',
    programStart: '2026-05-20',
    cohortId: 'cohort-2026-i',
    departmentId: 'ingineri',
  },
  {
    id: 'u-mentor',
    name: 'Ing. Maria Ionescu',
    role: 'mentor',
    email: 'm.ionescu@artgranit.ro',
  },
  {
    id: 'u-admin',
    name: 'Elena Vasilescu (HR)',
    role: 'admin',
    email: 'e.vasilescu@artgranit.ro',
  },
];

export const STAGIARI = DEMO_USERS.filter((u) => u.role === 'stagiar');

export function getUserById(id: string) {
  return DEMO_USERS.find((u) => u.id === id);
}

export function getStagiariForMentor(mentorId: string) {
  return STAGIARI.filter((s) => s.mentorId === mentorId);
}

export function getStagiariForActiveCohort(): User[] {
  const cohortId = activeCohort.id;
  return STAGIARI.filter((s) => s.cohortId === cohortId);
}

export { activeCohort as ACTIVE_COHORT };
