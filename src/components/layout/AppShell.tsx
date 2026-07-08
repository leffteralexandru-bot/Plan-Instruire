import { ProgressProvider } from '@/hooks/useProgress';
import { StagiarProvider } from '@/context/StagiarContext';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAccessControl } from '@/hooks/useAccessControl';
import { HrAlertsBanner } from '@/components/shared/HrAlertsBanner';
import { TestingStageBanner } from '@/components/shared/TestingStageBanner';
import { useHrNotifications } from '@/hooks/useHrNotifications';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import { useUsers } from '@/context/UsersContext';
import { isTraineeInActiveTraining } from '@/lib/hrReport';
import { isOperationalAlertsRoute, needsProgressProvider } from '@/data/departments';
import { canViewEmployee } from '@/lib/accessControl';
import { isAngajatUser } from '@/lib/roles';
import { SHELL_INNER } from '@/lib/responsiveLayout';
import { SyncStatusFooter } from '@/components/layout/SyncStatusIndicator';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';
import { useCompactNavLayout } from '@/hooks/useCompactNavLayout';
import { CompactNavSectionTitle } from '@/components/layout/CompactNavSectionTitle';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-corporate-surface">
      <div className="text-center space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-corporate-gold border-t-transparent" />
        <p className="text-sm text-corporate-muted">Se încarcă...</p>
      </div>
    </div>
  );
}

function ProgressGate({ children }: { children: React.ReactNode }) {
  const { loading, user, isInTraining } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  const { visibleTrainees } = useUsers();
  const userId = useStagiarId();
  const location = useLocation();

  const activeTrainees = useMemo(
    () => visibleTrainees.filter(isTraineeInActiveTraining),
    [visibleTrainees],
  );

  const viewAsTraineeId = useMemo(() => {
    const candidate = new URLSearchParams(location.search).get('viewAs');
    if (!candidate || !user || !canViewEmployee(user, candidate)) return undefined;
    return candidate;
  }, [location.search, user]);

  if (loading) return <LoadingScreen />;

  const effectiveUserId =
    viewAsTraineeId ||
    userId ||
    (isInTraining ? user?.id : undefined) ||
    (canOpenMentorPanel ? activeTrainees[0]?.id : undefined) ||
    (user && isAngajatUser(user) ? user.id : undefined) ||
    user?.id;

  if (!effectiveUserId) {
    return <>{children}</>;
  }

  return (
    <ProgressProvider userId={effectiveUserId}>
      <OfflineSyncRunner />
      <AlertsRunner />
      {children}
    </ProgressProvider>
  );
}

function AlertsRunner() {
  useHrNotifications();
  return null;
}

function OfflineSyncRunner() {
  useOfflineSync();
  return null;
}

export function AppShell() {
  const location = useLocation();
  const showAlerts = isOperationalAlertsRoute(location.pathname);

  return (
    <StagiarProvider>
      {needsProgressProvider(location.pathname) ? (
        <ProgressGate>
          <ShellLayout showAlerts={showAlerts} />
        </ProgressGate>
      ) : (
        <ShellLayout showAlerts={showAlerts} />
      )}
    </StagiarProvider>
  );
}

function ShellLayout({ showAlerts }: { showAlerts: boolean }) {
  const compactNav = useCompactNavLayout();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header />
      <main
        className={[
          SHELL_INNER,
          'min-h-0 flex-1 overflow-y-auto',
          compactNav ? 'pb-16' : '@md:pb-6',
        ].join(' ')}
      >
        <TestingStageBanner />
        {showAlerts && <HrAlertsBanner />}
        <CompactNavSectionTitle />
        <Outlet />
      </main>
      <MobileBottomNav />
      {!compactNav && (
        <footer className="shrink-0 border-t border-corporate-border bg-corporate-black px-4 py-3 text-center">
          <SyncStatusFooter />
          <AutoSaveStatusText className="mb-1" />
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} — Plan Instruire & Adaptare Profesională
          </p>
        </footer>
      )}
    </div>
  );
}
