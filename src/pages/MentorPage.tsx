import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { MentorPanel } from '@/components/mentor/MentorPanel';
import { adminPath } from '@/lib/adminRoutes';
import { ingineriPath } from '@/data/departments';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

export function MentorPage() {
  const { loading, user } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  const { visibleTrainees } = useUsers();

  if (loading) return null;
  if (!canOpenMentorPanel) return <Navigate to={ingineriPath()} replace />;

  if (visibleTrainees.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <h1 className="text-xl font-semibold text-corporate-dark mb-2">Panou Mentor</h1>
        <p className="text-sm text-amber-900">
          Nu există angajați în instruire asignați ție sau în sistem.
        </p>
        <p className="text-sm text-amber-800 mt-2">
          HR: creați o înscriere din{' '}
          <Link to={adminPath('setari')} className="text-corporate-gold font-medium hover:underline">
            Panou HR → Setări → Planificare angajat
          </Link>{' '}
          și asignați mentor principal.
        </p>
        {user && (
          <p className="text-xs text-corporate-muted mt-3">
            Cont curent: {user.email} · roluri: {user.roles.join(', ')}
          </p>
        )}
      </Card>
    );
  }

  return <MentorPanel />;
}
