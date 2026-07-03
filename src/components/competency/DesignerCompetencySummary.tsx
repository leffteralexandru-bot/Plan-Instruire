import { DESIGNER_COMPETENCY_CRITERIA, DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import { formatCoeficientSalarial, levelLabel } from '@/lib/competencyScoring';
import type { DesignerCompetencyOutcome, DesignerCompetencyScores } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface DesignerCompetencySummaryProps {
  scores: DesignerCompetencyScores;
  outcome?: DesignerCompetencyOutcome;
  showSalaryCoefficient?: boolean;
}

export function DesignerCompetencySummary({
  scores,
  outcome,
  showSalaryCoefficient = false,
}: DesignerCompetencySummaryProps) {
  const profile = outcome
    ? DESIGNER_COMPETENCY_LEVEL_PROFILES.find((p) => p.level === outcome.nivel)
    : undefined;

  return (
    <div className="space-y-4">
      {outcome && (
        <Card padding="sm" className="bg-corporate-surface">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="info">{outcome.nivelLabel}</Badge>
            <span className="text-sm font-medium text-corporate-dark">{outcome.incadrare}</span>
            <span className="text-sm text-corporate-muted">· Total {outcome.total} / 40</span>
            {showSalaryCoefficient && (
              <Badge variant="warning">
                Coeficient salarial: {formatCoeficientSalarial(outcome.coeficientSalarialPercent)}
              </Badge>
            )}
          </div>
          {profile && (
            <p className="text-xs text-corporate-muted">
              Autonomie: {profile.autonomie} · Responsabilitate: {profile.responsabilitate}
            </p>
          )}
        </Card>
      )}

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
            {DESIGNER_COMPETENCY_CRITERIA.map((c) => {
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

      {outcome && profile && (
        <p className="text-xs text-corporate-muted">
          Profil: {profile.title} — potrivit pentru {profile.potrivitPentru}.
        </p>
      )}
    </div>
  );
}

export function DesignerCompetencyLevelBadge({ nivel }: { nivel: 1 | 2 | 3 | 4 }) {
  return <Badge variant="info">{levelLabel(nivel)}</Badge>;
}
