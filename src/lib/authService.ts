import { storage } from '@/store/storage';
import { isSupabaseConfigured } from '@/store/storage';
import { pullProgressFromCloud, pushProgressToCloud, getSupabase } from '@/lib/supabase';
import { syncProgressToCloud } from '@/lib/sync';

export function isSupabaseAuthEnabled(): boolean {
  return isSupabaseConfigured() && import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';
}

/** La login: încarcă cloud → local și migrează progres local vechi dacă cloud e gol */
export async function migrateProgressOnLogin(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const local = storage.getProgress(userId);
  const cloud = await pullProgressFromCloud(userId);

  if (cloud) {
    const localAudit = local.auditLog.at(-1)?.createdAt ?? '';
    const cloudAudit = cloud.auditLog.at(-1)?.createdAt ?? '';
    if (cloudAudit >= localAudit) {
      storage.saveProgress(cloud);
    } else {
      await pushProgressToCloud(local);
    }
  } else if (local.auditLog.length > 0 || Object.keys(local.days).length > 0) {
    await pushProgressToCloud(local);
  }
}

export async function signInWithSupabaseAuth(email: string, password: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return !error;
}

export async function signOutSupabaseAuth(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

/** Sincronizează întreg progresul cohortei active (admin/mentor) */
export async function syncAllTraineesToCloud(userIds: string[]): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  let ok = 0;
  for (const id of userIds) {
    const p = storage.getProgress(id);
    const success = await syncProgressToCloud(id, p);
    if (success) ok += 1;
  }
  return ok;
}
