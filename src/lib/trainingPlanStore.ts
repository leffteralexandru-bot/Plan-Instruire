import type { DepartmentId } from '@/data/departments';
import type { DayPlan, DayPlanOverride, Material, Task, User, WeekPlan } from '@/types';
import { TRAINING_PLAN as STATIC_PLAN, ALL_DAYS as STATIC_DAYS } from '@/data/trainingPlan';
import { canEditTrainingPlan } from '@/lib/roles';
import { PLATFORM_SETTINGS_ADMIN_NAME } from '@/lib/platformSettingsAdmin';

const OVERRIDES_KEY = 'artgranit_training_plan_overrides';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function mergeDay(staticDay: DayPlan, override?: DayPlanOverride): DayPlan {
  if (!override) return staticDay;
  return {
    ...staticDay,
    title: override.title ?? staticDay.title,
    subtitle: override.subtitle ?? staticDay.subtitle,
    tasks: override.tasks ?? staticDay.tasks,
    materials: override.materials ?? staticDay.materials,
  };
}

export const trainingPlanStore = {
  getOverrides(): DayPlanOverride[] {
    return readJson<DayPlanOverride[]>(OVERRIDES_KEY, []);
  },

  getOverride(dayId: string): DayPlanOverride | undefined {
    return trainingPlanStore.getOverrides().find((o) => o.dayId === dayId);
  },

  saveDayOverride(
    dayId: string,
    departmentId: DepartmentId,
    patch: {
      title?: string;
      subtitle?: string;
      tasks?: Task[];
      materials?: Material[];
    },
    actor: Pick<User, 'id' | 'name' | 'roles'>,
  ): DayPlanOverride {
    if (!canEditTrainingPlan(actor)) {
      throw new Error(`Doar ${PLATFORM_SETTINGS_ADMIN_NAME} poate modifica planul de instruire.`);
    }
    const overrides = trainingPlanStore.getOverrides();
    const idx = overrides.findIndex((o) => o.dayId === dayId);
    const base = idx >= 0 ? overrides[idx] : undefined;
    const saved: DayPlanOverride = {
      dayId,
      departmentId,
      title: patch.title ?? base?.title,
      subtitle: patch.subtitle ?? base?.subtitle,
      tasks: patch.tasks ?? base?.tasks,
      materials: patch.materials ?? base?.materials,
      updatedAt: nowIso(),
      updatedBy: actor.id,
      updatedByName: actor.name,
    };
    if (idx >= 0) overrides[idx] = saved;
    else overrides.push(saved);
    writeJson(OVERRIDES_KEY, overrides);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('training-plan-updated'));
    }
    return saved;
  },

  resetDayOverride(dayId: string, actor?: Pick<User, 'id'> & Partial<Pick<User, 'email'>>): void {
    if (actor && !canEditTrainingPlan(actor)) {
      throw new Error('Doar Resurse Umane (HR) pot modifica planul de instruire.');
    }
    writeJson(
      OVERRIDES_KEY,
      trainingPlanStore.getOverrides().filter((o) => o.dayId !== dayId),
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('training-plan-updated'));
    }
  },

  getEffectiveDay(dayId: string): DayPlan | undefined {
    const staticDay = STATIC_DAYS.find((d) => d.id === dayId);
    if (!staticDay) return undefined;
    return mergeDay(staticDay, trainingPlanStore.getOverride(dayId));
  },

  getEffectivePlan(_departmentId: DepartmentId = 'ingineri'): WeekPlan[] {
    const overrides = trainingPlanStore.getOverrides();
    return STATIC_PLAN.map((week) => ({
      ...week,
      days: week.days.map((day) => mergeDay(day, overrides.find((o) => o.dayId === day.id))),
    }));
  },

  getEffectiveAllDays(): DayPlan[] {
    return trainingPlanStore.getEffectivePlan().flatMap((w) => w.days);
  },

  getEffectiveWeekForDay(dayId: string): WeekPlan | undefined {
    return trainingPlanStore.getEffectivePlan().find((w) => w.days.some((d) => d.id === dayId));
  },

  getEffectiveTotalTasks(): number {
    return trainingPlanStore.getEffectiveAllDays().reduce((sum, d) => sum + d.tasks.length, 0);
  },

  /** Creează task nou cu ID unic */
  newTask(label = 'Task nou'): Task {
    return { id: newId('task'), label, materials: [] };
  },

  /** Creează material din fișier încărcat */
  newUploadedMaterial(input: {
    title: string;
    type: Material['type'];
    documentId: string;
    description?: string;
  }): Material {
    return {
      id: newId('mat'),
      title: input.title,
      type: input.type,
      url: '',
      documentId: input.documentId,
      description: input.description,
    };
  },

  /** Creează material link extern */
  newLinkMaterial(input: { title: string; url: string; type?: Material['type']; description?: string }): Material {
    return {
      id: newId('mat'),
      title: input.title,
      type: input.type ?? 'link',
      url: input.url,
      description: input.description,
    };
  },
};
