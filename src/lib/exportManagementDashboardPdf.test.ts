import { describe, expect, it } from 'vitest';
import {
  buildExecutiveSummaryText,
  buildExpertRecommendations,
  computeOrganizationalHealth,
} from '@/lib/exportManagementDashboardPdf';
import type { ManagementDashboardMetrics } from '@/lib/managementDashboard';
import { formatManagementTrendMonth } from '@/lib/managementDashboard';

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

  it('rezumatul executiv reflectă KPI din dashboard', () => {
    const metrics = baseMetrics({
      totalAngajati: 7,
      angajatiInInstruire: 3,
      progresInstruireMediu: 42,
      rataFinalizareInstruire: 33,
      certificateEmise: 1,
      rataEvaluariLaTimp: 100,
      evaluariIntarziate: 0,
      evaluariInCurs: 2,
      eroriLunaCurenta: 0,
      reInstruiriActive: 0,
      developmentGaps: [],
    });
    const health = computeOrganizationalHealth(metrics).score;
    const summary = buildExecutiveSummaryText(metrics, health);

    expect(summary).toContain('7 angajați activi');
    expect(summary).toContain('3 participanți');
    expect(summary).toContain('42%');
    expect(summary).toContain('33%');
    expect(summary).toContain('1 certificate');
    expect(summary).toContain('100% la timp');
  });

  it('formatează lunile trend la fel în dashboard și PDF', () => {
    expect(formatManagementTrendMonth('2026-07', 'full')).toMatch(/2026/);
    expect(formatManagementTrendMonth('2026-07', 'compact')).not.toMatch(/2026/);
  });
});
