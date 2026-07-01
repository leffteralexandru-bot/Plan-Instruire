import type { DepartmentId } from '@/data/departments';
import type { WeekPlan } from '@/types';
import {
  ALL_DAYS as INGINIERI_ALL_DAYS,
  TRAINING_PLAN as INGINIERI_TRAINING_PLAN,
  getDayById as getIngineriDayById,
  getTotalTasks as getIngineriTotalTasks,
  getWeekForDay as getIngineriWeekForDay,
} from '@/data/trainingPlan';

const PLANS: Partial<Record<DepartmentId, WeekPlan[]>> = {
  ingineri: INGINIERI_TRAINING_PLAN,
};

export function getTrainingPlan(departmentId: DepartmentId): WeekPlan[] | null {
  return PLANS[departmentId] ?? null;
}

export function getAllDaysForDepartment(departmentId: DepartmentId) {
  if (departmentId === 'ingineri') return INGINIERI_ALL_DAYS;
  return [];
}

/** Plan activ — extensibil când primiți planurile celorlalte departamente */
export const ACTIVE_DEPARTMENT_ID: DepartmentId = 'ingineri';

export {
  INGINIERI_TRAINING_PLAN as TRAINING_PLAN,
  INGINIERI_ALL_DAYS as ALL_DAYS,
  getIngineriDayById as getDayById,
  getIngineriWeekForDay as getWeekForDay,
  getIngineriTotalTasks as getTotalTasks,
};
