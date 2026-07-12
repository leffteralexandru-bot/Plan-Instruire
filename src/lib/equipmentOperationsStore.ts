import {
  DEFAULT_EQUIPMENT_OPERATIONS,
  type EquipmentDevice,
  type EquipmentOperationsData,
} from '@/data/equipmentOperations';
import { canEditTrainingPlan } from '@/lib/roles';
import type { User } from '@/types';

const STORAGE_KEY = 'artgranit_equipment_operations';

/** Placeholdere eliminate din lista implicită — curățare la încărcare din localStorage. */
const REMOVED_PLACEHOLDER_NAMES = new Set([
  'Stație totală / teodolit',
  'Laser distanță (distanțometru)',
  'Ruletă digitală / bandă laser',
]);

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

function notifyUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('equipment-operations-updated'));
  }
}

function mergeDevices(defaults: EquipmentDevice[], stored: EquipmentDevice[] | undefined): EquipmentDevice[] {
  if (!stored || stored.length === 0) return defaults;

  const defaultById = new Map(defaults.map((d) => [d.id, d]));
  const merged = stored.map((device) => {
    const base = defaultById.get(device.id);
    if (!base?.chapters?.length) return device;
    const isBuiltInManual =
      device.id === 'eq-proliner' ||
      device.id === 'eq-prodim-ct' ||
      device.id === 'eq-proliner-4x' ||
      device.id === 'eq-prodim-stairs' ||
      device.id === 'eq-proliner-stairs-app' ||
      device.id === 'eq-proliner-remote' ||
      device.id === 'eq-proliner-new-remote' ||
      device.id === 'eq-bosch-gll-3-80' ||
      device.id === 'eq-bosch-glm-40' ||
      device.id === 'eq-bosch-tape-5m' ||
      device.id === 'eq-factory-fabricator';
    return {
      ...device,
      ...(isBuiltInManual ? { name: base.name, description: base.description, category: base.category } : {}),
      chapters:
        device.id === 'eq-proliner' && base.chapters?.length
          ? base.chapters
          : device.id === 'eq-prodim-ct' && base.chapters?.length
            ? base.chapters
            : device.id === 'eq-proliner-4x' && base.chapters?.length
              ? base.chapters
              : device.id === 'eq-prodim-stairs' && base.chapters?.length
                ? base.chapters
                : device.id === 'eq-proliner-stairs-app' && base.chapters?.length
                  ? base.chapters
                  : device.id === 'eq-proliner-remote' && base.chapters?.length
                    ? base.chapters
                    : device.id === 'eq-proliner-new-remote' && base.chapters?.length
                      ? base.chapters
                      : device.id === 'eq-bosch-gll-3-80' && base.chapters?.length
                        ? base.chapters
                        : device.id === 'eq-bosch-glm-40' && base.chapters?.length
                          ? base.chapters
                          : device.id === 'eq-bosch-tape-5m' && base.chapters?.length
                            ? base.chapters
                            : device.id === 'eq-factory-fabricator' && base.chapters?.length
                    ? base.chapters
                    : device.chapters?.length
            ? device.chapters.map((ch, i) => {
                const baseCh = base.chapters?.[i];
                if (!baseCh) return ch;
                const mergedCh = { ...ch };
                if (baseCh.pages?.length && !ch.pages?.length) mergedCh.pages = baseCh.pages;
                if (baseCh.blocks?.length && !ch.blocks?.length) mergedCh.blocks = baseCh.blocks;
                if (!ch.videoUrl && baseCh.videoUrl) mergedCh.videoUrl = baseCh.videoUrl;
                mergedCh.title = baseCh.title;
                mergedCh.summary = baseCh.summary;
                mergedCh.pdfUrl = baseCh.pdfUrl;
                mergedCh.pdfFileName = baseCh.pdfFileName;
                return mergedCh;
              })
            : base.chapters,
      safetyWarning: device.safetyWarning ?? base.safetyWarning,
      manualPdfUrl: device.manualPdfUrl ?? base.manualPdfUrl,
    };
  });

  for (const d of defaults) {
    if (!merged.some((m) => m.id === d.id)) merged.unshift(d);
  }

  const defaultOrder = new Map(defaults.map((d, i) => [d.id, i]));
  return merged
    .filter(
      (d) => defaultById.has(d.id) || !REMOVED_PLACEHOLDER_NAMES.has(d.name),
    )
    .sort(
      (a, b) =>
        (defaultOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (defaultOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
}

export const equipmentOperationsStore = {
  get(): EquipmentOperationsData {
    const stored = readJson<Partial<EquipmentOperationsData>>(STORAGE_KEY, {});
    const base = DEFAULT_EQUIPMENT_OPERATIONS;
    return {
      intro: stored.intro ?? base.intro,
      devices: mergeDevices(base.devices, stored.devices),
      updatedAt: stored.updatedAt,
      updatedByName: stored.updatedByName,
    };
  },

  save(
    patch: Partial<EquipmentOperationsData>,
    actor: Pick<User, 'id' | 'name' | 'roles'>,
  ): EquipmentOperationsData {
    if (!canEditTrainingPlan(actor)) {
      throw new Error('Doar Resurse Umane (HR) pot modifica Mentenanță și Operare Echipament.');
    }
    const current = equipmentOperationsStore.get();
    const saved: EquipmentOperationsData = {
      ...current,
      ...patch,
      devices: patch.devices ?? current.devices,
      updatedAt: nowIso(),
      updatedByName: actor.name,
    };
    writeJson(STORAGE_KEY, saved);
    notifyUpdate();
    return saved;
  },
};
