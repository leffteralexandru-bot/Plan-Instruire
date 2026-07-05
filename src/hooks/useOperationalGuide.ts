import { useCallback, useEffect, useState } from 'react';
import { operationalGuideStore } from '@/lib/operationalGuideStore';
import type { OperationalGuideTask } from '@/data/operationalGuide';

export function useOperationalGuide(): OperationalGuideTask[] {
  const [tasks, setTasks] = useState<OperationalGuideTask[]>(() => operationalGuideStore.getAll());

  const refresh = useCallback(() => {
    setTasks(operationalGuideStore.getAll());
  }, []);

  useEffect(() => {
    window.addEventListener('operational-guide-updated', refresh);
    return () => window.removeEventListener('operational-guide-updated', refresh);
  }, [refresh]);

  return tasks;
}
