import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { isAngajatMentor } from '@/lib/roles';
import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import { isTestingNavTarget } from '@/lib/testingStageGuide';
import { getTestingStageTheme } from '@/lib/testingStageThemes';
import { buildAppNavLinks } from '@/lib/appNavigation';
import { NAV_INNER, TOUCH_TARGET } from '@/lib/responsiveLayout';
import { NavIcon } from '@/components/layout/NavIcon';

export function Navigation() {
  const { user, isAdmin, isHr, isAngajat } = useAuth();
  const { canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const guide = useTestingStageGuide();
  const location = useLocation();
  const navTheme = guide ? getTestingStageTheme(guide.category) : null;
  const links = buildAppNavLinks(
    isAdmin,
    isHr,
    canOpenMentorPanel,
    canOpenSupervisorPanel,
    isAngajat,
    isAngajatMentor(user),
  );

  return (
    <nav
      className="border-t border-white/10 bg-corporate-black"
      aria-label="Navigare principală"
    >
      <div className={NAV_INNER}>
        {links.map((link) => {
          const testTarget = guide && navTheme && isTestingNavTarget(link.to, guide);
          return (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={link.end}
              title={link.label}
              className={({ isActive }) =>
                [
                  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  TOUCH_TARGET,
                  isActive
                    ? 'bg-corporate-gold text-corporate-black'
                    : 'text-white/70 hover:bg-white/5 hover:text-corporate-gold',
                  testTarget ? `ring-2 ${navTheme.navRing} ring-offset-2 ring-offset-corporate-black` : '',
                ].join(' ')
              }
            >
              <span className="@lg:hidden" aria-hidden>
                <NavIcon id={link.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="hidden @lg:inline">{link.label}</span>
              <span className="sr-only @lg:hidden">{link.label}</span>
              {testTarget && !isTestingNavTarget(location.pathname, guide) ? (
                <span className="hidden @lg:inline"> →</span>
              ) : null}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
