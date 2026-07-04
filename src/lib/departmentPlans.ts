import type { DepartmentId } from '@/data/departments';
import type { WeekPlan } from '@/types';
import {
  getDayById,
  getEffectiveAllDays,
  getTotalTasks,
  getTrainingPlanWeeks,
  getWeekForDay,
} from '@/data/trainingPlan';

export function getTrainingPlan(departmentId: DepartmentId): WeekPlan[] | null {
  if (departmentId === 'ingineri') return getTrainingPlanWeeks();
  return null;
}

export function getAllDaysForDepartment(departmentId: DepartmentId) {
  if (departmentId === 'ingineri') return getEffectiveAllDays();
  return [];
}

export const ACTIVE_DEPARTMENT_ID: DepartmentId = 'ingineri';

export {
  getDayById,
  getWeekForDay,
  getTotalTasks,
  getTrainingPlanWeeks as getEffectiveTrainingPlan,
  getEffectiveAllDays as ALL_DAYS,
  getTrainingPlanWeeks as TRAINING_PLAN,
};
