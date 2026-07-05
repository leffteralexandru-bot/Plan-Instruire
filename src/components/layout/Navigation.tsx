import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import {
  ingineriPath,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_ANGAJAT_PANEL_PATH,
  INGINERI_PLAN_PATH,
  INGINERI_SUPERVISOR_PANEL_PATH,
} from '@/data/departments';
import { isAngajatMentor } from '@/lib/roles';
import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import { isTestingNavTarget } from '@/lib/testingStageGuide';
import { getTestingStageTheme } from '@/lib/testingStageThemes';
import { useLocation } from 'react-router-dom';

type NavLinkItem = { to: string; label: string; end?: boolean };

function buildNavLinks(
  isAdmin: boolean,
  isHr: boolean,
  canMentor: boolean,
  canSupervisor: boolean,
  isAngajat: boolean,
  angajatMentor: boolean,
): NavLinkItem[] {
  const links: NavLinkItem[] = [];

  if (isAdmin) {
    links.push({ to: INGINERI_ADMIN_DASHBOARD_PATH, label: 'Dashboard', end: true });
    links.push({ to: ingineriPath('/admin'), label: 'Panou HR' });
    if (canMentor) links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor' });
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor' });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    links.push({ to: ingineriPath('/competente'), label: 'Competențe' });
    return links;
  }

  if (isHr) {
    links.push({ to: ingineriPath('/admin'), label: 'Panou HR', end: true });
    links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor' });
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor' });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    links.push({ to: ingineriPath('/competente'), label: 'Competențe' });
    return links;
  }

  if (isAngajat) {
    links.push({ to: INGINERI_ANGAJAT_PANEL_PATH, label: 'Panou Angajat', end: true });
    links.push({ to: INGINERI_PLAN_PATH, label: 'Plan instruire' });
    if (angajatMentor && canMentor) {
      links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor (temp.)' });
    }
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor' });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    links.push({ to: ingineriPath('/competente'), label: 'Competențe' });
    return links;
  }

  if (canMentor) {
    links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor', end: true });
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor' });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    return links;
  }

  if (canSupervisor) {
    return [
      { to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', end: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări' },
    ];
  }

  return [{ to: INGINERI_PLAN_PATH, label: 'Dashboard', end: true }];
}

export function Navigation() {
  const { user, isAdmin, isHr, isAngajat } = useAuth();
  const { canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const guide = useTestingStageGuide();
  const location = useLocation();
  const navTheme = guide ? getTestingStageTheme(guide.category) : null;
  const angajatMentor = isAngajatMentor(user);
  const links = buildNavLinks(
    isAdmin,
    isHr,
    canOpenMentorPanel,
    canOpenSupervisorPanel,
    isAngajat,
    angajatMentor,
  );

  return (
    <nav className="border-t border-white/10 bg-corporate-black">
      <div className="app-width flex flex-wrap gap-1 py-2">
        {links.map((link) => {
          const testTarget = guide && navTheme && isTestingNavTarget(link.to, guide);
          return (
          <NavLink
            key={link.to + link.label}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              [
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0',
                isActive
                  ? 'bg-corporate-gold text-corporate-black'
                  : 'text-white/70 hover:text-corporate-gold hover:bg-white/5',
                testTarget ? `ring-2 ${navTheme.navRing} ring-offset-2 ring-offset-corporate-black` : '',
              ].join(' ')
            }
          >
            {link.label}
            {testTarget && !isTestingNavTarget(location.pathname, guide) ? ' →' : ''}
          </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
