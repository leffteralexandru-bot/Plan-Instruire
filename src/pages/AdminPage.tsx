import { Navigate } from 'react-router-dom';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { ingineriPath } from '@/data/departments';

export function AdminPage() {
  const { canAccessAdmin, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!canAccessAdmin) return <Navigate to={ingineriPath()} replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">
          {isAdmin ? 'Panou Administrator' : 'Panou HR'}
        </h1>
        <p className="text-corporate-muted mt-1">
          {isAdmin
            ? 'Vizibilitate totală — profile, evaluări, instruire, setări'
            : 'Gestiune resurse umane și performanță departament'}
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
