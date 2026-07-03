import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SupervisorPanel } from '@/components/supervisor/SupervisorPanel';
import { ingineriPath } from '@/data/departments';
import { useAccessControl } from '@/hooks/useAccessControl';

export function SupervisorPage() {
  const { loading } = useAuth();
  const { canOpenSupervisorPanel } = useAccessControl();
  if (loading) return null;
  if (!canOpenSupervisorPanel) return <Navigate to={ingineriPath()} replace />;

  return <SupervisorPanel />;
}
