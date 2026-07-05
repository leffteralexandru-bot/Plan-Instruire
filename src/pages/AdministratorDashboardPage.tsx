import { Navigate } from 'react-router-dom';
import { AdministratorCommandCenter } from '@/components/admin/AdministratorCommandCenter';
import { useAuth } from '@/hooks/useAuth';
import { ingineriPath } from '@/data/departments';

/** Centru de comandă — exclusiv Administrator */
export function AdministratorDashboardPage() {
  const { loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!isAdmin) return <Navigate to={ingineriPath('/admin')} replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Dashboard</h1>
        <p className="text-corporate-muted mt-1">
          Comandă centralizată — toate departamentele și modulele HR într-o singură interfață.
        </p>
      </div>
      <AdministratorCommandCenter />
    </div>
  );
}
