import { Navigate } from 'react-router-dom';
import { INGINERI_ANGAJAT_PANEL_PATH } from '@/data/departments';

/** Alias vechi → Panou Angajat */
export function MyAccountPage() {
  return <Navigate to={INGINERI_ANGAJAT_PANEL_PATH} replace />;
}
