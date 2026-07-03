import type { DepartmentId } from '@/data/departments';
import type {
  EmployeeArchiveFolder,
  ErrorCase,
  ErrorRepeatAlert,
  HrDocument,
  PlanArchiveIndexEntry,
  PlanArchiveRecord,
  ReTrainingSession,
  TrainerReport,
} from '@/types';
import { getTrainingPlan } from '@/lib/departmentPlans';
import {
  alertSeverity,
  buildReTrainingDescription,
  buildReTrainingTitle,
  computeReTrainingDeadline,
  getErrorTag,
  shouldTriggerRepeatAlert,
} from '@/lib/errorRepeatEngine';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { migrateReTrainingSession, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { resolveSupervisorId } from '@/lib/supervisor';

const PLAN_ARCHIVES_KEY = 'artgranit_plan_archives';
const RE_TRAINING_KEY = 'artgranit_re_training_sessions';
const ERROR_ALERTS_KEY = 'artgranit_error_repeat_alerts';

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

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readSessions(): ReTrainingSession[] {
  return readJson<ReTrainingSession[]>(RE_TRAINING_KEY, []).map(migrateReTrainingSession);
}

function writeSessions(sessions: ReTrainingSession[]): void {
  writeJson(RE_TRAINING_KEY, sessions);
}

function setAngajatReTrainingStatus(angajatId: string, inReTraining: boolean): void {
  if (!hrPerformanceStore.getProfile(angajatId)) return;
  hrPerformanceStore.updateProfile(angajatId, {
    status: inReTraining ? 'in_reinstruire' : 'activ',
  });
}

export function getBaseTrainingTopics(departmentId: DepartmentId = 'ingineri') {
  const plan = getTrainingPlan(departmentId);
  if (!plan) return [];
  return plan.flatMap((week) =>
    week.days.map((day) => ({
      dayId: day.id,
      dayNumber: day.dayNumber,
      weekNumber: week.weekNumber,
      title: day.title,
      label: `S${week.weekNumber} · Z${day.dayNumber}: ${day.title}`,
    })),
  );
}

export function buildPlanArchiveIndex(departmentId: DepartmentId): PlanArchiveIndexEntry[] {
  const plan = getTrainingPlan(departmentId);
  if (!plan) return [];
  return plan.flatMap((week) =>
    week.days.map((day) => ({
      weekId: week.id,
      weekNumber: week.weekNumber,
      weekTitle: week.title,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayTitle: day.title,
      materials: day.materials,
      instructions: day.tasks.map((t) => t.label),
    })),
  );
}

export const trainingSystemStore = {
  getPlanArchives(): PlanArchiveRecord[] {
    return readJson<PlanArchiveRecord[]>(PLAN_ARCHIVES_KEY, []);
  },

  getPlanArchive(angajatId: string): PlanArchiveRecord | undefined {
    return trainingSystemStore.getPlanArchives().find((a) => a.angajatId === angajatId);
  },

  tryArchiveCompletedPlan(input: {
    angajatId: string;
    departmentId: DepartmentId;
    enrollmentId?: string;
    progressPercent: number;
    allDaysComplete: boolean;
  }): PlanArchiveRecord | null {
    if (!input.allDaysComplete) return null;
    const existing = trainingSystemStore.getPlanArchive(input.angajatId);
    if (existing) return existing;
    const index = buildPlanArchiveIndex(input.departmentId);
    const record: PlanArchiveRecord = {
      id: newId('parc'),
      angajatId: input.angajatId,
      departmentId: input.departmentId,
      enrollmentId: input.enrollmentId,
      completedAt: nowIso(),
      progressPercent: input.progressPercent,
      index,
    };
    const archives = trainingSystemStore.getPlanArchives();
    archives.push(record);
    writeJson(PLAN_ARCHIVES_KEY, archives);
    return record;
  },

  getReTrainingSessions(filters?: {
    angajatId?: string;
    mentorId?: string;
    supervisorId?: string;
    trainerId?: string;
  }): ReTrainingSession[] {
    let sessions = readSessions();
    if (filters?.angajatId) sessions = sessions.filter((s) => s.angajatId === filters.angajatId);
    if (filters?.supervisorId) sessions = sessions.filter((s) => s.supervisorId === filters.supervisorId);
    if (filters?.trainerId) {
      sessions = sessions.filter((s) => (s.trainerId ?? s.mentorId) === filters.trainerId);
    }
    if (filters?.mentorId) {
      sessions = sessions.filter((s) => s.mentorId === filters.mentorId || s.trainerId === filters.mentorId);
    }
    return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getSessionById(sessionId: string): ReTrainingSession | undefined {
    return readSessions().find((s) => s.id === sessionId);
  },

  updateSession(sessionId: string, patch: Partial<ReTrainingSession>): ReTrainingSession | null {
    const sessions = readSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return null;
    sessions[idx] = migrateReTrainingSession({ ...sessions[idx]!, ...patch });
    writeSessions(sessions);
    return sessions[idx]!;
  },

  planReTrainingBySupervisor(
    sessionId: string,
    input: { topicDayId: string; topicTitle: string; trainerId: string; supervisorId: string },
  ): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'alerta_supervizor') return null;
    setAngajatReTrainingStatus(session.angajatId, true);
    return trainingSystemStore.updateSession(sessionId, {
      topicDayId: input.topicDayId,
      topicTitle: input.topicTitle,
      trainerId: input.trainerId,
      mentorId: input.trainerId,
      supervisorId: input.supervisorId,
      status: 'planificat',
      titlu: `Re-instruire: ${input.topicTitle}`,
    });
  },

  startReTraining(sessionId: string): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'planificat') return null;
    return trainingSystemStore.updateSession(sessionId, { status: 'in_curs' });
  },

  submitTrainerReport(sessionId: string, report: TrainerReport): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session) return null;
    const st = normalizeReTrainingStatus(session.status);
    if (st !== 'planificat' && st !== 'in_curs') return null;
    return trainingSystemStore.updateSession(sessionId, {
      trainerReport: report,
      status: 'raport_trainer',
      documentIds: report.documentId
        ? [...new Set([...session.documentIds, report.documentId])]
        : session.documentIds,
    });
  },

  confirmBySupervisor(sessionId: string, supervisorId: string): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'raport_trainer') return null;
    return trainingSystemStore.updateSession(sessionId, {
      status: 'confirmat_supervizor',
      supervisorConfirmedAt: nowIso(),
      supervisorConfirmedBy: supervisorId,
    });
  },

  confirmByHr(sessionId: string, hrUser: { id: string; name: string }): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'confirmat_supervizor') return null;
    setAngajatReTrainingStatus(session.angajatId, false);
    return trainingSystemStore.updateSession(sessionId, {
      status: 'finalizat',
      finalizatLa: nowIso(),
      hrConfirmedAt: nowIso(),
      hrConfirmedBy: hrUser.id,
      hrConfirmedByName: hrUser.name,
    });
  },

  completeReTrainingSession(sessionId: string): ReTrainingSession | null {
    return trainingSystemStore.updateSession(sessionId, {
      status: 'finalizat',
      finalizatLa: nowIso(),
    });
  },

  getErrorRepeatAlerts(filters?: {
    angajatId?: string;
    mentorId?: string;
    supervisorId?: string;
    unacknowledgedOnly?: boolean;
  }): ErrorRepeatAlert[] {
    let alerts = readJson<ErrorRepeatAlert[]>(ERROR_ALERTS_KEY, []);
    if (filters?.angajatId) alerts = alerts.filter((a) => a.angajatId === filters.angajatId);
    if (filters?.supervisorId) {
      alerts = alerts.filter((a) => (a.supervisorId ?? a.mentorId) === filters.supervisorId);
    }
    if (filters?.mentorId) alerts = alerts.filter((a) => a.mentorId === filters.mentorId);
    if (filters?.unacknowledgedOnly) alerts = alerts.filter((a) => !a.acknowledgedAt);
    return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  acknowledgeAlert(alertId: string): ErrorRepeatAlert | null {
    const alerts = readJson<ErrorRepeatAlert[]>(ERROR_ALERTS_KEY, []);
    const idx = alerts.findIndex((a) => a.id === alertId);
    if (idx < 0) return null;
    alerts[idx] = { ...alerts[idx]!, acknowledgedAt: nowIso() };
    writeJson(ERROR_ALERTS_KEY, alerts);
    return alerts[idx]!;
  },

  processErrorRepeat(newCase: ErrorCase): ErrorRepeatAlert | null {
    const allCases = hrPerformanceStore.getErrorCases();
    const { trigger, recentCases } = shouldTriggerRepeatAlert(allCases, newCase);
    if (!trigger) return null;

    const supervisorId = resolveSupervisorId(newCase.angajatId);
    if (!supervisorId) return null;

    const openAlerts = trainingSystemStore
      .getErrorRepeatAlerts({ angajatId: newCase.angajatId, unacknowledgedOnly: true })
      .filter((a) => a.errorMotiv === newCase.motiv);

    const activeSession = trainingSystemStore
      .getReTrainingSessions({ angajatId: newCase.angajatId })
      .find(
        (s) =>
          s.errorMotiv === newCase.motiv && normalizeReTrainingStatus(s.status) !== 'finalizat',
      );

    if (openAlerts.length > 0 && activeSession) {
      const alerts = readJson<ErrorRepeatAlert[]>(ERROR_ALERTS_KEY, []);
      const idx = alerts.findIndex((a) => a.id === openAlerts[0]!.id);
      if (idx >= 0) {
        alerts[idx] = {
          ...alerts[idx]!,
          count: recentCases.length,
          errorCaseIds: recentCases.map((c) => c.id),
          severity: alertSeverity(recentCases.length),
        };
        writeJson(ERROR_ALERTS_KEY, alerts);
        return alerts[idx]!;
      }
    }

    const sessions = readSessions();
    const session: ReTrainingSession = activeSession ?? {
      id: newId('retr'),
      angajatId: newCase.angajatId,
      supervisorId,
      mentorId: supervisorId,
      errorMotiv: newCase.motiv,
      errorCaseIds: recentCases.map((c) => c.id),
      titlu: buildReTrainingTitle(newCase.motiv),
      descriere: buildReTrainingDescription(newCase.motiv, recentCases.length),
      materialUrls: [],
      documentIds: [],
      status: 'alerta_supervizor',
      termenLimita: computeReTrainingDeadline(),
      createdAt: nowIso(),
    };
    if (!activeSession) {
      sessions.push(session);
      writeSessions(sessions);
      setAngajatReTrainingStatus(newCase.angajatId, true);
    }

    const alerts = readJson<ErrorRepeatAlert[]>(ERROR_ALERTS_KEY, []);
    const alert: ErrorRepeatAlert = {
      id: newId('alert'),
      angajatId: newCase.angajatId,
      supervisorId,
      mentorId: supervisorId,
      errorMotiv: newCase.motiv,
      errorTag: getErrorTag(newCase.motiv),
      count: recentCases.length,
      errorCaseIds: recentCases.map((c) => c.id),
      reTrainingSessionId: session.id,
      severity: alertSeverity(recentCases.length),
      createdAt: nowIso(),
    };
    alerts.push(alert);
    writeJson(ERROR_ALERTS_KEY, alerts);
    return alert;
  },

  getDocumentsByFolder(angajatId: string, folder: EmployeeArchiveFolder): HrDocument[] {
    return hrPerformanceStore.getDocuments({ angajatId }).filter((d) => d.folder === folder);
  },

  exportTrainingSystemPayload() {
    return {
      planArchives: trainingSystemStore.getPlanArchives(),
      reTrainingSessions: trainingSystemStore.getReTrainingSessions(),
      errorRepeatAlerts: trainingSystemStore.getErrorRepeatAlerts(),
      updatedAt: nowIso(),
    };
  },
};
