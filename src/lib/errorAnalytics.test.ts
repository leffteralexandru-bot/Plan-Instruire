import { describe, expect, it } from 'vitest';
import { buildErrorHeatmap, matchActToErrorIds } from '@/lib/errorAnalytics';
import type { ActConstatare } from '@/types';

const act: ActConstatare = {
  id: 'a1',
  proiectNume: 'Test',
  dataMasuratoare: '2026-06-01',
  eroriIdentificate: 'Abatere simetrie oglindă',
  abateriMasuratori: '3mm',
  masuriCorective: 'Remăsurare',
  createdAt: '2026-06-01T10:00:00Z',
};

describe('errorAnalytics', () => {
  it('mapează act la eroare oglindă artGRANIT', () => {
    expect(matchActToErrorIds(act)).toContain('e1');
  });

  it('buildErrorHeatmap numără apariții', () => {
    const heat = buildErrorHeatmap([act, act]);
    const e1 = heat.find((h) => h.errorId === 'e1');
    expect(e1?.count).toBe(2);
  });
});
