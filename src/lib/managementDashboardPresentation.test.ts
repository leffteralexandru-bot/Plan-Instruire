import { describe, expect, it } from 'vitest';
import type { ManagementDashboardMetrics } from '@/lib/managementDashboard';
import {
  getManagementKpiRows,
  getManagementTrendTableRows,
} from '@/lib/managementDashboardPresentation';

function baseMetrics(overrides: Partial<ManagementDashboardMetrics> = {}): ManagementDashboardMetrics {
  return {
    totalAngajati: 3,
    angajatiInInstruire: 1,
    progresInstruireMediu: 12,
    rataFinalizareInstruire: 0,
    certificateEmise: 0,
    evaluariLaTimp: 1,
    evaluariIntarziate: 0,
    evaluariInCurs: 1,
    rataEvaluariLaTimp: 100,
    eroriLunaCurenta: 2,
    planuriActiuneDeschise: 1,
    reInstruiriActive: 0,
    validariMentorPending: 4,
    trend: [
      { luna: '2026-06', eroriLuna: 1, progresMediu: 5, evaluariFinalizate: 0 },
      { luna: '2026-07', eroriLuna: 2, progresMediu: 12, evaluariFinalizate: 1 },
    ],
    developmentGaps: [],
    ...overrides,
  };
}

describe('managementDashboardPresentation', () => {
  it('expune aceleași KPI-uri pentru UI și PDF', () => {
    const metrics = baseMetrics();
    const rows = getManagementKpiRows(metrics);

    expect(rows).toHaveLength(8);
    expect(rows.find((r) => r.label === 'Erori luna curentă')?.value).toBe('2');
    expect(rows.find((r) => r.label === 'Planuri acțiune deschise')?.value).toBe('1');
    expect(rows.find((r) => r.label === 'Validări mentor')?.sub).toBe('pending');
  });

  it('expune același tabel trend pentru UI și PDF', () => {
    const metrics = baseMetrics();
    const rows = getManagementTrendTableRows(metrics.trend);

    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual({
      luna: expect.stringMatching(/2026/),
      erori: '2',
      progres: '12%',
      evaluari: '1',
    });
  });
});
