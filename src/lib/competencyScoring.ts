import { DESIGNER_COMPETENCY_BANDS, DESIGNER_COMPETENCY_CRITERION_IDS } from '@/data/designerCompetencyMatrix';
import type {
  DesignerCompetencyCriterionId,
  DesignerCompetencyLevel,
  DesignerCompetencyOutcome,
  DesignerCompetencyScores,
  EvaluationScores,
} from '@/types';

export function isCompetencyScoresComplete(
  scores?: Partial<DesignerCompetencyScores>,
): scores is DesignerCompetencyScores {
  if (!scores) return false;
  return DESIGNER_COMPETENCY_CRITERION_IDS.every((id) => {
    const v = scores[id];
    return v === 1 || v === 2 || v === 3 || v === 4;
  });
}

export function sumCompetencyScores(scores: DesignerCompetencyScores): number {
  return DESIGNER_COMPETENCY_CRITERION_IDS.reduce((sum, id) => sum + scores[id], 0);
}

export function computeCompetencyOutcome(scores: DesignerCompetencyScores): DesignerCompetencyOutcome {
  const total = sumCompetencyScores(scores);
  const band =
    DESIGNER_COMPETENCY_BANDS.find((b) => total >= b.minTotal && total <= b.maxTotal) ??
    DESIGNER_COMPETENCY_BANDS[0];

  return {
    scores,
    total,
    nivel: band.level,
    nivelLabel: band.label,
    incadrare: band.incadrare,
    coeficientSalarialPercent: band.coeficientSalarialPercent,
    computedAt: new Date().toISOString(),
  };
}

/** Mapare către scorurile generice folosite în dashboard-uri existente */
export function competencyToEvaluationScores(scores: DesignerCompetencyScores): EvaluationScores {
  const clamp = (n: number): 1 | 2 | 3 | 4 | 5 =>
    Math.min(5, Math.max(1, Math.round(n))) as 1 | 2 | 3 | 4 | 5;
  const avg = (keys: DesignerCompetencyCriterionId[]) =>
    keys.reduce((a, k) => a + scores[k], 0) / keys.length;

  return {
    calitate: clamp(avg(['autocad', 'preventieErori', 'cerinteTehnice'])),
    autonomie: clamp(avg(['autonomie', 'masuratori', 'proliner'])),
    colaborare: clamp(avg(['comunicare', 'instruire'])),
    respectProceduri: clamp(avg(['termene', 'optimizareMaterial', 'preventieErori'])),
  };
}

export function formatCoeficientSalarial(percent: number): string {
  return percent === 0 ? '0%' : `+${percent}%`;
}

export function levelLabel(level: DesignerCompetencyLevel): string {
  const labels: Record<DesignerCompetencyLevel, string> = {
    1: 'Nivel 1 — Începător',
    2: 'Nivel 2 — Mediu',
    3: 'Nivel 3 — Avansat',
    4: 'Nivel 4 — Expert',
  };
  return labels[level];
}
