import { useCallback, useEffect, useState } from 'react';
import type { TechnicalRepositoryData } from '@/data/technicalRepository';
import { technicalRepositoryStore } from '@/lib/technicalRepositoryStore';

export function useTechnicalRepository(): TechnicalRepositoryData {
  const [data, setData] = useState<TechnicalRepositoryData>(() => technicalRepositoryStore.get());

  const refresh = useCallback(() => {
    setData(technicalRepositoryStore.get());
  }, []);

  useEffect(() => {
    window.addEventListener('technical-repository-updated', refresh);
    return () => window.removeEventListener('technical-repository-updated', refresh);
  }, [refresh]);

  return data;
}
