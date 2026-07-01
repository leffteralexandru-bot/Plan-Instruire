import { useEffect } from 'react';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useProgress } from '@/hooks/useProgress';
import { photoStore } from '@/store/photoStore';
import { uploadPhotoToCloud } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/store/storage';

/** Sincronizează pozele nesincronizate când revine conexiunea */
export function useOfflineSync() {
  const userId = useStagiarId();
  const { progress } = useProgress();

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const flush = async () => {
      if (!navigator.onLine) return;
      const pending = await photoStore.listUnsynced(userId);
      for (const photo of pending) {
        const url = await uploadPhotoToCloud(userId, photo.id, photo.blob);
        if (url) await photoStore.markSynced(photo.id);
      }
    };

    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [userId, progress?.photos.length]);
}
