import { describe, expect, it } from 'vitest';
import {
  ERROR_REPEAT_THRESHOLD,
  ERROR_REPEAT_WINDOW_DAYS,
  getRecentSameMotivCases,
  shouldTriggerRepeatAlert,
} from '@/lib/errorRepeatEngine';
import type { ErrorCase } from '@/types';

function makeCase(
  id: string,
  angajatId: string,
  motiv: ErrorCase['motiv'],
  data: string,
): ErrorCase {
  return {
    id,
    angajatId,
    raportatDe: 'mentor-1',
    raportatDeNume: 'Mentor',
    data,
    proiectNume: 'Proiect test',
    motiv,
    descriere: 'Test',
    planActiune: {
      pasi: 'Corectare',
      responsabilId: 'mentor-1',
      termenLimita: data,
      status: 'deschis',
    },
    createdAt: `${data}T10:00:00.000Z`,
    updatedAt: `${data}T10:00:00.000Z`,
  };
}

describe('errorRepeatEngine', () => {
  it('numără erori de același motiv în fereastra de 90 zile', () => {
    const today = new Date().toISOString().slice(0, 10);
    const old = new Date();
    old.setDate(old.getDate() - (ERROR_REPEAT_WINDOW_DAYS + 5));
    const cases = [
      makeCase('1', 'a1', 'neatentie', today),
      makeCase('2', 'a1', 'neatentie', today),
      makeCase('3', 'a1', 'neatentie', old.toISOString().slice(0, 10)),
      makeCase('4', 'a1', 'comunicare', today),
    ];
    const recent = getRecentSameMotivCases(cases, 'a1', 'neatentie');
    expect(recent).toHaveLength(2);
  });

  it(`declanșează alertă la a ${ERROR_REPEAT_THRESHOLD}-a apariție`, () => {
    const today = new Date().toISOString().slice(0, 10);
    const cases = [makeCase('1', 'a1', 'materiale', today)];
    const newCase = makeCase('2', 'a1', 'materiale', today);
    const all = [...cases, newCase];
    const { trigger } = shouldTriggerRepeatAlert(all, newCase);
    expect(trigger).toBe(true);
  });

  it('nu declanșează alertă la prima apariție', () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCase = makeCase('1', 'a1', 'echipament', today);
    const { trigger } = shouldTriggerRepeatAlert([newCase], newCase);
    expect(trigger).toBe(false);
  });
});
