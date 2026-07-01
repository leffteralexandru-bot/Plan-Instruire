import type { WeekPlan } from '@/types';
import type { DepartmentId } from '@/data/departments';
import { TRAINING_PLAN as INGINIERI_PLAN } from '@/data/trainingPlan';

/**
 * Planuri goale — înlocuiți conținutul când primiți documentele de la artGRANIT.
 * Exemplu: export const PRODUCTIE_PLAN: WeekPlan[] = [ ... ];
 */
export const MONTATORI_PLAN: WeekPlan[] = [];
export const PRODUCTIE_PLAN: WeekPlan[] = [];
export const ADMINISTRATIE_PLAN: WeekPlan[] = [];
export const MANAGEMENT_PLAN: WeekPlan[] = [];

const REGISTRY: Record<DepartmentId, WeekPlan[] | null> = {
  ingineri: INGINIERI_PLAN,
  montatori: MONTATORI_PLAN.length ? MONTATORI_PLAN : null,
  productie: PRODUCTIE_PLAN.length ? PRODUCTIE_PLAN : null,
  administratie: ADMINISTRATIE_PLAN.length ? ADMINISTRATIE_PLAN : null,
  management: MANAGEMENT_PLAN.length ? MANAGEMENT_PLAN : null,
};

export function getTrainingPlanForDepartment(id: DepartmentId): WeekPlan[] | null {
  return REGISTRY[id];
}

export function isPlanPublished(id: DepartmentId): boolean {
  const plan = REGISTRY[id];
  return Array.isArray(plan) && plan.length > 0;
}
