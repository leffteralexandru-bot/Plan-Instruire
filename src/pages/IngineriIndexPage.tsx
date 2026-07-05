import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  INGINERI_ANGAJAT_PANEL_PATH,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_PLAN_PATH,
} from '@/data/departments';
import { hasRole, isAngajatUser } from '@/lib/roles';

/** /ingineri — redirecționare pe rol */
export function IngineriIndexPage() {
  const { user, loading, canAccessAdmin } = useAuth();

  if (loading || !user) return null;

  if (isAngajatUser(user) && !hasRole(user, 'admin') && !hasRole(user, 'hr')) {
    return <Navigate to={INGINERI_ANGAJAT_PANEL_PATH} replace />;
  }

  if (canAccessAdmin) {
    return <Navigate to={INGINERI_ADMIN_DASHBOARD_PATH} replace />;
  }

  return <Navigate to={INGINERI_PLAN_PATH} replace />;
}
