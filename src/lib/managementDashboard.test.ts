import { describe, expect, it, beforeEach, vi } from 'vitest';
import { computeManagementDashboardMetrics } from '@/lib/managementDashboard';
import { createDefaultEvaluationStages } from '@/lib/evaluationStages';

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
      name: 'Test User',
      email: 'u1@test.ro',
      roles: ['angajat'],
      active: true,
      createdAt: '2026-01-01',
    },
  ]);
  ls['artgranit_enrollments'] = JSON.stringify([]);
  ls['artgranit_employee_profiles'] = JSON.stringify([
    {
      userId: 'u1',
      prenume: 'Test',
      nume: 'User',
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
      id: 'ev1',
      angajatId: 'u1',
      evaluatorId: 'u-sup',
      perioadaStart: '2026-01-01',
      perioadaEnd: '2026-04-01',
      termenReevaluare: '2026-04-01',
      status: 'in_curs',
      stages: createDefaultEvaluationStages(),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ]);
  ls['artgranit_error_cases'] = JSON.stringify([]);
  ls['artgranit_kpi_snapshots'] = JSON.stringify([]);
  ls['artgranit_settings'] = JSON.stringify({ programVersion: '1.0' });
});

describe('managementDashboard', () => {
  it('calculează metrici de bază', () => {
    const m = computeManagementDashboardMetrics([], '1.0');
    expect(m.totalAngajati).toBeGreaterThanOrEqual(1);
    expect(m.evaluariInCurs).toBeGreaterThanOrEqual(0);
    expect(m.rataEvaluariLaTimp).toBeGreaterThanOrEqual(0);
  });

  it('identifică gap de dezvoltare la scor mic', () => {
    ls['artgranit_evaluation_cycles'] = JSON.stringify([
      {
        id: 'ev2',
        angajatId: 'u1',
        evaluatorId: 'u-sup',
        perioadaStart: '2026-01-01',
        perioadaEnd: '2026-04-01',
        termenReevaluare: '2026-04-01',
        status: 'evaluat',
        dataEvaluare: '2026-03-01',
        scoruri: { calitate: 2, autonomie: 2, colaborare: 3, respectProceduri: 2 },
        concluzii: 'Test',
        stages: createDefaultEvaluationStages(),
        createdAt: '2026-01-01',
        updatedAt: '2026-03-01',
      },
    ]);
    const m = computeManagementDashboardMetrics([], '1.0');
    expect(m.developmentGaps.some((g) => g.angajatId === 'u1')).toBe(true);
  });
});
