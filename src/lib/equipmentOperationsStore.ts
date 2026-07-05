import {
  DEFAULT_EQUIPMENT_OPERATIONS,
  type EquipmentDevice,
  type EquipmentOperationsData,
} from '@/data/equipmentOperations';
import { canEditTrainingPlan } from '@/lib/roles';
import type { User } from '@/types';

const STORAGE_KEY = 'artgranit_equipment_operations';

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
  if (stored && stored.length > 0) return stored;
  return defaults;
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
