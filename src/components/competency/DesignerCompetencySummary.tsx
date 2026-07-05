import { DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import { useEvaluationSettings } from '@/hooks/useEvaluationSettings';
import { evaluationOrdinalLabel, formatEvaluationRoDate } from '@/lib/evaluationDisplay';
import { formatCoeficientSalarial, levelLabel } from '@/lib/competencyScoring';
import type { DesignerCompetencyOutcome, DesignerCompetencyScores } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface DesignerCompetencySummaryProps {
  scores: DesignerCompetencyScores;
  outcome?: DesignerCompetencyOutcome;
  showSalaryCoefficient?: boolean;
  /** Ascunde tabelul pe criterii (vizualizare angajat) */
  hideCriteriaTable?: boolean;
  evaluatedOn?: string;
  evaluatedBy?: string;
  evaluationNumber?: number;
  nextEvaluationDate?: string;
}

export function DesignerCompetencySummary({
  scores,
  outcome,
  showSalaryCoefficient = false,
  hideCriteriaTable = false,
  evaluatedOn,
  evaluatedBy,
  evaluationNumber,
  nextEvaluationDate,
}: DesignerCompetencySummaryProps) {
  const { criteria } = useEvaluationSettings();
  const profile = outcome
    ? DESIGNER_COMPETENCY_LEVEL_PROFILES.find((p) => p.level === outcome.nivel)
    : undefined;

  return (
    <div className="space-y-4">
      {outcome && (
        <Card padding="sm" className="bg-corporate-surface space-y-1">
          {(evaluatedOn || evaluationNumber != null) && (
            <p className="font-medium text-corporate-dark">
              {evaluationNumber != null && evaluationOrdinalLabel(evaluationNumber)}
              {evaluationNumber != null && evaluatedOn && ' · '}
              {evaluatedOn && (
                <>
                  Evaluat de <strong>{evaluatedBy ?? '—'}</strong> la data de {formatEvaluationRoDate(evaluatedOn)}
                </>
              )}
            </p>
          )}
          <p className="text-corporate-dark">
            {outcome.nivelLabel}
            {outcome.incadrare && ` ${outcome.incadrare}`}
            {' · Total '}
            {outcome.total} / 40
          </p>
          {profile && (
            <p className="text-xs text-corporate-muted">
              Autonomie: {profile.autonomie} · Responsabilitate: {profile.responsabilitate}
            </p>
          )}
          {showSalaryCoefficient && (
            <p className="text-xs text-corporate-muted">
              Coeficient salarial: {formatCoeficientSalarial(outcome.coeficientSalarialPercent)}
            </p>
          )}
          {nextEvaluationDate && !showSalaryCoefficient && (
            <p className="text-xs text-corporate-gold font-medium pt-1">
              Următoarea evaluare: {formatEvaluationRoDate(nextEvaluationDate)}
            </p>
          )}
        </Card>
      )}

      {!hideCriteriaTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Criteriu</th>
                <th className="py-2 pr-2 text-center w-12">N1</th>
                <th className="py-2 pr-2 text-center w-12">N2</th>
                <th className="py-2 pr-2 text-center w-12">N3</th>
                <th className="py-2 text-center w-12">N4</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => {
                const level = scores[c.id];
                return (
                  <tr key={c.id} className="border-b border-corporate-border/60">
                    <td className="py-2 pr-3 text-corporate-dark">{c.label}</td>
                    {[1, 2, 3, 4].map((n) => (
                      <td key={n} className="py-2 text-center">
                        {level === n ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-corporate-gold text-corporate-black text-xs font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-corporate-muted/40">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export function DesignerCompetencyLevelBadge({ nivel }: { nivel: 1 | 2 | 3 | 4 }) {
  return <Badge variant="info">{levelLabel(nivel)}</Badge>;
}
