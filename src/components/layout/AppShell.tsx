import { ProgressProvider } from '@/hooks/useProgress';
import { StagiarProvider } from '@/context/StagiarContext';
import { FieldModeProvider } from '@/context/FieldModeContext';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAccessControl } from '@/hooks/useAccessControl';
import { HrAlertsBanner } from '@/components/shared/HrAlertsBanner';
import { useHrNotifications } from '@/hooks/useHrNotifications';
import { Header } from './Header';
import { Outlet, useLocation } from 'react-router-dom';
import { getSyncStatus } from '@/lib/sync';
import { isSupabaseConfigured } from '@/store/storage';
import { isTrainingProgressRoute } from '@/data/departments';

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
  const userId = useStagiarId();

  if (loading) return <LoadingScreen />;

  const effectiveUserId = userId || (isInTraining ? user?.id : undefined);

  if (!effectiveUserId) {
    if (canOpenMentorPanel) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
          <p className="font-medium">Niciun angajat în instruire de afișat.</p>
          <p className="mt-1 text-amber-800">
            Creați înscrieri din Panoul HR sau selectați un angajat din lista mentor.
          </p>
        </div>
      );
    }
    return <LoadingScreen />;
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
  const inPlan = isTrainingProgressRoute(location.pathname);

  return (
    <StagiarProvider>
      <FieldModeProvider>
        {inPlan ? (
          <ProgressGate>
            <ShellLayout showAlerts />
          </ProgressGate>
        ) : (
          <ShellLayout showAlerts={false} />
        )}
      </FieldModeProvider>
    </StagiarProvider>
  );
}

function ShellLayout({ showAlerts }: { showAlerts: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {showAlerts && <HrAlertsBanner />}
        <Outlet />
      </main>
      <footer className="border-t border-corporate-border bg-corporate-black py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} — Plan Instruire & Adaptare Profesională
      </footer>
    </div>
  );
}
