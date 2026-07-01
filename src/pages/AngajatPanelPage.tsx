import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AngajatPanelView } from '@/components/angajat/AngajatPanelView';
import { ingineriPath } from '@/data/departments';
import { isAngajatUser } from '@/lib/roles';

/** Hub principal angajat — date personale, instruire, evaluări (izolat) */
export function AngajatPanelPage() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  if (!isAngajatUser(user)) {
    return <Navigate to={ingineriPath('/admin')} replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Angajat</h1>
        <p className="text-corporate-muted mt-1">
          Datele dvs. personale, progres instruire și evaluări — vizibile doar pentru contul dvs.
        </p>
      </div>
      <AngajatPanelView />
    </div>
  );
}
