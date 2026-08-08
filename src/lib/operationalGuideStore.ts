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

/**
 * Migrare ghid teren (A–F): forțează conținutul oficial din defaults dacă lipsește
 * sau dacă e versiunea veche (fără obligații / checklist final / kit).
 */
function needsFieldGuideRefresh(found: OperationalGuideTask, def: OperationalGuideTask): boolean {
  if (!found.fieldObligations?.length) return true;
  if (!found.typeFieldRules?.length) return true;
  if (!found.finalChecklist?.length) return true;
  if (!found.kitDocuments?.length) return true;
  if (!found.steps?.length || found.steps.length < def.steps.length) return true;
  if (!found.equipment?.[0]?.includes('ANEXA')) return true;
  return false;
}

function mergeWithDefaults(stored: OperationalGuideTask[]): OperationalGuideTask[] {
  return DEFAULT_OPERATIONAL_GUIDE.map((def) => {
    const found = stored.find((t) => t.id === def.id);
    if (!found) return { ...def };

    const refreshField = needsFieldGuideRefresh(found, def);
    const designFromStore = found.preDesignConditions;
    const useDefaultDesign = !designFromStore || designFromStore.length === 0;
    const designStepsFromStore = found.designSteps;
    const useDefaultDesignSteps = designStepsFromStore === undefined;

    return {
      ...def,
      ...found,
      label: def.label,
      categorySubtitle: def.categorySubtitle,
      introText: refreshField ? def.introText : found.introText?.trim() || def.introText,
      checklistPdfUrl: def.checklistPdfUrl,
      checklistPdfFileName: def.checklistPdfFileName,
      checklistPageImageUrl: def.checklistPageImageUrl,
      equipmentPdfUrl: def.equipmentPdfUrl,
      equipmentPdfFileName: def.equipmentPdfFileName,
      equipmentPageImageUrl: def.equipmentPageImageUrl,
      stepsPdfUrl: def.stepsPdfUrl,
      stepsPdfFileName: def.stepsPdfFileName,
      stepsPageImageUrl: def.stepsPageImageUrl,
      fieldGuidePdfUrl: def.fieldGuidePdfUrl,
      fieldGuidePdfFileName: def.fieldGuidePdfFileName,
      videoUrl: found.videoUrl?.trim() || def.videoUrl,
      videoTitle: found.videoTitle?.trim() || def.videoTitle,
      preMeasurementConditions: refreshField
        ? def.preMeasurementConditions
        : found.preMeasurementConditions?.length
          ? found.preMeasurementConditions
          : def.preMeasurementConditions,
      preDesignConditions: useDefaultDesign ? def.preDesignConditions : designFromStore,
      fieldObligations: refreshField ? def.fieldObligations : found.fieldObligations,
      typeFieldRules: refreshField ? def.typeFieldRules : found.typeFieldRules,
      equipment: refreshField ? def.equipment : found.equipment,
      kitDocuments: refreshField ? def.kitDocuments : found.kitDocuments,
      steps: refreshField ? def.steps : found.steps,
      finalChecklist: refreshField ? def.finalChecklist : found.finalChecklist,
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
      fieldObligations: patch.fieldObligations ?? base.fieldObligations,
      typeFieldRules: patch.typeFieldRules ?? base.typeFieldRules,
      equipment: patch.equipment ?? base.equipment,
      kitDocuments: patch.kitDocuments ?? base.kitDocuments,
      steps: patch.steps ?? base.steps,
      finalChecklist: patch.finalChecklist ?? base.finalChecklist,
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
