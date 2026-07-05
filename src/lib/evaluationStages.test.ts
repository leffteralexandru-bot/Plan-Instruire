import { describe, expect, it } from 'vitest';
import {
  canHrFinalizeEvaluation,
  createDefaultEvaluationStages,
  getHrFinalizeBlockReason,
  getVisibleEvaluationStages,
  needsEvaluationWorkflowStart,
} from '@/lib/evaluationStages';
import type { EvaluationCycle } from '@/types';

function baseCycle(overrides: Partial<EvaluationCycle> = {}): EvaluationCycle {
  return {
    id: 'ev-1',
    angajatId: 'u-ang',
    evaluatorId: 'u-sup',
    perioadaStart: '2026-01-01',
    perioadaEnd: '2026-04-01',
    termenReevaluare: '2026-04-01',
    status: 'in_curs',
    stages: createDefaultEvaluationStages(),
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('evaluationStages sequential gating', () => {
  it('nu afișează etape înainte de pornire', () => {
    const cycle = baseCycle({ status: 'planificat' });
    expect(needsEvaluationWorkflowStart(cycle)).toBe(true);
    expect(getVisibleEvaluationStages(cycle)).toEqual([]);
  });

  it('afișează doar etapa 1 când auto-evaluarea este în curs', () => {
    const stages = createDefaultEvaluationStages();
    stages[0] = { ...stages[0]!, status: 'in_curs' };
    const visible = getVisibleEvaluationStages(baseCycle({ stages }));
    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe('auto_evaluare');
  });

  it('afișează etapa 2 doar după finalizarea etapei 1', () => {
    const stages = createDefaultEvaluationStages();
    stages[0] = { ...stages[0]!, status: 'completat' };
    stages[1] = { ...stages[1]!, status: 'in_curs' };
    const visible = getVisibleEvaluationStages(baseCycle({ stages }));
    expect(visible).toHaveLength(2);
    expect(visible[1]?.id).toBe('evaluare_mentor');
  });

  it('blochează finalizarea HR până la evaluarea supervizorului', () => {
    const stages = createDefaultEvaluationStages();
    stages[0] = { ...stages[0]!, status: 'completat' };
    stages[1] = { ...stages[1]!, status: 'in_curs' };
    const cycle = baseCycle({ stages });
    expect(canHrFinalizeEvaluation(cycle)).toBe(false);
    expect(getHrFinalizeBlockReason(cycle)).toMatch(/supervizor/i);
  });

  it('cere pornire chiar dacă există scoruri parțiale dar status planificat', () => {
    const cycle = baseCycle({
      status: 'planificat',
      competencySelfScores: {
        masuratori: 2,
        proliner: 2,
        autocad: 2,
        preventieErori: 2,
        cerinteTehnice: 2,
        autonomie: 2,
        comunicare: 2,
        instruire: 2,
        termene: 2,
        optimizareMaterial: 2,
      },
    });
    expect(needsEvaluationWorkflowStart(cycle)).toBe(true);
  });

  it('nu cere pornire după startEvaluationWorkflow', () => {
    const stages = createDefaultEvaluationStages();
    stages[0] = { ...stages[0]!, status: 'in_curs' };
    const cycle = baseCycle({ status: 'in_curs', stages });
    expect(needsEvaluationWorkflowStart(cycle)).toBe(false);
  });

  it('cere pornire când status întârziat dar auto-evaluarea nu a fost pornită', () => {
    const cycle = baseCycle({ status: 'intarziat' });
    expect(needsEvaluationWorkflowStart(cycle)).toBe(true);
  });

  it('cere pornire când status in_curs dar etapele sunt neîncepute', () => {
    const cycle = baseCycle({ status: 'in_curs' });
    expect(needsEvaluationWorkflowStart(cycle)).toBe(true);
  });

  it('permite finalizarea HR după evaluarea supervizorului', () => {
    const stages = createDefaultEvaluationStages();
    stages[0] = { ...stages[0]!, status: 'completat' };
    stages[1] = { ...stages[1]!, status: 'completat' };
    stages[2] = { ...stages[2]!, status: 'in_curs' };
    const cycle = baseCycle({ stages });
    expect(canHrFinalizeEvaluation(cycle)).toBe(true);
    expect(getHrFinalizeBlockReason(cycle)).toBeNull();
  });
});
