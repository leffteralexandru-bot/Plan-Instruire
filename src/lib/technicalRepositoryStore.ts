import {
  DEFAULT_TECHNICAL_REPOSITORY,
  type TechnicalCatalogItem,
  type TechnicalManual,
  type TechnicalRepositoryData,
} from '@/data/technicalRepository';
import { PLATFORM_SETTINGS_ADMIN_NAME } from '@/lib/platformSettingsAdmin';
import { canEditTrainingPlan } from '@/lib/roles';
import type { User } from '@/types';

const STORAGE_KEY = 'artgranit_technical_repository';

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

function mergeCatalog(
  defaults: TechnicalCatalogItem[],
  stored: TechnicalCatalogItem[] | undefined,
): TechnicalCatalogItem[] {
  if (stored && stored.length > 0) return stored;
  return defaults;
}

function mergeManuals(
  defaults: TechnicalManual[],
  stored: TechnicalManual[] | undefined,
): TechnicalManual[] {
  if (!stored?.length) return defaults;
  const storedById = new Map(stored.map((m) => [m.id, m]));
  return defaults.map((def) => {
    const found = storedById.get(def.id);
    return found ? { ...def, ...found, chapters: def.chapters } : def;
  });
}

function notifyUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('technical-repository-updated'));
  }
}

export const technicalRepositoryStore = {
  get(): TechnicalRepositoryData {
    const stored = readJson<Partial<TechnicalRepositoryData>>(STORAGE_KEY, {});
    const base = DEFAULT_TECHNICAL_REPOSITORY;
    return {
      productsIntro: stored.productsIntro ?? base.productsIntro,
      manualsIntro: stored.manualsIntro ?? base.manualsIntro,
      products: mergeCatalog(base.products, stored.products),
      productManuals: mergeManuals(base.productManuals, stored.productManuals),
      manuals: mergeManuals(base.manuals, stored.manuals),
      updatedAt: stored.updatedAt,
      updatedByName: stored.updatedByName,
    };
  },

  save(patch: Partial<TechnicalRepositoryData>, actor: Pick<User, 'id' | 'name' | 'roles'>): TechnicalRepositoryData {
    if (!canEditTrainingPlan(actor)) {
      throw new Error(`Doar ${PLATFORM_SETTINGS_ADMIN_NAME} poate modifica Repository Tehnic.`);
    }
    const current = technicalRepositoryStore.get();
    const saved: TechnicalRepositoryData = {
      ...current,
      ...patch,
      products: patch.products ?? current.products,
      productManuals: patch.productManuals ?? current.productManuals,
      manuals: patch.manuals ?? current.manuals,
      updatedAt: nowIso(),
      updatedByName: actor.name,
    };
    writeJson(STORAGE_KEY, saved);
    notifyUpdate();
    return saved;
  },
};
