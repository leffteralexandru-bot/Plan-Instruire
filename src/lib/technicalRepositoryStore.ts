import {
  DEFAULT_TECHNICAL_REPOSITORY,
  type TechnicalCatalogItem,
  type TechnicalRepositoryData,
  type WarrantyMaterialId,
  type WarrantyMaterialPack,
} from '@/data/technicalRepository';
import { PLATFORM_SETTINGS_ADMIN_NAME } from '@/lib/platformSettingsAdmin';
import { canEditTrainingPlan } from '@/lib/roles';
import type { User } from '@/types';

const STORAGE_KEY = 'artgranit_technical_repository';
const WARRANTY_CHECK_PREFIX = 'artgranit_techrepo_warranty';

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

function mergeWarranty(
  defaults: WarrantyMaterialPack[],
  stored: WarrantyMaterialPack[] | undefined,
): WarrantyMaterialPack[] {
  return defaults.map((def) => {
    const found = stored?.find((w) => w.id === def.id);
    if (!found) return { ...def };
    return {
      ...def,
      ...found,
      label: def.label,
      checklist: found.checklist?.length ? found.checklist : def.checklist,
      markdown: found.markdown?.trim() ? found.markdown : def.markdown,
    };
  });
}

function mergeCatalog(
  defaults: TechnicalCatalogItem[],
  stored: TechnicalCatalogItem[] | undefined,
): TechnicalCatalogItem[] {
  if (stored && stored.length > 0) return stored;
  return defaults;
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
      materialsIntro: stored.materialsIntro ?? base.materialsIntro,
      warrantyIntro: stored.warrantyIntro ?? base.warrantyIntro,
      products: mergeCatalog(base.products, stored.products),
      materials: mergeCatalog(base.materials, stored.materials),
      warranty: mergeWarranty(base.warranty, stored.warranty),
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
      materials: patch.materials ?? current.materials,
      warranty: patch.warranty ?? current.warranty,
      updatedAt: nowIso(),
      updatedByName: actor.name,
    };
    writeJson(STORAGE_KEY, saved);
    notifyUpdate();
    return saved;
  },

  getWarrantyChecklist(userId: string, materialId: WarrantyMaterialId): boolean[] {
    return readJson<boolean[]>(`${WARRANTY_CHECK_PREFIX}_${userId}_${materialId}`, []);
  },

  setWarrantyChecklistItem(
    userId: string,
    materialId: WarrantyMaterialId,
    index: number,
    checked: boolean,
    length: number,
  ): boolean[] {
    const current = technicalRepositoryStore.getWarrantyChecklist(userId, materialId);
    const next = Array.from({ length }, (_, i) => current[i] ?? false);
    if (index >= 0 && index < next.length) next[index] = checked;
    writeJson(`${WARRANTY_CHECK_PREFIX}_${userId}_${materialId}`, next);
    return next;
  },
};
