import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DEPARTMENTS, departmentBasePath, getAvailableDepartments, ingineriPath } from '@/data/departments';
import { DepartmentCard } from '@/components/departments/DepartmentCard';
import { Card } from '@/components/ui/Card';

/** Stagiar cu un singur departament activ → intră direct în plan */
function StagiarAutoRedirect() {
  const { user, isStagiar } = useAuth();

  if (!isStagiar || !user?.departmentId) return null;

  const dept = DEPARTMENTS.find((d) => d.id === user.departmentId);
  if (dept?.planAvailable) {
    return <Navigate to={departmentBasePath(dept.id)} replace />;
  }

  return null;
}

export function DepartmentHubPage() {
  const { user, isMentor, isAdmin } = useAuth();
  const available = getAvailableDepartments();

  return (
    <>
      <StagiarAutoRedirect />

      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-corporate-dark">
            Plan Instruire & Adaptare Profesională
          </h1>
          <p className="text-corporate-muted">
            Bine ai venit{user ? `, ${user.name.split(' ')[0]}` : ''}! Selectează departamentul
            pentru care dorești să accesezi planul de instruire.
          </p>
        </div>

        {(isMentor || isAdmin) && (
          <Card className="border-corporate-gold/25 bg-corporate-gold-light/20">
            <p className="text-sm text-corporate-stone">
              <strong>Mentor / HR:</strong> Planul complet este disponibil pentru{' '}
              <strong>Ingineri</strong>. Accesați{' '}
              <Link to={ingineriPath('/admin')} className="text-corporate-gold underline">
                Admin HR
              </Link>{' '}
              sau{' '}
              <Link to={ingineriPath('/mentor')} className="text-corporate-gold underline">
                Panoul Mentor
              </Link>{' '}
              după ce intrați în departament.
            </p>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {DEPARTMENTS.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} />
          ))}
        </div>

        <p className="text-center text-xs text-corporate-muted max-w-xl mx-auto">
          {available.length} din {DEPARTMENTS.length} planuri active · Producție, Administrație și
          Management — în curând
        </p>
      </div>
    </>
  );
}
