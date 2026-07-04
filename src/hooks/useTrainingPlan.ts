import { useEffect, useMemo, useState } from 'react';
import type { WeekPlan } from '@/types';
import { trainingPlanStore } from '@/lib/trainingPlanStore';

/** Plan de instruire reactiv (include modificările HR) */
export function useTrainingPlan(): WeekPlan[] {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('training-plan-updated', handler);
    return () => window.removeEventListener('training-plan-updated', handler);
  }, []);

  return useMemo(() => trainingPlanStore.getEffectivePlan(), [tick]);
}

export function useEffectiveAllDays() {
  const plan = useTrainingPlan();
  return useMemo(() => plan.flatMap((w) => w.days), [plan]);
}
