import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DEPARTMENTS, getAvailableDepartments, INGINERI_ANGAJAT_PANEL_PATH, ingineriPath } from '@/data/departments';
import { Card } from '@/components/ui/Card';

/** Angajat autentificat → Panou Angajat (hub principal) */
function AngajatAutoRedirect() {
  const { isAngajat, loading } = useAuth();

  if (loading || !isAngajat) return null;

  return <Navigate to={INGINERI_ANGAJAT_PANEL_PATH} replace />;
}

export function DepartmentHubPage() {
  const { user, canAccessMentor, canAccessAdmin } = useAuth();
  const available = getAvailableDepartments();
  const comingSoon = DEPARTMENTS.filter((d) => !d.planAvailable);

  return (
    <>
      <AngajatAutoRedirect />

      <div className="space-y-6 w-full">
        <div className="space-y-3 pt-2 text-center">
          <h1 className="text-2xl font-semibold text-corporate-dark @md:text-3xl">
            Plan Instruire & Adaptare Profesională
          </h1>
          <p className="text-sm text-corporate-muted @md:text-base">
            Bine ai venit{user ? `, ${user.name.split(' ')[0]}` : ''}! Alege departamentul din bara de
            sus pentru a accesa planul de instruire.
          </p>
        </div>

        {(canAccessMentor || canAccessAdmin) && (
          <Card className="border-corporate-gold/25 bg-corporate-gold-light/20">
            <p className="text-sm text-corporate-stone">
              <strong>Mentor / HR:</strong> Planul complet este disponibil pentru{' '}
              <strong>Ingineri</strong>. Accesați{' '}
              <Link to={ingineriPath('/admin')} className="text-corporate-gold underline">
                Panoul HR
              </Link>{' '}
              sau{' '}
              <Link to={ingineriPath('/mentor')} className="text-corporate-gold underline">
                Panoul Mentor
              </Link>{' '}
              după ce intrați în departament.
            </p>
          </Card>
        )}

        <p className="text-center text-xs text-corporate-muted">
          {available.length} din {DEPARTMENTS.length} planuri active
          {comingSoon.length > 0 && (
            <>
              {' '}
              · {comingSoon.map((d) => d.label).join(', ')} — în curând
            </>
          )}
        </p>
      </div>
    </>
  );
}
