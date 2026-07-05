import type { ErrorCase, ReTrainingSession } from '@/types';
import { normalizeErrorHrStatus } from '@/lib/errorCaseWorkflow';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';

export function getErrorReTrainingSession(err: ErrorCase): ReTrainingSession | undefined {
  if (err.reTrainingSessionId) {
    return trainingSystemStore.getSessionById(err.reTrainingSessionId);
  }
  return trainingSystemStore
    .getReTrainingSessions()
    .find((s) => s.errorCaseIds.includes(err.id));
}

/** Erori în flux activ: așteaptă HR sau re-instruire nefinalizată */
export function isActiveReTrainingPipelineError(err: ErrorCase): boolean {
  const hrStatus = normalizeErrorHrStatus(err);
  if (hrStatus === 'trimis_hr') return true;
  if (hrStatus !== 'aprobat_hr') return false;
  const session = getErrorReTrainingSession(err);
  if (!session) return true;
  return normalizeReTrainingStatus(session.status) !== 'finalizat';
}

export function isHistoryOnlyError(err: ErrorCase): boolean {
  return !isActiveReTrainingPipelineError(err);
}

export function getErrorsForSession(session: ReTrainingSession): ErrorCase[] {
  const all = hrPerformanceStore.getErrorCases();
  const ids = new Set(session.errorCaseIds);
  return all.filter((e) => ids.has(e.id) || e.reTrainingSessionId === session.id);
}

export function getTopicKey(angajatId: string, topicDayId: string, topicTitle: string): string {
  return `${angajatId}::${topicDayId}::${topicTitle}`;
}

export function getErrorTopicMeta(err: ErrorCase): {
  topicDayId: string;
  topicTitle: string;
} {
  const session = getErrorReTrainingSession(err);
  return {
    topicDayId: session?.topicDayId ?? err.reTrainingProposal?.topicDayId ?? 'unknown',
    topicTitle: session?.topicTitle ?? err.reTrainingProposal?.topicTitle ?? 'Temă nespecificată',
  };
}

export interface ErrorReTrainingGroup {
  key: string;
  angajatId: string;
  topicDayId: string;
  topicTitle: string;
  errors: ErrorCase[];
  session?: ReTrainingSession;
  pendingHr: boolean;
}

export function buildErrorReTrainingGroups(errorCases: ErrorCase[]): ErrorReTrainingGroup[] {
  const map = new Map<string, ErrorReTrainingGroup>();

  for (const err of errorCases.filter(isActiveReTrainingPipelineError)) {
    const { topicDayId, topicTitle } = getErrorTopicMeta(err);
    const key = getTopicKey(err.angajatId, topicDayId, topicTitle);
    const hrStatus = normalizeErrorHrStatus(err);
    const session = getErrorReTrainingSession(err);

    const existing = map.get(key);
    if (existing) {
      if (!existing.errors.some((e) => e.id === err.id)) existing.errors.push(err);
      if (!existing.session && session) existing.session = session;
      existing.pendingHr = existing.pendingHr || hrStatus === 'trimis_hr';
    } else {
      map.set(key, {
        key,
        angajatId: err.angajatId,
        topicDayId,
        topicTitle,
        errors: [err],
        session,
        pendingHr: hrStatus === 'trimis_hr',
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const dateA = a.errors[0]?.updatedAt ?? '';
    const dateB = b.errors[0]?.updatedAt ?? '';
    return dateB.localeCompare(dateA);
  });
}

export function sortReTrainingSessionsNewestFirst(sessions: ReTrainingSession[]): ReTrainingSession[] {
  return [...sessions].sort((a, b) => {
    const da = a.finalizatLa ?? a.createdAt;
    const db = b.finalizatLa ?? b.createdAt;
    return db.localeCompare(da);
  });
}
