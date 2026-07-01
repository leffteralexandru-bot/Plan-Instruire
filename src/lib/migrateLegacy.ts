import type { AppProgress } from '@/types';

/** Mapare ID-uri vechi → ID-uri curente artGRANIT */
const LEGACY_USER_ID_MAP: Record<string, string> = {
  'u-stagiar': 'u-stagiar-1',
};

const MIGRATION_FLAG = 'artgranit_legacy_migrated_v1';

export function migrateLegacyProgressIds(
  getAll: () => Record<string, AppProgress>,
  saveAll: (map: Record<string, AppProgress>) => void,
): number {
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return 0;
  } catch {
    /* SSR / test fără localStorage */
  }

  const all = { ...getAll() };
  let moved = 0;

  for (const [legacyId, newId] of Object.entries(LEGACY_USER_ID_MAP)) {
    if (!all[legacyId]) continue;
    const existing = all[newId];
    const legacy = all[legacyId];
    if (!existing || legacy.auditLog.length > existing.auditLog.length) {
      all[newId] = { ...legacy, userId: newId };
      moved += 1;
    }
    delete all[legacyId];
  }

  if (moved > 0) saveAll(all);
  try {
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  } catch {
    /* ignore */
  }
  return moved;
}

export function runStorageMigrations(): void {
  migrateLegacyProgressIds(
    () => {
      try {
        const raw = localStorage.getItem('artgranit_progress');
        return raw ? (JSON.parse(raw) as Record<string, AppProgress>) : {};
      } catch {
        return {};
      }
    },
    (map) => localStorage.setItem('artgranit_progress', JSON.stringify(map)),
  );
}
