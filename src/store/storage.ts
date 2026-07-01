import type { AppProgress, AuditEntry, AuthState, OrgSettings, User } from '@/types';
import { getDefaultOrgSettings } from '@/data/bitrix';

const AUTH_KEY = 'artgranit_auth';
const PROGRESS_KEY = 'artgranit_progress';
const SELECTED_STAGIAR_KEY = 'artgranit_selected_stagiar';
const SETTINGS_KEY = 'artgranit_settings';
const SCHEMA_VERSION = 2;

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

function migrateProgress(p: AppProgress): AppProgress {
  return {
    schemaVersion: SCHEMA_VERSION,
    photos: p.photos ?? [],
    auditLog: p.auditLog ?? [],
    userId: p.userId,
    days: p.days ?? {},
    feedbacks: p.feedbacks ?? [],
    acteConstatare: p.acteConstatare ?? [],
    lastVisitedDayId: p.lastVisitedDayId,
    developmentPlan: p.developmentPlan,
    certificate: p.certificate,
  };
}

export const storage = {
  getAuth(): AuthState {
    return readJson<AuthState>(AUTH_KEY, { user: null, isAuthenticated: false });
  },

  setAuth(user: User): void {
    writeJson<AuthState>(AUTH_KEY, { user, isAuthenticated: true });
  },

  clearAuth(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  getSelectedStagiarId(): string | null {
    return localStorage.getItem(SELECTED_STAGIAR_KEY);
  },

  setSelectedStagiarId(id: string): void {
    localStorage.setItem(SELECTED_STAGIAR_KEY, id);
  },

  getSettings(): OrgSettings {
    return readJson<OrgSettings>(SETTINGS_KEY, getDefaultOrgSettings());
  },

  saveSettings(settings: OrgSettings): void {
    writeJson(SETTINGS_KEY, settings);
  },

  getAllProgress(): Record<string, AppProgress> {
    return readJson<Record<string, AppProgress>>(PROGRESS_KEY, {});
  },

  getProgress(userId: string): AppProgress {
    const all = readJson<Record<string, AppProgress>>(PROGRESS_KEY, {});
    const raw = all[userId];
    if (!raw) {
      return { userId, days: {}, feedbacks: [], acteConstatare: [], photos: [], auditLog: [], schemaVersion: SCHEMA_VERSION };
    }
    return migrateProgress(raw);
  },

  saveProgress(progress: AppProgress): void {
    const all = readJson<Record<string, AppProgress>>(PROGRESS_KEY, {});
    all[progress.userId] = { ...progress, schemaVersion: SCHEMA_VERSION };
    writeJson(PROGRESS_KEY, all);
  },

  importAllProgress(progressMap: Record<string, AppProgress>): void {
    const all = readJson<Record<string, AppProgress>>(PROGRESS_KEY, {});
    for (const [userId, raw] of Object.entries(progressMap)) {
      all[userId] = migrateProgress({ ...raw, userId });
    }
    writeJson(PROGRESS_KEY, all);
  },

  appendAudit(userId: string, entry: Omit<AuditEntry, 'id' | 'createdAt'>): void {
    const p = storage.getProgress(userId);
    const full: AuditEntry = { ...entry, id: `audit-${Date.now()}`, createdAt: new Date().toISOString() };
    storage.saveProgress({ ...p, auditLog: [...p.auditLog, full].slice(-200) });
  },
};

export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
