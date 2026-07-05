import {
  DESIGNER_COMPETENCY_CRITERIA,
  type DesignerCompetencyCriterion,
} from '@/data/designerCompetencyMatrix';
import type { User } from '@/types';
import { canEditPlatformSettings } from '@/lib/platformSettingsAdmin';

const EVALUATION_SETTINGS_KEY = 'artgranit_evaluation_settings';

export const EVALUATION_SETTINGS_CHANGED_EVENT = 'artgranit:evaluation-settings-changed';

export const DEFAULT_EVALUATION_CYCLE_DAYS = 90;

export interface EvaluationSelfAssessmentFieldConfig {
  label: string;
  placeholder: string;
  minLength: number;
}

export interface EvaluationSettings {
  cycleDays: number;
  criteria: DesignerCompetencyCriterion[];
  selfAssessment: {
    realizari: EvaluationSelfAssessmentFieldConfig;
    dificultati: EvaluationSelfAssessmentFieldConfig;
    obiectiveViitoare: EvaluationSelfAssessmentFieldConfig;
  };
  updatedAt?: string;
  updatedByName?: string;
}

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

function cloneCriteria(): DesignerCompetencyCriterion[] {
  return DESIGNER_COMPETENCY_CRITERIA.map((c) => ({
    ...c,
    options: c.options.map((o) => ({ ...o })),
  }));
}

export function getDefaultEvaluationSettings(): EvaluationSettings {
  return {
    cycleDays: DEFAULT_EVALUATION_CYCLE_DAYS,
    criteria: cloneCriteria(),
    selfAssessment: {
      realizari: {
        label: 'Realizări în perioada evaluată',
        placeholder: 'Min. 20 caractere — proiecte, competențe dobândite…',
        minLength: 20,
      },
      dificultati: {
        label: 'Dificultăți întâmpinate',
        placeholder: 'Min. 10 caractere',
        minLength: 10,
      },
      obiectiveViitoare: {
        label: 'Obiective viitoare',
        placeholder: 'Min. 10 caractere',
        minLength: 10,
      },
    },
  };
}

function normalizeCycleDays(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_EVALUATION_CYCLE_DAYS;
  return Math.min(365, Math.max(30, Math.round(n)));
}

function normalizeCriteria(raw: unknown): DesignerCompetencyCriterion[] {
  if (!Array.isArray(raw) || raw.length !== DESIGNER_COMPETENCY_CRITERIA.length) {
    return cloneCriteria();
  }
  const defaults = cloneCriteria();
  return defaults.map((def, idx) => {
    const item = raw[idx] as Partial<DesignerCompetencyCriterion> | undefined;
    if (!item || item.id !== def.id) return def;
    return {
      ...def,
      label: item.label?.trim() || def.label,
      question: item.question?.trim() || def.question,
      supervisorQuestion: item.supervisorQuestion?.trim() || def.supervisorQuestion,
      options: def.options.map((opt, oi) => ({
        level: opt.level,
        text: item.options?.[oi]?.text?.trim() || opt.text,
      })),
    };
  });
}

function normalizeField(
  raw: Partial<EvaluationSelfAssessmentFieldConfig> | undefined,
  fallback: EvaluationSelfAssessmentFieldConfig,
): EvaluationSelfAssessmentFieldConfig {
  const minLength = Math.max(1, Math.min(500, Math.round(raw?.minLength ?? fallback.minLength)));
  return {
    label: raw?.label?.trim() || fallback.label,
    placeholder: raw?.placeholder?.trim() || fallback.placeholder,
    minLength,
  };
}

export function getEvaluationSettings(): EvaluationSettings {
  const defaults = getDefaultEvaluationSettings();
  const stored = readJson<Partial<EvaluationSettings> | null>(EVALUATION_SETTINGS_KEY, null);
  if (!stored) return defaults;
  return {
    cycleDays: normalizeCycleDays(stored.cycleDays),
    criteria: normalizeCriteria(stored.criteria),
    selfAssessment: {
      realizari: normalizeField(stored.selfAssessment?.realizari, defaults.selfAssessment.realizari),
      dificultati: normalizeField(stored.selfAssessment?.dificultati, defaults.selfAssessment.dificultati),
      obiectiveViitoare: normalizeField(
        stored.selfAssessment?.obiectiveViitoare,
        defaults.selfAssessment.obiectiveViitoare,
      ),
    },
    updatedAt: stored.updatedAt,
    updatedByName: stored.updatedByName,
  };
}

export function getEvaluationCycleDays(): number {
  return getEvaluationSettings().cycleDays;
}

export function getEvaluationCriteria(): DesignerCompetencyCriterion[] {
  return getEvaluationSettings().criteria;
}

export function getEvaluationSelfAssessmentFields(): EvaluationSettings['selfAssessment'] {
  return getEvaluationSettings().selfAssessment;
}

export function saveEvaluationSettings(
  patch: Partial<Pick<EvaluationSettings, 'cycleDays' | 'criteria' | 'selfAssessment'>>,
  actor: Pick<User, 'id' | 'name' | 'email'>,
): EvaluationSettings {
  if (!canEditPlatformSettings(actor)) {
    throw new Error('Doar Alex poate modifica setările de evaluare.');
  }
  const current = getEvaluationSettings();
  const next: EvaluationSettings = {
    ...current,
    cycleDays: patch.cycleDays != null ? normalizeCycleDays(patch.cycleDays) : current.cycleDays,
    criteria: patch.criteria ? normalizeCriteria(patch.criteria) : current.criteria,
    selfAssessment: patch.selfAssessment
      ? {
          realizari: normalizeField(patch.selfAssessment.realizari, current.selfAssessment.realizari),
          dificultati: normalizeField(patch.selfAssessment.dificultati, current.selfAssessment.dificultati),
          obiectiveViitoare: normalizeField(
            patch.selfAssessment.obiectiveViitoare,
            current.selfAssessment.obiectiveViitoare,
          ),
        }
      : current.selfAssessment,
    updatedAt: nowIso(),
    updatedByName: actor.name,
  };
  writeJson(EVALUATION_SETTINGS_KEY, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVALUATION_SETTINGS_CHANGED_EVENT));
  }
  return next;
}

export function resetEvaluationSettings(actor: Pick<User, 'id' | 'name' | 'email'>): EvaluationSettings {
  if (!canEditPlatformSettings(actor)) {
    throw new Error('Doar Alex poate modifica setările de evaluare.');
  }
  const next = getDefaultEvaluationSettings();
  next.updatedAt = nowIso();
  next.updatedByName = actor.name;
  writeJson(EVALUATION_SETTINGS_KEY, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVALUATION_SETTINGS_CHANGED_EVENT));
  }
  return next;
}
