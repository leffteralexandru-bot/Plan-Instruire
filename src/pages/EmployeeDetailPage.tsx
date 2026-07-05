import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { EmployeeDossierView } from '@/components/admin/performance/EmployeeDossierView';
import { Card } from '@/components/ui/Card';
import { ingineriPath, INGINERI_ANGAJAT_PANEL_PATH, INGINERI_SUPERVISOR_PANEL_PATH } from '@/data/departments';
import { isSupervisorOf } from '@/lib/supervisor';

export function EmployeeDetailPage() {
  const { angajatId = '' } = useParams<{ angajatId: string }>();
  const { loading, canAccessAdmin, user } = useAuth();
  const { canViewEmployee, canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();

  if (loading) return null;

  if (!canViewEmployee(angajatId)) {
    return (
      <Card>
        <p className="text-sm text-red-600">Acces interzis — nu aveți permisiunea de a vizualiza acest profil.</p>
      </Card>
    );
  }

  const isSelf = user?.id === angajatId;
  const isSupervisorView = !!user && !isSelf && isSupervisorOf(user.id, angajatId);
  const backTo = isSelf
    ? INGINERI_ANGAJAT_PANEL_PATH
    : canAccessAdmin
      ? ingineriPath('/admin')
      : isSupervisorView && canOpenSupervisorPanel
        ? INGINERI_SUPERVISOR_PANEL_PATH
        : canOpenMentorPanel
          ? ingineriPath('/mentor')
          : INGINERI_ANGAJAT_PANEL_PATH;
  const backLabel = isSelf
    ? 'Panou Angajat'
    : canAccessAdmin
      ? 'Panou HR'
      : isSupervisorView && canOpenSupervisorPanel
        ? 'Panou Supervizor'
        : 'Panou Mentor';

  return <EmployeeDossierView angajatId={angajatId} backTo={backTo} backLabel={backLabel} />;
}

/** Ruta veche admin — redirecționează către ruta unificată */
export function LegacyAdminEmployeeRedirect() {
  const { angajatId = '' } = useParams<{ angajatId: string }>();
  return <Navigate to={ingineriPath(`/angajat/${angajatId}`)} replace />;
}
