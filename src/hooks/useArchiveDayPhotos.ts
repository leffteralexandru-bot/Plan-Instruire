import { useEffect, useState } from 'react';
import { photoStore } from '@/store/photoStore';

export interface ArchivePhotoPreview {
  id: string;
  label: string;
  url: string;
  synced: boolean;
}

/** Fotografii șantier pentru un angajat — încărcate la expand (IndexedDB). */
export function useArchiveDayPhotos(
  angajatId: string,
  dayId: string,
  enabled: boolean,
): { photos: ArchivePhotoPreview[]; loading: boolean } {
  const [photos, setPhotos] = useState<ArchivePhotoPreview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !angajatId || !dayId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const urls: string[] = [];
    let cancelled = false;
    setLoading(true);

    void photoStore.listByDay(angajatId, dayId).then((stored) => {
      if (cancelled) return;
      const previews = stored.map((p) => {
        const url = URL.createObjectURL(p.blob);
        urls.push(url);
        return { id: p.id, label: p.label, url, synced: p.synced };
      });
      setPhotos(previews);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [angajatId, dayId, enabled]);

  return { photos, loading };
}
