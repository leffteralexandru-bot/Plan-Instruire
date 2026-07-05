import { DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import type { DesignerCompetencyLevel } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface CompetencyLevelGuideProps {
  /** Evidențiază nivelul obținut la ultima evaluare validată */
  activeLevel?: DesignerCompetencyLevel;
}

export function CompetencyLevelGuide({ activeLevel }: CompetencyLevelGuideProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DESIGNER_COMPETENCY_LEVEL_PROFILES.map((p) => {
        const isActive = activeLevel === p.level;
        return (
        <Card
          key={p.level}
          padding="sm"
          className={
            isActive
              ? 'ring-2 ring-corporate-gold border-corporate-gold bg-corporate-gold-light/25 shadow-sm'
              : undefined
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-corporate-dark">{p.title}</h3>
            {isActive && (
              <Badge variant="warning" className="text-[10px]">
                Nivelul tău
              </Badge>
            )}
          </div>
          <p className="text-xs text-corporate-muted mt-1">{p.subtitle}</p>
          <dl className="mt-2 text-xs space-y-1 text-corporate-muted">
            <div>
              <dt className="inline font-medium text-corporate-dark">Autonomie: </dt>
              <dd className="inline">{p.autonomie}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-corporate-dark">Responsabilitate: </dt>
              <dd className="inline">{p.responsabilitate}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-corporate-dark">Potrivit pentru: </dt>
              <dd className="inline">{p.potrivitPentru}</dd>
            </div>
          </dl>
        </Card>
        );
      })}
    </div>
  );
}
