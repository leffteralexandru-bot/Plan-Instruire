import { ProgressProvider } from '@/hooks/useProgress';
import { StagiarProvider } from '@/context/StagiarContext';
import { FieldModeProvider } from '@/context/FieldModeContext';
import { AppMenuProvider } from '@/context/AppMenuContext';
import { DevicePreviewProvider, useDevicePreview } from '@/context/DevicePreviewContext';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAccessControl } from '@/hooks/useAccessControl';
import { HrAlertsBanner } from '@/components/shared/HrAlertsBanner';
import { TestingStageBanner } from '@/components/shared/TestingStageBanner';
import { useHrNotifications } from '@/hooks/useHrNotifications';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { MobileAppMenu } from './MobileAppMenu';
import { Outlet, useLocation } from 'react-router-dom';
import { getSyncStatus } from '@/lib/sync';
import { isSupabaseConfigured } from '@/store/storage';
import { useUsers } from '@/context/UsersContext';
import { isTraineeInActiveTraining } from '@/lib/hrReport';
import { getDepartmentFromPath, isOperationalAlertsRoute, needsProgressProvider } from '@/data/departments';
import { canViewEmployee } from '@/lib/accessControl';
import { LAYOUT_PAGE } from '@/lib/appNavigation';
import { DEVICE_PREVIEW_LABELS, PREVIEW_FRAME_WIDTH, type DevicePreview } from '@/lib/devicePreview';

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

function SyncStatusBar() {
  const mode = getSyncStatus();
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="border-b border-corporate-gold/20 bg-corporate-black px-4 py-1.5 text-center text-xs text-white/60">
      {mode === 'cloud' ? (
        <>
          Sync cloud activ · {online ? 'online' : 'offline — date locale'}
        </>
      ) : (
        <>Mod local · configurați Supabase în .env.local pentru sync cloud</>
      )}
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
    (canOpenMentorPanel ? activeTrainees[0]?.id : undefined);

  if (!effectiveUserId) {
    return <>{children}</>;
  }

  return (
    <ProgressProvider userId={effectiveUserId}>
      <OfflineSyncRunner />
      <AlertsRunner />
      {isSupabaseConfigured() && <SyncStatusBar />}
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
      <FieldModeProvider>
        <DevicePreviewProvider>
          {needsProgressProvider(location.pathname) ? (
            <ProgressGate>
              <ShellLayout showAlerts={showAlerts} />
            </ProgressGate>
          ) : (
            <ShellLayout showAlerts={showAlerts} />
          )}
        </DevicePreviewProvider>
      </FieldModeProvider>
    </StagiarProvider>
  );
}

function ShellLayout({ showAlerts }: { showAlerts: boolean }) {
  const { user, isInTraining } = useAuth();
  const location = useLocation();
  const { preview, isSimulated, isMobileLayout, isDesktopLayout, resetToAuto } = useDevicePreview();
  const isHub = location.pathname === '/';
  const activeDept = getDepartmentFromPath(location.pathname);
  const showFieldMode = !!user && !isHub && !!activeDept?.planAvailable && isInTraining;

  const appChrome = (
    <AppMenuProvider>
      <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-corporate-black">
        <Header />
        <main
          className={[
            LAYOUT_PAGE,
            'max-w-screen-xl flex-1 bg-corporate-surface',
            isMobileLayout
              ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'
              : 'pb-8',
          ].join(' ')}
        >
          <TestingStageBanner />
          {showAlerts && <HrAlertsBanner />}
          <Outlet />
        </main>
        {isDesktopLayout && (
          <footer className="border-t border-corporate-border bg-corporate-black py-4 text-center text-xs text-white/50">
            © {new Date().getFullYear()} — Plan Instruire & Adaptare Profesională
          </footer>
        )}
        {user && <BottomNavigation />}
        {user && <MobileAppMenu showFieldMode={showFieldMode} />}
      </div>
    </AppMenuProvider>
  );

  if (!isSimulated || preview === 'auto') {
    return appChrome;
  }

  const framedPreview = preview as Exclude<DevicePreview, 'auto'>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-corporate-surface via-white to-corporate-surface/60 px-4 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-center">
        <p className="text-xs font-medium text-corporate-muted">
          Previzualizare manuală:{' '}
          <strong>{DEVICE_PREVIEW_LABELS[framedPreview].replace('Forțează vizualizare ', '')}</strong>
        </p>
        <button
          type="button"
          onClick={resetToAuto}
          className="rounded-lg border border-corporate-border bg-white px-3 py-1 text-xs font-medium text-corporate-dark hover:border-corporate-gold hover:text-corporate-gold transition-colors"
        >
          Revenire Auto
        </button>
      </div>
      <div
        className={[
          'relative mx-auto w-full min-h-[min(844px,90vh)] overflow-hidden rounded-2xl border border-corporate-border bg-corporate-black shadow-2xl',
          PREVIEW_FRAME_WIDTH[framedPreview],
        ].join(' ')}
      >
        {appChrome}
      </div>
    </div>
  );
}
