import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppProgress } from '@/types';
import { isSupabaseConfigured } from '@/store/storage';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

export async function pullProgressFromCloud(userId: string): Promise<AppProgress | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('user_progress')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.data) return null;
  return data.data as AppProgress;
}

export async function pushProgressToCloud(progress: AppProgress): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('user_progress').upsert(
    {
      user_id: progress.userId,
      data: progress,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return !error;
}

export async function uploadPhotoToCloud(
  userId: string,
  photoId: string,
  blob: Blob,
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const path = `${userId}/${photoId}.jpg`;
  const { error } = await sb.storage.from('field-photos').upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
  });

  if (error) return null;

  const { data } = sb.storage.from('field-photos').getPublicUrl(path);
  return data.publicUrl;
}
