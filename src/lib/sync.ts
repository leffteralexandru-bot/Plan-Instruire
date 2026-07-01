import type { AppProgress } from '@/types';
import { storage, isSupabaseConfigured } from '@/store/storage';
import { pullProgressFromCloud, pushProgressToCloud } from '@/lib/supabase';

/** Încarcă progres: cloud dacă e mai recent, altfel local */
export async function loadProgress(userId: string): Promise<AppProgress> {
  const local = storage.getProgress(userId);

  if (!isSupabaseConfigured()) return local;

  try {
    const remote = await pullProgressFromCloud(userId);
    if (!remote) return local;

    const localUpdated = local.auditLog.at(-1)?.createdAt ?? '';
    const remoteUpdated = remote.auditLog.at(-1)?.createdAt ?? '';

    if (remoteUpdated > localUpdated) {
      storage.saveProgress(remote);
      return remote;
    }
  } catch {
    /* offline — păstrăm local */
  }

  return local;
}

export async function syncProgressToCloud(_userId: string, progress: AppProgress): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    return await pushProgressToCloud(progress);
  } catch {
    return false;
  }
}

export function getSyncStatus(): 'local' | 'cloud' {
  return isSupabaseConfigured() ? 'cloud' : 'local';
}
