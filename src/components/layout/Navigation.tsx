import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useDevicePreview } from '@/context/DevicePreviewContext';
import { isAngajatMentor } from '@/lib/roles';
import { buildAppNavItems, LAYOUT_SHELL } from '@/lib/appNavigation';
import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import { isTestingNavTarget } from '@/lib/testingStageGuide';
import { getTestingStageTheme } from '@/lib/testingStageThemes';
import { useLocation } from 'react-router-dom';

export function Navigation() {
  const { isMobileLayout } = useDevicePreview();
  const { user, isAdmin, isHr, isAngajat } = useAuth();
  const { canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const guide = useTestingStageGuide();
  const location = useLocation();
  const navTheme = guide ? getTestingStageTheme(guide.category) : null;
  const angajatMentor = isAngajatMentor(user);
  const links = buildAppNavItems(
    isAdmin,
    isHr,
    canOpenMentorPanel,
    canOpenSupervisorPanel,
    isAngajat,
    angajatMentor,
  );

  if (isMobileLayout) return null;

  return (
    <nav className="border-t border-white/10 bg-corporate-black" aria-label="Navigare departament">
      <div className={`${LAYOUT_SHELL} flex flex-wrap gap-1 px-4 py-2 md:px-6`}>
        {links.map((link) => {
          const testTarget = guide && navTheme && isTestingNavTarget(link.to, guide);
          return (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center',
                  'whitespace-nowrap hover:text-corporate-gold hover:bg-white/5',
                  isActive
                    ? 'bg-corporate-gold text-corporate-black'
                    : 'text-white/70',
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

/** @deprecated Import from @/lib/appNavigation */
export { buildAppNavItems as buildNavLinks };
