import { getSyncStatus } from '@/lib/sync';
import { isSupabaseConfigured } from '@/store/storage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function syncLabel(online: boolean, mode: 'local' | 'cloud'): string {
  if (mode === 'local') return 'Mod local · fără sync cloud';
  return online ? 'Sync cloud activ · online' : 'Sync cloud · offline — date locale';
}

/** Mobil — punct colorat, fără text. */
export function SyncStatusDot({ className = '' }: { className?: string }) {
  const online = useOnlineStatus();
  const mode = getSyncStatus();

  if (!isSupabaseConfigured() || mode !== 'cloud') return null;

  const label = syncLabel(online, mode);

  return (
    <span
      className={[
        'inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-white/10',
        online ? 'bg-emerald-400' : 'bg-amber-400',
        className,
      ].join(' ')}
      title={label}
      aria-label={label}
      role="status"
      aria-live="polite"
    />
  );
}

/** Desktop — text discret în footer. */
export function SyncStatusFooter() {
  const online = useOnlineStatus();
  const mode = getSyncStatus();

  if (!isSupabaseConfigured()) {
    return (
      <p className="mb-1 text-xs text-gray-400" role="status">
        Mod local
      </p>
    );
  }

  return (
    <p className="mb-1 text-xs text-gray-400" role="status" aria-live="polite">
      {mode === 'cloud'
        ? online
          ? 'Sync cloud · online'
          : 'Sync cloud · offline'
        : 'Mod local'}
    </p>
  );
}
