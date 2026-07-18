import { useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useStagiarSelection } from '@/context/StagiarContext';
import { AngajatPanelView } from '@/components/angajat/AngajatPanelView';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DesktopPageHeader } from '@/components/layout/DesktopPageHeader';
import { DesktopPageIntro } from '@/components/layout/DesktopPageIntro';
import {
  ingineriPath,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_SUPERVISOR_PANEL_PATH,
} from '@/data/departments';
import { adminPath } from '@/lib/adminRoutes';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { isAngajatUser, hasRole } from '@/lib/roles';
import { isSupervisorOf } from '@/lib/supervisor';

function PanelLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
    </div>
  );
}

/** Hub principal angajat — date personale, instruire, evaluări (izolat) */
export function AngajatPanelPage() {
  const { user, loading, canAccessAdmin, isAdmin, isHr } = useAuth();
  const { canViewEmployee, canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const [searchParams] = useSearchParams();
  const viewAs = searchParams.get('viewAs');
  const { setSelectedStagiarId } = useStagiarSelection();

  useEffect(() => {
    if (viewAs) setSelectedStagiarId(viewAs);
  }, [viewAs, setSelectedStagiarId]);

  if (loading) return <PanelLoading />;
  if (!user) return <Navigate to="/login" replace />;

  if (viewAs && canViewEmployee(viewAs)) {
    const profile = hrPerformanceStore.getProfile(viewAs);
    const name = profile ? `${profile.prenume} ${profile.nume}`.trim() : viewAs;
    const isSupervisorView = isSupervisorOf(user.id, viewAs);
    const backTo = canAccessAdmin
      ? ingineriPath('/admin')
      : isSupervisorView && canOpenSupervisorPanel
        ? INGINERI_SUPERVISOR_PANEL_PATH
        : canOpenMentorPanel
          ? ingineriPath('/mentor')
          : ingineriPath('/admin');
    const backLabel = canAccessAdmin
      ? 'Panou HR'
      : isSupervisorView && canOpenSupervisorPanel
        ? 'Panou Supervizor'
        : 'Panou Mentor';

    return (
      <div className="space-y-6">
        <Link to={backTo} className="text-sm text-corporate-gold font-medium hover:underline">
          ← Înapoi la {backLabel}
        </Link>
        <div>
          <Badge variant="info" className="mb-2">
            Vedere ca angajat
          </Badge>
          <DesktopPageHeader>
            <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Angajat — {name}</h1>
          </DesktopPageHeader>
          <DesktopPageIntro>
            Aceeași interfață pe care o vede angajatul în contul său — doar citire, fără acțiuni în
            numele lui.
          </DesktopPageIntro>
        </div>
        <AngajatPanelView viewAsId={viewAs} />
      </div>
    );
  }

  if (!isAngajatUser(user)) {
    return (
      <div className="space-y-6">
        <Card padding="md">
          <DesktopPageHeader>
            <h1 className="text-xl font-bold text-corporate-dark">Panou Angajat</h1>
          </DesktopPageHeader>
          <p className="text-sm text-corporate-muted mt-2 leading-relaxed">
            Această pagină este pentru conturile cu rol <strong>Angajat</strong>. Sunteți conectat ca{' '}
            <strong>{isAdmin ? 'Administrator' : isHr ? 'HR' : hasRole(user, 'mentor') ? 'Mentor' : 'utilizator staff'}</strong>.
          </p>
          <ul className="mt-4 text-sm text-corporate-muted space-y-2 list-disc list-inside">
            <li>Pentru a vedea panoul unui inginer: deschideți fișa din Panou HR → Angajați.</li>
            <li>
              Pentru test rapid: autentificați-vă cu numele <strong>Angajat</strong>.
            </li>
          </ul>
          <div className="flex flex-wrap gap-2 mt-5">
            {canAccessAdmin && (
              <>
                <Link to={INGINERI_ADMIN_DASHBOARD_PATH}>
                  <Button type="button" variant="secondary" size="sm">
                    Dashboard Administrator
                  </Button>
                </Link>
                <Link to={adminPath('angajati')}>
                  <Button type="button" variant="primary" size="sm">
                    Panou HR — Angajați
                  </Button>
                </Link>
              </>
            )}
            {isHr && !isAdmin && (
              <Link to={adminPath('angajati')}>
                <Button type="button" variant="primary" size="sm">
                  Panou HR — Angajați
                </Button>
              </Link>
            )}
            {canOpenMentorPanel && (
              <Link to={ingineriPath('/mentor')}>
                <Button type="button" variant="ghost" size="sm">
                  Panou Mentor
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <DesktopPageHeader>
          <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Angajat</h1>
        </DesktopPageHeader>
        <DesktopPageIntro>
          Datele dvs. personale, progres instruire și evaluări — vizibile doar pentru contul dvs.
        </DesktopPageIntro>
      </div>
      <AngajatPanelView />
    </div>
  );
}
