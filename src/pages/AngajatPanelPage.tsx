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
import { DEMO_ANGAJAT_ID } from '@/lib/seedMinimalDemo';

function PanelLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
    </div>
  );
}

/** Deep-link din PDF / hotspot: ref, ghid, doc sau device utilaj. */
function hasReferenceDeepLink(params: URLSearchParams): boolean {
  const ref = params.get('ref');
  const doc = params.get('doc');
  const ghid = params.get('ghid');
  const device = params.get('device');
  if (ref === 'guide' || ref === 'repo' || ref === 'equipment') return true;
  if (ghid === 'teren' || ghid === 'proiectare') return true;
  if (device) return true;
  return !!doc;
}

/** Hub principal angajat — date personale, instruire, evaluări (izolat) */
export function AngajatPanelPage() {
  const { user, loading, canAccessAdmin, isAdmin, isHr } = useAuth();
  const { canViewEmployee, canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const [searchParams] = useSearchParams();
  const viewAs = searchParams.get('viewAs');
  const referenceDeepLink = hasReferenceDeepLink(searchParams);
  const { setSelectedStagiarId } = useStagiarSelection();

  /** Staff pe deep-link ghid → preview pe demo angajat (deschide modulele din query). */
  const effectiveViewAs =
    viewAs ||
    (!isAngajatUser(user) && referenceDeepLink ? DEMO_ANGAJAT_ID : null);

  useEffect(() => {
    if (effectiveViewAs) setSelectedStagiarId(effectiveViewAs);
  }, [effectiveViewAs, setSelectedStagiarId]);

  if (loading) return <PanelLoading />;
  if (!user) {
    const next = `/ingineri/panou-angajat${searchParams.toString() ? `?${searchParams}` : ''}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (effectiveViewAs && (canViewEmployee(effectiveViewAs) || referenceDeepLink)) {
    const profile = hrPerformanceStore.getProfile(effectiveViewAs);
    const name = profile
      ? `${profile.prenume} ${profile.nume}`.trim()
      : effectiveViewAs === DEMO_ANGAJAT_ID
        ? 'Demo Angajat'
        : effectiveViewAs;
    const isSupervisorView = isSupervisorOf(user.id, effectiveViewAs);
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
    const isDeepLinkPreview = !viewAs && referenceDeepLink && !isAngajatUser(user);

    return (
      <div className="space-y-6">
        {!isAngajatUser(user) && (
          <Link to={backTo} className="text-sm text-corporate-gold font-medium hover:underline">
            ← Înapoi la {backLabel}
          </Link>
        )}
        <div>
          <Badge variant="info" className="mb-2">
            {isDeepLinkPreview ? 'Documentație ghid · preview' : 'Vedere ca angajat'}
          </Badge>
          <DesktopPageHeader>
            <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">
              Panou Angajat — {name}
            </h1>
          </DesktopPageHeader>
          <DesktopPageIntro>
            {isDeepLinkPreview
              ? 'Deschidere din linkul ghidului — același document ca în PDF / pe site.'
              : 'Aceeași interfață pe care o vede angajatul în contul său — doar citire, fără acțiuni în numele lui.'}
          </DesktopPageIntro>
        </div>
        <AngajatPanelView viewAsId={effectiveViewAs} />
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
            <strong>
              {isAdmin
                ? 'Administrator'
                : isHr
                  ? 'HR'
                  : hasRole(user, 'mentor')
                    ? 'Mentor'
                    : 'utilizator staff'}
            </strong>
            .
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
