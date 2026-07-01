import type { HrPerformancePayload } from '@/lib/hrPerformanceStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { getSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/store/storage';

const HR_ROW_ID = 'artgranit-org';

export async function pullHrPerformanceFromCloud(): Promise<HrPerformancePayload | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('hr_performance')
    .select('data, updated_at')
    .eq('id', HR_ROW_ID)
    .maybeSingle();

  if (error || !data?.data) return null;
  return data.data as HrPerformancePayload;
}

export async function pushHrPerformanceToCloud(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const payload = hrPerformanceStore.exportPayload();
  const { error } = await sb.from('hr_performance').upsert(
    {
      id: HR_ROW_ID,
      data: payload,
      updated_at: payload.updatedAt,
    },
    { onConflict: 'id' },
  );

  return !error;
}

/** Îmbină cloud ↔ local după timestamp payload */
export async function syncHrPerformanceWithCloud(): Promise<'pushed' | 'pulled' | 'merged' | 'skipped'> {
  if (!isSupabaseConfigured()) return 'skipped';

  const local = hrPerformanceStore.exportPayload();
  const cloud = await pullHrPerformanceFromCloud();

  if (!cloud) {
    const ok = await pushHrPerformanceToCloud();
    return ok ? 'pushed' : 'skipped';
  }

  if (cloud.updatedAt > local.updatedAt) {
    hrPerformanceStore.importPayload(cloud, 'merge');
    const newerLocal = hrPerformanceStore.exportPayload();
    if (newerLocal.updatedAt > cloud.updatedAt) {
      await pushHrPerformanceToCloud();
      return 'merged';
    }
    return 'pulled';
  }

  if (local.updatedAt > cloud.updatedAt) {
    const ok = await pushHrPerformanceToCloud();
    return ok ? 'pushed' : 'skipped';
  }

  hrPerformanceStore.importPayload(cloud, 'merge');
  await pushHrPerformanceToCloud();
  return 'merged';
}
