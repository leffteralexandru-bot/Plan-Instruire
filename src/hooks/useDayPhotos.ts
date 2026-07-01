import { useEffect, useState } from 'react';
import { photoStore } from '@/store/photoStore';
import { useStagiarId } from '@/hooks/useStagiarId';

export interface PhotoPreview {
  id: string;
  label: string;
  url: string;
  synced: boolean;
}

export function useDayPhotos(dayId: string) {
  const userId = useStagiarId();
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const urls: string[] = [];
    let cancelled = false;
    setLoading(true);

    (async () => {
      const stored = await photoStore.listByDay(userId, dayId);
      if (cancelled) return;
      const previews = stored.map((p) => {
        const url = URL.createObjectURL(p.blob);
        urls.push(url);
        return { id: p.id, label: p.label, url, synced: p.synced };
      });
      setPhotos(previews);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [userId, dayId, tick]);

  return { photos, loading, refresh: () => setTick((t) => t + 1) };
}
