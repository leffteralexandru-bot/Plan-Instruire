import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NavIcon } from '@/components/layout/NavIcon';
import { DepartmentGlyph, DEPT_SHORT_LABELS } from '@/components/departments/DepartmentGlyph';
import { Button } from '@/components/ui/Button';
import { FieldModeToggle } from '@/components/field/FieldModeToggle';
import { useAppMenu } from '@/context/AppMenuContext';
import { useDevicePreview } from '@/context/DevicePreviewContext';
import { useAuth } from '@/hooks/useAuth';
import {
  DEPARTMENTS,
  getDepartmentFromPath,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_ANGAJAT_PANEL_PATH,
  INGINERI_PLAN_PATH,
  ingineriPath,
} from '@/data/departments';
import { formatUserRoles, hasRole, isAngajatUser, isHrOnly } from '@/lib/roles';

function departmentLink(
  deptRoute: string,
  planAvailable: boolean,
  isStaffAngajat: boolean,
  isHrStaff: boolean,
  isAdmin: boolean,
): string {
  if (!planAvailable) return `${deptRoute}/in-curand`;
  if (deptRoute === '/ingineri' && isAdmin) return INGINERI_ADMIN_DASHBOARD_PATH;
  if (deptRoute === '/ingineri' && isStaffAngajat) return INGINERI_ANGAJAT_PANEL_PATH;
  if (deptRoute === '/ingineri' && isHrStaff) return ingineriPath('/admin');
  if (deptRoute === '/ingineri') return INGINERI_PLAN_PATH;
  return deptRoute;
}

interface MobileAppMenuProps {
  showFieldMode: boolean;
}

export function MobileAppMenu({ showFieldMode }: MobileAppMenuProps) {
  const { menuOpen, closeMenu, overflowNavItems, allNavItems } = useAppMenu();
  const { isSimulated, isMobileLayout } = useDevicePreview();
  const { user, logout, isInTraining } = useAuth();
  const location = useLocation();
  const activeDept = getDepartmentFromPath(location.pathname);

  const isStaffAngajat =
    !!user && isAngajatUser(user) && !hasRole(user, 'admin') && !hasRole(user, 'hr');
  const isHrStaff = !!user && isHrOnly(user);
  const isAdmin = !!user && hasRole(user, 'admin');

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  if (!user || !menuOpen || !isMobileLayout) return null;

  const secondaryLinks =
    overflowNavItems.length > 0
      ? overflowNavItems
      : allNavItems.filter((item) => !item.bottomPrimary);

  return (
    <div
      className={[isSimulated ? 'absolute' : 'fixed', 'inset-0 z-[60]'].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="Meniu aplicație"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Închide meniul"
        onClick={closeMenu}
      />

      <aside className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-corporate-black text-white shadow-2xl border-l border-white/10">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-white/55 truncate">{formatUserRoles(user)}</p>
          </div>
          <button
            type="button"
            className="touch-target shrink-0 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Închide"
            onClick={closeMenu}
          >
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6">
          {secondaryLinks.length > 0 && (
            <section>
              <h2 className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Navigare
              </h2>
              <ul className="space-y-1">
                {secondaryLinks.map((link) => (
                  <li key={link.to + link.label}>
                    <NavLink
                      to={link.to}
                      end={link.end}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors min-h-[44px]',
                          'hover:bg-white/8 hover:text-corporate-gold',
                          isActive ? 'bg-corporate-gold/15 text-corporate-gold' : 'text-white/85',
                        ].join(' ')
                      }
                    >
                      <NavIcon id={link.icon} className="h-5 w-5 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Departamente
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map((dept) => {
                const isActive = activeDept?.id === dept.id;
                const to = departmentLink(dept.route, dept.planAvailable, isStaffAngajat, isHrStaff, isAdmin);
                return (
                  <li key={dept.id}>
                    <Link
                      to={to}
                      onClick={closeMenu}
                      title={dept.label}
                      className={[
                        'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 min-h-[44px] transition-colors',
                        isActive
                          ? 'border-corporate-gold/60 bg-corporate-gold/10 text-corporate-gold'
                          : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-corporate-gold/40 hover:text-white',
                      ].join(' ')}
                    >
                      <DepartmentGlyph id={dept.id} className="h-5 w-5 shrink-0" />
                      <span className="w-full truncate text-center text-[9px] font-medium uppercase tracking-wide">
                        {DEPT_SHORT_LABELS[dept.id]}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Setări
            </h2>
            {showFieldMode && isInTraining && (
              <div className="px-2">
                <FieldModeToggle />
              </div>
            )}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/8 hover:text-corporate-gold min-h-[44px] transition-colors"
            >
              <NavIcon id="departments" className="h-5 w-5 shrink-0" />
              <span>Hub departamente</span>
            </Link>
            <Link
              to={ingineriPath('/contul-meu')}
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/8 hover:text-corporate-gold min-h-[44px] transition-colors"
            >
              <NavIcon id="account" className="h-5 w-5 shrink-0" />
              <span>Contul meu</span>
            </Link>
          </section>
        </div>

        <footer className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            className="min-h-[44px] text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => {
              closeMenu();
              void logout();
            }}
          >
            Ieșire
          </Button>
        </footer>
      </aside>
    </div>
  );
}
