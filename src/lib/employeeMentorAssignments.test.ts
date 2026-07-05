import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getEmployeeMentorAssignments, profileLinkedToMentor } from '@/lib/employeeMentorAssignments';
import type { EmployeeProfile } from '@/types';

const ls: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(ls)) delete ls[k];
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => ls[k] ?? null,
    setItem: (k: string, v: string) => {
      ls[k] = v;
    },
    removeItem: (k: string) => {
      delete ls[k];
    },
    clear: () => {
      for (const k of Object.keys(ls)) delete ls[k];
    },
  });
});

const users = [
  { id: 'u-mentor', name: 'Mentor Ion', roles: ['mentor' as const], email: 'm@test.ro', active: true, createdAt: '2026-01-01' },
  { id: 'u-mgr', name: 'Manager Ana', roles: ['hr' as const], email: 'a@test.ro', active: true, createdAt: '2026-01-01' },
];

describe('getEmployeeMentorAssignments', () => {
  it('folosește supervizorul din profil și mentorul din înscriere', () => {
    ls.artgranit_users = JSON.stringify([
      { id: 'u-ang', name: 'Test Angajat', roles: ['angajat'], email: 'ang@test.ro', active: true, createdAt: '2026-01-01' },
      ...users,
    ]);
    ls.artgranit_employee_profiles = JSON.stringify([
      {
        userId: 'u-ang',
        prenume: 'Test',
        nume: 'Angajat',
        functie: 'Inginer',
        departamentId: 'ingineri',
        dataAngajarii: '2026-01-01',
        managerId: 'u-mgr',
        supervisorId: 'u-mgr',
        status: 'activ',
        tipAngajat: 'experimentat',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const profile = JSON.parse(ls.artgranit_employee_profiles)[0] as EmployeeProfile;
    const result = getEmployeeMentorAssignments(profile, users);
    expect(result.supervizor.name).toBe('Manager Ana');
  });
});

describe('profileLinkedToMentor', () => {
  it('include angajat cu înscriere finalizată la mentor', () => {
    ls.artgranit_users = JSON.stringify([
      { id: 'u-ang', name: 'Test Angajat', roles: ['angajat'], email: 'ang@test.ro', active: true, createdAt: '2026-01-01' },
      ...users,
    ]);
    ls.artgranit_enrollments = JSON.stringify([
      {
        id: 'enr-1',
        angajatId: 'u-ang',
        departmentId: 'ingineri',
        cohortId: 'c1',
        mentorId: 'u-mentor',
        programStart: '2026-01-01',
        status: 'completed',
        createdAt: '2026-01-01',
        updatedAt: '2026-02-01',
      },
    ]);
    ls.artgranit_employee_profiles = JSON.stringify([
      {
        userId: 'u-ang',
        prenume: 'Test',
        nume: 'Angajat',
        functie: 'Inginer',
        departamentId: 'ingineri',
        dataAngajarii: '2026-01-01',
        status: 'activ',
        tipAngajat: 'experimentat',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const profile = JSON.parse(ls.artgranit_employee_profiles)[0] as EmployeeProfile;
    expect(profileLinkedToMentor(profile, 'u-mentor')).toBe(true);
    expect(profileLinkedToMentor(profile, 'u-mgr')).toBe(false);
  });
});
