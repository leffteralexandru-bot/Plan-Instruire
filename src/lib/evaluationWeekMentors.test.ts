import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  resolveWeeklyInstruireMentor,
  upsertWeeklyEvalMentor,
} from '@/lib/evaluationWeekMentors';
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

const profile: EmployeeProfile = {
  userId: 'u-ang',
  prenume: 'Test',
  nume: 'Angajat',
  functie: 'Inginer',
  departamentId: 'ingineri',
  dataAngajarii: '2026-01-01',
  managerId: 'u-mgr',
  status: 'activ',
  tipAngajat: 'incepator',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('evaluationWeekMentors', () => {
  it('folosește mentorul din înscriere când nu există override săptămânal', () => {
    ls.artgranit_users = JSON.stringify([{ id: 'u-ang', name: 'A', roles: ['angajat'], email: 'a@t.ro', active: true, createdAt: '2026-01-01' }]);
    ls.artgranit_enrollments = JSON.stringify([
      {
        id: 'enr-1',
        angajatId: 'u-ang',
        mentorId: 'u-mentor',
        cohortId: 'c1',
        departmentId: 'ingineri',
        programStart: '2026-01-01',
        status: 'active',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const result = resolveWeeklyInstruireMentor(profile, 2);
    expect(result.mentorId).toBe('u-mentor');
    expect(result.isOverride).toBe(false);
  });

  it('preferă override-ul săptămânal față de mentorul principal', () => {
    ls.artgranit_users = JSON.stringify([{ id: 'u-ang', name: 'A', roles: ['angajat'], email: 'a@t.ro', active: true, createdAt: '2026-01-01' }]);
    ls.artgranit_enrollments = JSON.stringify([
      {
        id: 'enr-1',
        angajatId: 'u-ang',
        mentorId: 'u-mentor',
        cohortId: 'c1',
        departmentId: 'ingineri',
        programStart: '2026-01-01',
        status: 'active',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const withWeek = {
      ...profile,
      weeklyEvalMentors: upsertWeeklyEvalMentor(undefined, 2, 'u-alt'),
    };
    const result = resolveWeeklyInstruireMentor(withWeek, 2);
    expect(result.mentorId).toBe('u-alt');
    expect(result.isOverride).toBe(true);
  });
});
