import { Link, useLocation, Navigate } from 'react-router-dom';
import { getDepartmentById, type DepartmentId } from '@/data/departments';
import { DEPARTMENT_PLAN_PREVIEWS } from '@/data/departmentPreviews';
import { DepartmentGlyph } from '@/components/departments/DepartmentGlyph';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function DepartmentComingSoonPage() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').filter(Boolean)[0] as DepartmentId;
  const department = getDepartmentById(segment);

  if (!department) return <Navigate to="/" replace />;
  if (department.planAvailable) return <Navigate to={department.route} replace />;

  const preview =
    department.id !== 'ingineri'
      ? DEPARTMENT_PLAN_PREVIEWS[department.id as keyof typeof DEPARTMENT_PLAN_PREVIEWS]
      : null;
  const icon = (
    <DepartmentGlyph id={department.id} className="h-8 w-8 text-corporate-gold" />
  );

  return (
    <div className="w-full max-w-screen-xl mx-auto space-y-6">
      <Link to="/" className="text-sm text-corporate-gold hover:underline inline-block">
        ← Înapoi la departamente
      </Link>

      <div className="text-center space-y-3">
        <span
          className="inline-flex h-16 w-16 items-center justify-center rounded-xl border border-corporate-gold/25 bg-corporate-gold-light/50"
          aria-hidden
        >
          {icon}
        </span>
        <Badge variant="default">Plan în pregătire</Badge>
        <h1 className="text-2xl font-semibold text-corporate-dark">{department.label}</h1>
        <p className="text-corporate-gold font-medium">{department.subtitle}</p>
        <p className="text-corporate-muted">{department.description}</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-3">
          Ce urmează pentru acest departament
        </h2>
        <p className="text-sm text-corporate-muted mb-4">
          Planul de instruire pentru <strong>{department.label}</strong> va fi adăugat în aplicație
          imediat ce documentele sunt finalizate de către artGRANIT. Durată estimată:{' '}
          <strong>{preview?.durationEstimate ?? 'în definire'}</strong>.
        </p>
        {preview && (
          <ul className="space-y-2">
            {preview.modules.map((module) => (
              <li
                key={module}
                className="flex items-start gap-2 text-sm text-corporate-dark rounded-lg bg-corporate-surface px-3 py-2"
              >
                <span className="text-corporate-gold shrink-0">○</span>
                {module}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-corporate-gold/20 bg-corporate-gold-light/30">
        <p className="text-sm text-corporate-stone">
          <strong>Notă HR:</strong> Până la publicarea planului, accesați departamentul{' '}
          <Link to="/ingineri" className="text-corporate-gold font-medium underline">
            Ingineri
          </Link>{' '}
          dacă aveți rol legat de proiectare. Pentru celelalte departamente, așteptați confirmarea
          de la resurse umane.
        </p>
      </Card>

      <div className="text-center">
        <Link to="/">
          <Button variant="secondary">Vezi toate departamentele</Button>
        </Link>
      </div>
    </div>
  );
}
