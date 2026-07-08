import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { isAngajatMentor } from '@/lib/roles';
import { buildAppNavLinks } from '@/lib/appNavigation';
import { getDepartmentFromPath } from '@/data/departments';
import { NavIcon } from '@/components/layout/NavIcon';
import { useCompactNavLayout } from '@/hooks/useCompactNavLayout';
import { BAR_NAV_ACTIVE, BAR_NAV_INACTIVE, BAR_NAV_LABEL } from '@/lib/responsiveLayout';

/** Navigare fixă jos — mobil + tabletă (sub 1024px). */
export function MobileBottomNav() {
  const compactNav = useCompactNavLayout();
  const { user, isAdmin, isHr, isAngajat } = useAuth();
  const { canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const location = useLocation();
  const isHub = location.pathname === '/';
  const activeDept = getDepartmentFromPath(location.pathname);
  const showNav = user && !isHub && activeDept?.planAvailable;

  if (!showNav || !compactNav) return null;

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
      aria-label="Navigare principală mobil"
      className="relative sticky bottom-0 z-40 w-full shrink-0 border-t border-white/10 bg-corporate-black"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="grid w-full gap-px px-1 py-1.5"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map((link) => (
          <NavLink
            key={link.to + link.label}
            to={link.to}
            end={link.end}
            title={link.label}
            className={({ isActive }) =>
              [
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded px-0.5 py-1 transition-colors',
                'min-h-[48px]',
                isActive ? BAR_NAV_ACTIVE : `${BAR_NAV_INACTIVE} active:text-corporate-gold`,
              ].join(' ')
            }
          >
            <NavIcon id={link.icon} className="h-4 w-4 shrink-0 @md:h-5 @md:w-5" />
            <span className={[BAR_NAV_LABEL, 'line-clamp-1 px-0.5'].join(' ')}>
              {link.shortLabel}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
