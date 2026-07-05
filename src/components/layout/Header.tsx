import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { FieldModeToggle } from '@/components/field/FieldModeToggle';
import { Navigation } from './Navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { getDepartmentFromPath } from '@/data/departments';

import { formatUserRoles } from '@/lib/roles';
import { DepartmentBar } from '@/components/departments/DepartmentBar';
import { QuickNoteButton } from '@/components/shared/QuickNoteButton';

export function Header() {
  const { user, logout, isInTraining } = useAuth();
  const location = useLocation();
  const isHub = location.pathname === '/';
  const activeDept = getDepartmentFromPath(location.pathname);
  const showNav = user && !isHub && activeDept?.planAvailable;

  return (
    <header className="sticky top-0 z-50 bg-corporate-black text-white shadow-md">
      <div className="app-width flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <Link to="/" className="flex items-center gap-3 min-w-0 shrink-0">
          <BrandLogo tone="light" height={26} />
          <div className="min-w-0 hidden lg:block border-l border-white/15 pl-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-corporate-gold font-medium">
              Plan Instruire
            </p>
            <p className="text-xs text-white/70 truncate">
              {isHub
                ? 'Selectați departamentul'
                : activeDept
                  ? `${activeDept.label} — ${activeDept.subtitle}`
                  : 'artGRANIT'}
            </p>
          </div>
        </Link>

        {user && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 ml-auto">
            {!isHub && activeDept?.planAvailable && isInTraining && <FieldModeToggle />}
            <QuickNoteButton />
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-white/60">{formatUserRoles(user)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => {
                void logout();
              }}
              title="Deconectare și alegere alt profil"
            >
              Ieșire
            </Button>
          </div>
        )}
      </div>

      {user && <DepartmentBar />}
      {showNav && <Navigation />}
    </header>
  );
}
