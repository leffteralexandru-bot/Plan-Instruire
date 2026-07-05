import {
  DEFAULT_OPERATIONAL_GUIDE,
  type OperationalGuideTask,
  type OperationalGuideTaskId,
} from '@/data/operationalGuide';
import { canEditTrainingPlan } from '@/lib/roles';
import type { User } from '@/types';

const CONTENT_KEY = 'artgranit_operational_guide';
const CHECKLIST_EQUIPMENT_PREFIX = 'artgranit_opguide_equip';

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

function defaultPreConditions(id: OperationalGuideTaskId): string[] {
  return DEFAULT_OPERATIONAL_GUIDE.find((d) => d.id === id)?.preMeasurementConditions ?? [];
}

function mergeWithDefaults(stored: OperationalGuideTask[]): OperationalGuideTask[] {
  return DEFAULT_OPERATIONAL_GUIDE.map((def) => {
    const found = stored.find((t) => t.id === def.id);
    if (!found) return { ...def };
    const preFromStore = found.preMeasurementConditions;
    const useDefaultPre = !preFromStore || preFromStore.length === 0;
    return {
      ...def,
      ...found,
      label: def.label,
      categorySubtitle: found.categorySubtitle ?? def.categorySubtitle,
      preMeasurementConditions: useDefaultPre ? def.preMeasurementConditions : preFromStore,
      equipment: found.equipment ?? [],
      steps: found.steps ?? [],
    };
  });
}

function equipmentChecklistKey(userId: string, taskId: OperationalGuideTaskId): string {
  return `${CHECKLIST_EQUIPMENT_PREFIX}_${userId}_${taskId}`;
}

function notifyUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('operational-guide-updated'));
  }
}

export const operationalGuideStore = {
  getAll(): OperationalGuideTask[] {
    const stored = readJson<OperationalGuideTask[]>(CONTENT_KEY, []);
    return mergeWithDefaults(stored);
  },

  getTask(id: OperationalGuideTaskId): OperationalGuideTask {
    return operationalGuideStore.getAll().find((t) => t.id === id)!;
  },

  saveTask(
    id: OperationalGuideTaskId,
    patch: Partial<Omit<OperationalGuideTask, 'id' | 'label'>>,
    actor: Pick<User, 'id' | 'name' | 'roles'>,
  ): OperationalGuideTask {
    if (!canEditTrainingPlan(actor)) {
      throw new Error('Doar Resurse Umane (HR) pot modifica Ghidul Operațional.');
    }
    const all = operationalGuideStore.getAll();
    const idx = all.findIndex((t) => t.id === id);
    const base = idx >= 0 ? all[idx] : operationalGuideStore.getTask(id);
    const saved: OperationalGuideTask = {
      ...base,
      categorySubtitle:
        patch.categorySubtitle !== undefined
          ? patch.categorySubtitle.trim() || undefined
          : base.categorySubtitle,
      videoUrl: patch.videoUrl !== undefined ? patch.videoUrl.trim() || undefined : base.videoUrl,
      videoTitle: patch.videoTitle !== undefined ? patch.videoTitle.trim() || undefined : base.videoTitle,
      introText: patch.introText !== undefined ? patch.introText.trim() : base.introText,
      preMeasurementConditions:
        patch.preMeasurementConditions ?? base.preMeasurementConditions ?? defaultPreConditions(id),
      equipment: patch.equipment ?? base.equipment,
      steps: patch.steps ?? base.steps,
      updatedAt: nowIso(),
      updatedByName: actor.name,
    };
    if (idx >= 0) all[idx] = saved;
    else all.push(saved);
    writeJson(CONTENT_KEY, all);
    notifyUpdate();
    return saved;
  },

  getEquipmentChecklist(userId: string, taskId: OperationalGuideTaskId): boolean[] {
    const legacy = readJson<boolean[]>(`artgranit_opguide_checks_${userId}_${taskId}`, []);
    return readJson<boolean[]>(equipmentChecklistKey(userId, taskId), legacy);
  },

  setEquipmentChecklistItem(
    userId: string,
    taskId: OperationalGuideTaskId,
    index: number,
    checked: boolean,
    listLength: number,
  ): boolean[] {
    const current = operationalGuideStore.getEquipmentChecklist(userId, taskId);
    const next = Array.from({ length: listLength }, (_, i) => current[i] ?? false);
    if (index >= 0 && index < next.length) next[index] = checked;
    writeJson(equipmentChecklistKey(userId, taskId), next);
    return next;
  },
};
