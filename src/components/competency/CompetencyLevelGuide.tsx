import { DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import { Card } from '@/components/ui/Card';

export function CompetencyLevelGuide() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DESIGNER_COMPETENCY_LEVEL_PROFILES.map((p) => (
        <Card key={p.level} padding="sm">
          <h3 className="text-sm font-semibold text-corporate-dark">{p.title}</h3>
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
      ))}
    </div>
  );
}
