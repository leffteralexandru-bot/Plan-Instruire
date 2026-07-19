import { Link, useLocation } from 'react-router-dom';
import {
  DEPARTMENTS,
  getDepartmentFromPath,
  INGINERI_ANGAJAT_PANEL_PATH,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_PLAN_PATH,
  ingineriPath,
} from '@/data/departments';
import { DepartmentGlyph, DEPT_SHORT_LABELS } from '@/components/departments/DepartmentGlyph';
import { useAuth } from '@/hooks/useAuth';
import { isAngajatUser, hasRole, isHrOnly } from '@/lib/roles';
import {
  BAR_NAV_ACTIVE,
  BAR_NAV_INACTIVE,
  BAR_NAV_LABEL_DEPT,
} from '@/lib/responsiveLayout';

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

export function DepartmentBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const activeDept = getDepartmentFromPath(pathname);
  const isStaffAngajat =
    !!user && isAngajatUser(user) && !hasRole(user, 'admin') && !hasRole(user, 'hr');
  const isHrStaff = !!user && isHrOnly(user);
  const isAdmin = !!user && hasRole(user, 'admin');

  return (
    <nav aria-label="Planuri departamente" className="dept-bar relative px-2 py-2 @md:px-6 @md:py-3">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-corporate-gold/50 to-transparent"
        aria-hidden
      />
      <ul className="mx-auto flex w-full max-w-none items-stretch justify-between gap-1 @md:gap-2 @xl:max-w-screen-xl">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDept?.id === dept.id;
          const to = departmentLink(
            dept.route,
            dept.planAvailable,
            isStaffAngajat,
            isHrStaff,
            isAdmin,
          );

          return (
            <li key={dept.id} className="min-w-0 flex-1">
              <Link
                to={to}
                title={`${dept.label}${dept.planAvailable ? '' : ' — în pregătire'}`}
                className={[
                  'group relative flex min-h-0 flex-col items-center justify-center gap-1 rounded-md px-0 py-1 no-underline transition-all duration-200 @md:min-h-0 @md:gap-1.5 @md:rounded-lg @md:px-0.5 @md:py-1',
                  isActive ? BAR_NAV_ACTIVE : BAR_NAV_INACTIVE,
                ].join(' ')}
              >
                <span
                  className={[
                    'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-all duration-200 @md:h-12 @md:w-12 @md:rounded-lg',
                    isActive
                      ? 'border-corporate-gold/60 bg-corporate-gold/[0.08] shadow-gold'
                      : dept.planAvailable
                        ? 'border-white/10 bg-white/[0.03] group-hover:border-corporate-gold/35 group-hover:bg-corporate-gold/[0.05]'
                        : 'border-white/[0.08] border-dashed bg-transparent group-hover:border-corporate-gold/25',
                  ].join(' ')}
                >
                  <DepartmentGlyph
                    id={dept.id}
                    className={[
                      'h-3 w-3 transition-colors @md:h-5 @md:w-5',
                      isActive ? 'text-corporate-gold' : 'text-white/75 group-hover:text-white/90',
                    ].join(' ')}
                  />
                  {!dept.planAvailable && (
                    <span
                      className="absolute -right-px -top-px h-1.5 w-1.5 rounded-full bg-corporate-gold/60"
                      aria-hidden
                    />
                  )}
                </span>
                <span
                  className={[
                    BAR_NAV_LABEL_DEPT,
                    'dept-nav-label--text whitespace-nowrap overflow-hidden text-ellipsis font-medium',
                    isActive ? 'text-corporate-gold' : '',
                  ].join(' ')}
                >
                  {DEPT_SHORT_LABELS[dept.id]}
                </span>
                {isActive && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-corporate-gold"
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
