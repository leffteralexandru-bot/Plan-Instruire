import { describe, expect, it } from 'vitest';
import { buildReTrainingDescriptionFromGroupedErrors } from '@/lib/errorRepeatEngine';
import type { ErrorCase } from '@/types';

function makeCase(id: string, data: string, motiv: ErrorCase['motiv'] = 'neatentie'): ErrorCase {
  return {
    id,
    angajatId: 'a1',
    raportatDe: 'hr',
    raportatDeNume: 'HR',
    data,
    motiv,
    descriere: 'Defect test',
    planActiune: {
      pasi: 'Corectare',
      responsabilId: 's',
      termenLimita: data,
      status: 'deschis',
    },
    createdAt: `${data}T10:00:00.000Z`,
    updatedAt: `${data}T10:00:00.000Z`,
  };
}

describe('buildReTrainingDescriptionFromGroupedErrors', () => {
  it('descrie sesiune cu o singură eroare', () => {
    const text = buildReTrainingDescriptionFromGroupedErrors([makeCase('1', '2026-07-01')]);
    expect(text).toContain('2026-07-01');
    expect(text).toContain('Neatenție');
  });

  it('descrie sesiune grupată cu mai multe erori', () => {
    const text = buildReTrainingDescriptionFromGroupedErrors([
      makeCase('1', '2026-07-01', 'neatentie'),
      makeCase('2', '2026-07-03', 'materiale'),
    ]);
    expect(text).toContain('grupată de HR');
    expect(text).toContain('2 erori');
    expect(text).toContain('2026-07-01');
    expect(text).toContain('2026-07-03');
  });
});
