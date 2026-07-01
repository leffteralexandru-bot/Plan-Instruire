import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ingineriPath } from '@/data/departments';

export function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to={ingineriPath()} replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Admin / HR</h1>
        <p className="text-corporate-muted mt-1">Rapoarte agregate și configurare program</p>
      </div>
      <AdminDashboard />
    </div>
  );
}
