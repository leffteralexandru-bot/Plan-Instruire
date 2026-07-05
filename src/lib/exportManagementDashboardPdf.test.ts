import { describe, expect, it } from 'vitest';
import {
  buildExpertRecommendations,
  computeOrganizationalHealth,
} from '@/lib/exportManagementDashboardPdf';
import type { ManagementDashboardMetrics } from '@/lib/managementDashboard';

function baseMetrics(overrides: Partial<ManagementDashboardMetrics> = {}): ManagementDashboardMetrics {
  return {
    totalAngajati: 10,
    angajatiInInstruire: 5,
    progresInstruireMediu: 75,
    rataFinalizareInstruire: 80,
    certificateEmise: 4,
    evaluariLaTimp: 8,
    evaluariIntarziate: 0,
    evaluariInCurs: 2,
    rataEvaluariLaTimp: 100,
    eroriLunaCurenta: 0,
    planuriActiuneDeschise: 0,
    reInstruiriActive: 0,
    validariMentorPending: 0,
    trend: [],
    developmentGaps: [],
    ...overrides,
  };
}

describe('exportManagementDashboardPdf helpers', () => {
  it('calculează sănătate ridicată când indicatorii sunt buni', () => {
    const h = computeOrganizationalHealth(baseMetrics());
    expect(h.score).toBeGreaterThanOrEqual(80);
    expect(h.accent).toBe('ok');
  });

  it('scade sănătatea la evaluări întârziate și gap-uri', () => {
    const h = computeOrganizationalHealth(
      baseMetrics({
        evaluariIntarziate: 3,
        developmentGaps: [
          {
            angajatId: 'a1',
            angajatName: 'Test',
            scorMediu: 2.5,
            motiv: 'Scor sub 3,5',
            evaluationId: 'e1',
          },
        ],
        eroriLunaCurenta: 4,
      }),
    );
    expect(h.score).toBeLessThan(70);
    expect(h.accent).not.toBe('ok');
  });

  it('generează recomandări prioritare când există probleme', () => {
    const recs = buildExpertRecommendations(
      baseMetrics({ evaluariIntarziate: 2, validariMentorPending: 5 }),
    );
    expect(recs.some((r) => r.includes('P1'))).toBe(true);
    expect(recs.some((r) => r.includes('P2'))).toBe(true);
  });

  it('confirmă situație stabilă fără alerte', () => {
    const recs = buildExpertRecommendations(baseMetrics());
    expect(recs[0]).toMatch(/stabil/i);
  });
});
