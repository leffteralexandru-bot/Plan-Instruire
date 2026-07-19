import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { Navigation } from './Navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { getDepartmentFromPath } from '@/data/departments';
import { formatUserRoles } from '@/lib/roles';
import { DepartmentBar } from '@/components/departments/DepartmentBar';
import { ViewportPreviewMenu } from '@/components/layout/ViewportPreviewMenu';
import {
  HEADER_BRAND_BLOCK,
  HEADER_BRAND_SUBTITLE,
  HEADER_BRAND_TITLE,
  HEADER_ICON_BTN,
  HEADER_ICON_BTN_DARK,
  HEADER_ICON_BTN_SIZE,
  HEADER_ICON_INNER,
  HEADER_INNER,
  HEADER_LOGO_SIZE,
  HEADER_USER_AREA,
  HEADER_USER_BLOCK,
  HEADER_USER_NAME,
  HEADER_USER_ROLE,
} from '@/lib/responsiveLayout';
import { SyncStatusDot } from '@/components/layout/SyncStatusIndicator';
import { AutoSaveIndicator } from '@/components/shared/AutoSaveIndicator';
import { useCompactNavLayout } from '@/hooks/useCompactNavLayout';

function LogoutIcon({ className = HEADER_ICON_INNER }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const { profiles } = useHrPerformance();
  const location = useLocation();
  const isHub = location.pathname === '/';
  const activeDept = getDepartmentFromPath(location.pathname);
  const showNav = user && !isHub && activeDept?.planAvailable;

  const employeeProfile = useMemo(
    () => (user ? profiles.find((p) => p.userId === user.id) : undefined),
    [profiles, user],
  );

  const displayName = employeeProfile
    ? `${employeeProfile.prenume} ${employeeProfile.nume}`.trim()
    : user?.name;
  const displayRole = employeeProfile?.functie ?? (user ? formatUserRoles(user) : '');
  const compactNav = useCompactNavLayout();

  return (
    <header className="sticky top-0 z-50 bg-corporate-black text-white shadow-md">
      <div className={HEADER_INNER}>
        <div className="flex min-w-0 flex-1 items-center gap-1 @md:gap-2 @lg:gap-3">
          <div className="shrink-0">
            <ViewportPreviewMenu tone="dark" layout="dots" />
          </div>
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-1 @md:gap-2 @lg:gap-3">
            <BrandLogo tone="light" className={HEADER_LOGO_SIZE} />
            <div className={HEADER_BRAND_BLOCK + ' header-brand-text'}>
              <p className={HEADER_BRAND_TITLE}>Plan de instruire</p>
              <p className={HEADER_BRAND_SUBTITLE}>Adaptare profesională</p>
            </div>
          </Link>
        </div>

        {user && (
          <div className={HEADER_USER_AREA}>
            <div className={HEADER_USER_BLOCK}>
              <p className={HEADER_USER_NAME}>{displayName}</p>
              <p className={HEADER_USER_ROLE}>{displayRole}</p>
            </div>
            <AutoSaveIndicator className="@md:hidden" />
            {(compactNav || !showNav) && <SyncStatusDot className="@md:hidden" />}
            <button
              type="button"
              className={`${HEADER_ICON_BTN} ${HEADER_ICON_BTN_SIZE} ${HEADER_ICON_BTN_DARK}`}
              onClick={() => {
                void logout();
              }}
              title="Deconectare și alegere alt profil"
              aria-label="Ieșire"
            >
              <LogoutIcon />
            </button>
          </div>
        )}
      </div>

      {user && <DepartmentBar />}
      {showNav && !compactNav && <Navigation />}
    </header>
  );
}
