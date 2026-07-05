import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { FieldModeToggle } from '@/components/field/FieldModeToggle';
import { Navigation } from './Navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { NavIcon } from '@/components/layout/NavIcon';
import { DevicePreviewToggle } from '@/components/layout/DevicePreviewToggle';
import { getDepartmentFromPath } from '@/data/departments';
import { formatUserRoles } from '@/lib/roles';
import { DepartmentBar } from '@/components/departments/DepartmentBar';
import { QuickNoteButton } from '@/components/shared/QuickNoteButton';
import { useAppMenu } from '@/context/AppMenuContext';
import { useDevicePreview } from '@/context/DevicePreviewContext';
import { LAYOUT_SHELL } from '@/lib/appNavigation';

export function Header() {
  const { user, logout, isInTraining } = useAuth();
  const { toggleMenu } = useAppMenu();
  const { isMobileLayout } = useDevicePreview();
  const location = useLocation();
  const isHub = location.pathname === '/';
  const activeDept = getDepartmentFromPath(location.pathname);
  const showNav = user && !isHub && activeDept?.planAvailable;
  const showFieldMode = !isHub && !!activeDept?.planAvailable && isInTraining;

  return (
    <header className="sticky top-0 z-50 bg-corporate-black text-white shadow-md">
      <div className={`${LAYOUT_SHELL} flex items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-6`}>
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 md:gap-3 md:flex-none">
          <BrandLogo tone="light" height={26} />
          <div className="min-w-0 border-l border-white/15 pl-2 md:pl-3">
            {!isMobileLayout && (
              <p className="text-[10px] uppercase tracking-[0.14em] text-corporate-gold font-medium">
                Plan Instruire
              </p>
            )}
            <p
              className={[
                'text-white/70 truncate',
                isMobileLayout ? 'text-[11px] max-w-[10rem]' : 'text-xs',
              ].join(' ')}
            >
              {isHub
                ? 'Selectați departamentul'
                : activeDept
                  ? `${activeDept.label} — ${activeDept.subtitle}`
                  : 'artGRANIT'}
            </p>
          </div>
        </Link>

        {user && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
            <DevicePreviewToggle />
            {showFieldMode && !isMobileLayout && <FieldModeToggle />}
            {!isMobileLayout && <QuickNoteButton />}
            {!isMobileLayout && (
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-white truncate max-w-[12rem]">{user.name}</p>
                <p className="text-xs text-white/60 truncate">{formatUserRoles(user)}</p>
              </div>
            )}
            {isMobileLayout && (
              <button
                type="button"
                aria-label="Deschide meniul"
                onClick={toggleMenu}
                className="touch-target rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <NavIcon id="menu" className="h-6 w-6" />
              </button>
            )}
            {!isMobileLayout && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="inline-flex min-h-[44px] text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => {
                  void logout();
                }}
                title="Deconectare și alegere alt profil"
              >
                Ieșire
              </Button>
            )}
          </div>
        )}
      </div>

      {user && !isMobileLayout && <DepartmentBar />}
      {showNav && <Navigation />}
    </header>
  );
}
