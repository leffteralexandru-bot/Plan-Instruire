import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  canViewEmployee,
  canOpenMentorPanel,
  getAccessibleEmployeeIds,
} from '@/lib/accessControl';
import { isSubordinateOf } from '@/lib/supervisor';
import type { User } from '@/types';

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

const admin: User = {
  id: 'u-admin',
  name: 'Admin',
  roles: ['admin'],
  email: 'admin@test.ro',
  active: true,
  createdAt: '2026-01-01',
};

const hr: User = {
  id: 'u-hr',
  name: 'HR',
  roles: ['hr'],
  email: 'hr@test.ro',
  active: true,
  createdAt: '2026-01-01',
};

const mentor: User = {
  id: 'u-mentor',
  name: 'Mentor',
  roles: ['mentor'],
  email: 'mentor@test.ro',
  active: true,
  createdAt: '2026-01-01',
};

const angajat: User = {
  id: 'u-stagiar-1',
  name: 'Angajat',
  roles: ['angajat'],
  email: 'a@test.ro',
  active: true,
  createdAt: '2026-01-01',
};

describe('accessControl', () => {
  it('admin vede orice angajat', () => {
    expect(canViewEmployee(admin, 'u-stagiar-1')).toBe(true);
    expect(canViewEmployee(admin, 'u-stagiar-2')).toBe(true);
  });

  it('HR vede orice angajat', () => {
    expect(canViewEmployee(hr, 'u-stagiar-1')).toBe(true);
  });

  it('angajat vede doar propriul profil', () => {
    expect(canViewEmployee(angajat, 'u-stagiar-1')).toBe(true);
    expect(canViewEmployee(angajat, 'u-stagiar-2')).toBe(false);
  });

  it('mentor vede subordonații din înscriere', () => {
    expect(isSubordinateOf('u-mentor', 'u-stagiar-1')).toBe(true);
    expect(canViewEmployee(mentor, 'u-stagiar-1')).toBe(true);
    expect(canViewEmployee(mentor, 'u-hr')).toBe(false);
  });

  it('HR și admin deschid panou mentor; mentorul cu rol dedicat', () => {
    expect(canOpenMentorPanel(hr)).toBe(true);
    expect(canOpenMentorPanel(mentor)).toBe(true);
    expect(canOpenMentorPanel(admin)).toBe(true);
  });

  it('getAccessibleEmployeeIds limitează mentorul', () => {
    const ids = getAccessibleEmployeeIds(mentor);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toContain('u-stagiar-1');
    expect(ids).not.toContain('u-hr');
  });
});
