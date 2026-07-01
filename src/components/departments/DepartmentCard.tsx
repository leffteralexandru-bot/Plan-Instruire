import { Link } from 'react-router-dom';
import type { Department } from '@/data/departments';
import { DepartmentGlyph } from '@/components/departments/DepartmentGlyph';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DepartmentCardProps {
  department: Department;
}

export function DepartmentCard({ department }: DepartmentCardProps) {
  const available = department.planAvailable;
  const targetTo = available ? department.route : `${department.route}/in-curand`;

  const inner = (
    <Card
      className={[
        'h-full transition-all',
        available
          ? 'border-corporate-gold/30 hover:border-corporate-gold hover:shadow-gold cursor-pointer group'
          : 'border-slate-200 hover:border-corporate-gold/40 hover:shadow-sm cursor-pointer group',
      ].join(' ')}
      padding="lg"
    >
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-corporate-gold/25 bg-corporate-gold-light text-corporate-gold">
            <DepartmentGlyph id={department.id} className="h-5 w-5" />
          </span>
          {available ? (
            <Badge variant="success">Disponibil</Badge>
          ) : (
            <Badge variant="default">În curând</Badge>
          )}
        </div>
        <div>
          <h2
            className={[
              'text-lg font-semibold text-corporate-dark group-hover:text-corporate-black',
            ].join(' ')}
          >
            {department.label}
          </h2>
          <p className="text-sm font-medium text-corporate-gold mt-0.5">{department.subtitle}</p>
        </div>
        <p className="text-sm text-corporate-muted flex-1">{department.description}</p>
        <p className="text-sm font-medium text-corporate-gold group-hover:underline">
          {available ? 'Intră în plan →' : 'Vezi detalii →'}
        </p>
      </div>
    </Card>
  );

  return (
    <Link to={targetTo} className="block h-full no-underline">
      {inner}
    </Link>
  );
}
