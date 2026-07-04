import { useEffect, useState } from 'react';
import type { Material } from '@/types';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';

/** Rezolvă URL pentru material (link static sau blob HR) */
export function useMaterialUrl(material: Material): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(material.documentId ? null : material.url || null);
  const [loading, setLoading] = useState(!!material.documentId);

  useEffect(() => {
    if (!material.documentId) {
      setUrl(material.url || null);
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void hrPerformanceStore.downloadDocument(material.documentId).then((result) => {
      if (cancelled) return;
      if (result) {
        objectUrl = URL.createObjectURL(result.blob);
        setUrl(objectUrl);
      } else {
        setUrl(material.url || null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material.documentId, material.url]);

  return { url, loading };
}
