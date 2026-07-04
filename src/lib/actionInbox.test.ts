import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getActionInboxForRole } from '@/lib/actionInbox';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { createDefaultEvaluationStages } from '@/lib/evaluationStages';
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
  ls['artgranit_users'] = JSON.stringify([
    {
      id: 'u-hr',
      name: 'HR Test',
      email: 'hr@test.ro',
      roles: ['hr'],
      active: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'u-sup',
      name: 'Supervizor',
      email: 'sup@test.ro',
      roles: ['mentor'],
      active: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'u-ang',
      name: 'Angajat Test',
      email: 'ang@test.ro',
      roles: ['angajat'],
      active: true,
      createdAt: '2026-01-01',
    },
  ] as User[]);
  ls['artgranit_employee_profiles'] = JSON.stringify([
    {
      userId: 'u-ang',
      prenume: 'Angajat',
      nume: 'Test',
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
  ls['artgranit_evaluation_cycles'] = JSON.stringify([
    {
      id: 'eval-1',
      angajatId: 'u-ang',
      evaluatorId: 'u-sup',
      perioadaStart: '2026-01-01',
      perioadaEnd: '2026-04-01',
      termenReevaluare: '2026-04-01',
      status: 'in_curs',
      stages: createDefaultEvaluationStages().map((s, i) =>
        i === 0 ? { ...s, status: 'in_curs' as const } : s,
      ),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ]);
});

describe('actionInbox', () => {
  it('angajat primește acțiune auto-evaluare când etapa e activă', () => {
    hrPerformanceStore.ensureProfiles();
    const items = getActionInboxForRole('u-ang', 'employee');
    expect(items.some((i) => i.category === 'self_assessment')).toBe(true);
  });

  it('HR inbox conține doar excepții — nu validări mentor zilnice', () => {
    hrPerformanceStore.ensureProfiles();
    const items = getActionInboxForRole('u-hr', 'hr');
    expect(items.every((i) => i.hrException !== false)).toBe(true);
    expect(items.some((i) => i.title.includes('Validări pending'))).toBe(false);
  });

  it('supervizor primește evaluare când etapa mentor e activă', () => {
    hrPerformanceStore.ensureProfiles();
    ls['artgranit_evaluation_cycles'] = JSON.stringify([
      {
        id: 'eval-2',
        angajatId: 'u-ang',
        evaluatorId: 'u-sup',
        perioadaStart: '2026-01-01',
        perioadaEnd: '2026-04-01',
        termenReevaluare: '2026-04-01',
        status: 'in_curs',
        employeeSelfAssessment: {
          realizari: 'Realizări suficient de lungi pentru validare automată.',
          dificultati: 'Dificultăți test',
          obiectiveViitoare: 'Obiective test',
          completedAt: '2026-02-01',
        },
        stages: createDefaultEvaluationStages().map((s) => {
          if (s.id === 'auto_evaluare') return { ...s, status: 'completat' as const };
          if (s.id === 'evaluare_mentor') return { ...s, status: 'in_curs' as const };
          return s;
        }),
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    const items = getActionInboxForRole('u-sup', 'supervisor');
    expect(items.some((i) => i.title.includes('Evaluare supervizor'))).toBe(true);
  });
});
