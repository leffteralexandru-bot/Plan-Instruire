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

function defaultPreDesignConditions(id: OperationalGuideTaskId): string[] {
  return DEFAULT_OPERATIONAL_GUIDE.find((d) => d.id === id)?.preDesignConditions ?? [];
}

function mergeWithDefaults(stored: OperationalGuideTask[]): OperationalGuideTask[] {
  return DEFAULT_OPERATIONAL_GUIDE.map((def) => {
    const found = stored.find((t) => t.id === def.id);
    if (!found) return { ...def };
    const preFromStore = found.preMeasurementConditions;
    const useDefaultPre = !preFromStore || preFromStore.length === 0;
    const designFromStore = found.preDesignConditions;
    const useDefaultDesign = !designFromStore || designFromStore.length === 0;
    const equipFromStore = found.equipment;
    const useDefaultEquip =
      !equipFromStore ||
      equipFromStore.length === 0 ||
      equipFromStore[0] !== 'ANEXA Nr. 1' ||
      !equipFromStore.some((item) => item.includes('Aparatul de măsurat Proliner'));
    const stepsFromStore = found.steps;
    // Forțează pașii oficiali adaptați pe tip (ANEXA primul, ochelari+Proliner, Bitrix cu poze+video + „proiectul de …”).
    const useDefaultSteps =
      !stepsFromStore ||
      stepsFromStore.length === 0 ||
      !stepsFromStore[0]?.includes('ANEXA Nr. 1') ||
      !stepsFromStore.some((s) => s.includes('ochelarii de înregistrare video') && s.includes('Proliner')) ||
      !stepsFromStore.some(
        (s) => s.includes('Bitrix') && s.includes('pozele de la locație') && s.includes('proiectul de'),
      );
    const designStepsFromStore = found.designSteps;
    const useDefaultDesignSteps = designStepsFromStore === undefined;
    return {
      ...def,
      ...found,
      label: def.label,
      categorySubtitle: found.categorySubtitle ?? def.categorySubtitle,
      checklistPdfUrl: def.checklistPdfUrl,
      checklistPdfFileName: def.checklistPdfFileName,
      checklistPageImageUrl: def.checklistPageImageUrl,
      equipmentPdfUrl: def.equipmentPdfUrl,
      equipmentPdfFileName: def.equipmentPdfFileName,
      equipmentPageImageUrl: def.equipmentPageImageUrl,
      stepsPdfUrl: def.stepsPdfUrl,
      stepsPdfFileName: def.stepsPdfFileName,
      stepsPageImageUrl: def.stepsPageImageUrl,
      videoUrl: found.videoUrl?.trim() || def.videoUrl,
      videoTitle: found.videoTitle?.trim() || def.videoTitle,
      preMeasurementConditions: useDefaultPre ? def.preMeasurementConditions : preFromStore,
      preDesignConditions: useDefaultDesign ? def.preDesignConditions : designFromStore,
      equipment: useDefaultEquip ? def.equipment : equipFromStore,
      steps: useDefaultSteps ? def.steps : stepsFromStore,
      designSteps: useDefaultDesignSteps ? def.designSteps : designStepsFromStore,
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
      preDesignConditions:
        patch.preDesignConditions ?? base.preDesignConditions ?? defaultPreDesignConditions(id),
      equipment: patch.equipment ?? base.equipment,
      steps: patch.steps ?? base.steps,
      designSteps: patch.designSteps ?? base.designSteps ?? [],
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
