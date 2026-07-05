import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { pushHrPerformanceToCloud } from '@/lib/hrPerformanceSync';
import { trainingSystemStore } from '@/lib/trainingSystemStore';

const ERRORS_KEY = 'artgranit_error_cases';
const RE_TRAINING_KEY = 'artgranit_re_training_sessions';
const ERROR_ALERTS_KEY = 'artgranit_error_repeat_alerts';
const DOCS_KEY = 'artgranit_hr_documents';
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

export interface ResetErrorWorkflowResult {
  removedErrors: number;
  removedSessions: number;
  removedAlerts: number;
  removedDocuments: number;
  profilesReactivated: number;
}

/** Șterge toate erorile, sesiunile de re-instruire și datele legate — pentru retestare flux. */
export function resetAllErrorWorkflowData(): ResetErrorWorkflowResult {
  const errors = readJson<{ id: string; angajatId: string }[]>(ERRORS_KEY, []);
  const sessions = readJson<{ id: string; angajatId: string }[]>(RE_TRAINING_KEY, []);
  const alerts = readJson<unknown[]>(ERROR_ALERTS_KEY, []);

  const errorIds = new Set(errors.map((e) => e.id));
  const sessionIds = new Set(sessions.map((s) => s.id));

  const docs = readJson<{ id: string; errorCaseId?: string; reTrainingSessionId?: string }[]>(
    DOCS_KEY,
    [],
  );
  const keptDocs = docs.filter(
    (d) =>
      !(d.errorCaseId && errorIds.has(d.errorCaseId)) &&
      !(d.reTrainingSessionId && sessionIds.has(d.reTrainingSessionId)),
  );

  const angajatIds = new Set([
    ...errors.map((e) => e.angajatId),
    ...sessions.map((s) => s.angajatId),
  ]);

  let profilesReactivated = 0;
  for (const angajatId of angajatIds) {
    const profile = hrPerformanceStore.getProfile(angajatId);
    if (profile?.status === 'in_reinstruire') {
      hrPerformanceStore.updateProfile(angajatId, { status: 'activ' });
      profilesReactivated += 1;
    }
  }

  writeJson(ERRORS_KEY, []);
  writeJson(RE_TRAINING_KEY, []);
  writeJson(ERROR_ALERTS_KEY, []);
  if (keptDocs.length !== docs.length) writeJson(DOCS_KEY, keptDocs);

  hrPerformanceStore.touchUpdatedAt();

  return {
    removedErrors: errors.length,
    removedSessions: sessions.length,
    removedAlerts: alerts.length,
    removedDocuments: docs.length - keptDocs.length,
    profilesReactivated,
  };
}

export interface ResetErrorWorkflowSyncResult extends ResetErrorWorkflowResult {
  remainingErrors: number;
  remainingSessions: number;
  cloudSynced: boolean;
}

/** Reset local + verificare + push cloud ca erorile să nu revină la reîncărcare. */
export async function resetAllErrorWorkflowDataAndSync(): Promise<ResetErrorWorkflowSyncResult> {
  const result = resetAllErrorWorkflowData();
  const remaining = countPendingErrorWorkflowItems();
  const cloudSynced =
    remaining.errors === 0 && remaining.reTrainingSessions === 0
      ? await pushHrPerformanceToCloud()
      : false;

  return {
    ...result,
    remainingErrors: remaining.errors,
    remainingSessions: remaining.reTrainingSessions,
    cloudSynced,
  };
}

/** Verificare rapidă — lista goală după reset */
export function countPendingErrorWorkflowItems(): {
  errors: number;
  reTrainingSessions: number;
} {
  return {
    errors: hrPerformanceStore.getErrorCases().length,
    reTrainingSessions: trainingSystemStore.getReTrainingSessions().length,
  };
}
