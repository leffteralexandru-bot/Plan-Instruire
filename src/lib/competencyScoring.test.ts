import { describe, expect, it } from 'vitest';
import { defaultDesignerCompetencyScores } from '@/data/designerCompetencyMatrix';
import {
  computeCompetencyOutcome,
  isCompetencyScoresComplete,
  sumCompetencyScores,
} from '@/lib/competencyScoring';

describe('competencyScoring', () => {
  it('calculează total și nivel', () => {
    const scores = defaultDesignerCompetencyScores();
    scores.autocad = 4;
    scores.proliner = 4;
    expect(sumCompetencyScores(scores)).toBe(24);
    const outcome = computeCompetencyOutcome(scores);
    expect(outcome.nivel).toBe(2);
    expect(outcome.coeficientSalarialPercent).toBe(20);
  });

  it('nivel expert la scor maxim', () => {
    const scores = defaultDesignerCompetencyScores();
    for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
      scores[key] = 4;
    }
    const outcome = computeCompetencyOutcome(scores);
    expect(outcome.total).toBe(40);
    expect(outcome.nivel).toBe(4);
    expect(outcome.coeficientSalarialPercent).toBe(40);
  });

  it('validează scoruri complete', () => {
    expect(isCompetencyScoresComplete(defaultDesignerCompetencyScores())).toBe(true);
    expect(isCompetencyScoresComplete({ masuratori: 2 })).toBe(false);
  });
});
