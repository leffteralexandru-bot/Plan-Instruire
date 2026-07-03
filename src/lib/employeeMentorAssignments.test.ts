import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getEmployeeMentorAssignments } from '@/lib/employeeMentorAssignments';
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
