import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  buildResponsibilityRows,
  filterResponsibilityRows,
  listMentorFilterOptions,
} from '@/lib/responsibilityOverview';
import type { EmployeeProfile, User } from '@/types';

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
  ls['artgranit_users'] = JSON.stringify([
    {
      id: 'u1',
      name: 'Ana Ionescu',
      email: 'ana@test.ro',
      roles: ['angajat'],
      active: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'u-sup',
      name: 'Supervizor Test',
      email: 'sup@test.ro',
      roles: ['mentor'],
      active: true,
      createdAt: '2026-01-01',
    },
  ]);
  ls['artgranit_enrollments'] = JSON.stringify([]);
  ls['artgranit_employee_profiles'] = JSON.stringify([
    {
      userId: 'u1',
      prenume: 'Ana',
      nume: 'Ionescu',
      functie: 'Inginer',
      departamentId: 'ingineri',
      dataAngajarii: '2026-01-01',
      supervisorId: 'u-sup',
      managerId: 'u-sup',
      status: 'activ',
      tipAngajat: 'experimentat',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ]);
  ls['artgranit_evaluation_cycles'] = JSON.stringify([]);
  ls['artgranit_error_cases'] = JSON.stringify([]);
});

const profiles: EmployeeProfile[] = [
  {
    userId: 'u1',
    prenume: 'Ana',
    nume: 'Ionescu',
    functie: 'Inginer',
    departamentId: 'ingineri',
    dataAngajarii: '2026-01-01',
    supervisorId: 'u-sup',
    managerId: 'u-sup',
    status: 'activ',
    tipAngajat: 'experimentat',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const users: User[] = [
  {
    id: 'u-sup',
    name: 'Supervizor Test',
    email: 'sup@test.ro',
    roles: ['mentor'],
    active: true,
    createdAt: '2026-01-01',
  },
];

describe('responsibilityOverview', () => {
  it('construiește rând cu supervizor', () => {
    const rows = buildResponsibilityRows(profiles, users);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.supervisorName).toBe('Supervizor Test');
    expect(rows[0]?.angajatName).toBe('Ana Ionescu');
  });

  it('filtrează după supervizor', () => {
    const rows = buildResponsibilityRows(profiles, users);
    const filtered = filterResponsibilityRows(rows, {
      mentorId: 'all',
      supervisorId: 'u-sup',
      search: '',
    });
    expect(filtered).toHaveLength(1);
    const empty = filterResponsibilityRows(rows, {
      mentorId: 'all',
      supervisorId: 'none',
      search: '',
    });
    expect(empty).toHaveLength(0);
  });

  it('listează mentori din rânduri', () => {
    const rows = buildResponsibilityRows(profiles, users);
    expect(listMentorFilterOptions(rows).length).toBeGreaterThanOrEqual(0);
  });
});
