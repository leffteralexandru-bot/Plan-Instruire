import { Link, useLocation } from 'react-router-dom';
import { DEPARTMENTS, getDepartmentFromPath, INGINERI_ANGAJAT_PANEL_PATH, INGINERI_PLAN_PATH } from '@/data/departments';
import { DepartmentGlyph, DEPT_SHORT_LABELS } from '@/components/departments/DepartmentGlyph';
import { useAuth } from '@/hooks/useAuth';
import { isAngajatUser, hasRole } from '@/lib/roles';

function departmentLink(deptRoute: string, planAvailable: boolean, isStaffAngajat: boolean): string {
  if (!planAvailable) return `${deptRoute}/in-curand`;
  if (deptRoute === '/ingineri' && isStaffAngajat) return INGINERI_ANGAJAT_PANEL_PATH;
  if (deptRoute === '/ingineri') return INGINERI_PLAN_PATH;
  return deptRoute;
}

export function DepartmentBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const activeDept = getDepartmentFromPath(pathname);
  const isStaffAngajat =
    !!user && isAngajatUser(user) && !hasRole(user, 'admin') && !hasRole(user, 'hr');

  return (
    <nav aria-label="Planuri departamente" className="dept-bar relative px-3 py-3 sm:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-corporate-gold/50 to-transparent"
        aria-hidden
      />
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between gap-1 sm:gap-2">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDept?.id === dept.id;
          const to = departmentLink(dept.route, dept.planAvailable, isStaffAngajat);

          return (
            <li key={dept.id} className="min-w-0 flex-1">
              <Link
                to={to}
                title={`${dept.label}${dept.planAvailable ? '' : ' — în pregătire'}`}
                className={[
                  'group relative flex flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 no-underline transition-all duration-200',
                  isActive ? 'text-corporate-gold' : 'text-white/45 hover:text-white/85',
                ].join(' ')}
              >
                <span
                  className={[
                    'relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg border transition-all duration-200',
                    isActive
                      ? 'border-corporate-gold/80 bg-corporate-gold/[0.12] shadow-gold'
                      : dept.planAvailable
                        ? 'border-white/12 bg-white/[0.04] group-hover:border-corporate-gold/45 group-hover:bg-corporate-gold/[0.06]'
                        : 'border-white/[0.08] border-dashed bg-transparent group-hover:border-corporate-gold/30',
                  ].join(' ')}
                >
                  <DepartmentGlyph
                    id={dept.id}
                    className={[
                      'h-[18px] w-[18px] sm:h-5 sm:w-5 transition-colors',
                      isActive ? 'text-corporate-gold' : 'text-white/70 group-hover:text-corporate-gold/90',
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
                    'w-full truncate text-center text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.14em] leading-tight',
                    isActive ? 'text-corporate-gold' : 'text-white/40 group-hover:text-white/70',
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
