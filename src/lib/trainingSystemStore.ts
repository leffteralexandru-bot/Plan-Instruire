import type { DepartmentId } from '@/data/departments';
import type {
  EmployeeArchiveFolder,
  ErrorCase,
  ErrorRepeatAlert,
  HrDocument,
  PlanArchiveIndexEntry,
  PlanArchiveRecord,
  ReinstruireCerere,
  ReinstruireCerereMotiv,
  ReTrainingSession,
  TrainerReport,
} from '@/types';
import { getTrainingPlan } from '@/lib/departmentPlans';
import {
  alertSeverity,
  buildReTrainingDescriptionFromGroupedErrors,
  buildReTrainingDescriptionForCase,
  buildReTrainingTitle,
  computeReTrainingDeadline,
  getErrorTag,
  getRecentSameMotivCases,
} from '@/lib/errorRepeatEngine';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { todayLocalIso, validatePlannedStartDate } from '@/lib/errorCaseWorkflow';
import { migrateReTrainingSession, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { resolveSupervisorId } from '@/lib/supervisor';
import { userStore } from '@/lib/userStore';

const PLAN_ARCHIVES_KEY = 'artgranit_plan_archives';
const RE_TRAINING_KEY = 'artgranit_re_training_sessions';
const ERROR_ALERTS_KEY = 'artgranit_error_repeat_alerts';

export const TRAINING_SYSTEM_UPDATED_EVENT = 'artgranit-training-system-updated';

function notifyTrainingSystemUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TRAINING_SYSTEM_UPDATED_EVENT));
  }
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

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readSessions(): ReTrainingSession[] {
  return readJson<ReTrainingSession[]>(RE_TRAINING_KEY, []).map(migrateReTrainingSession);
}

function writeSessions(sessions: ReTrainingSession[]): void {
  writeJson(RE_TRAINING_KEY, sessions);
  notifyTrainingSystemUpdated();
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

const CERERE_MOTIV_LABELS: Record<ReinstruireCerereMotiv, string> = {
  eroare: 'Am făcut o eroare',
  neintelegere: 'Nu am înțeles lecția',
  uitare: 'Am uitat procedura',
  altele: 'Altele',
};

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
    input: {
      topicDayId: string;
      topicTitle: string;
      trainerId: string;
      supervisorId: string;
      supplementaryDocumentIds?: string[];
      supplementaryNote?: string;
    },
  ): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'alerta_supervizor') return null;

    const linkedErrors = hrPerformanceStore
      .getErrorCases({ angajatId: session.angajatId })
      .filter((e) => session.errorCaseIds.includes(e.id));
    const allSigned = linkedErrors.every((e) => !!e.signedDocumentId);
    if (!allSigned) return null;

    return trainingSystemStore.updateSession(sessionId, {
      topicDayId: input.topicDayId,
      topicTitle: input.topicTitle,
      trainerId: input.trainerId,
      mentorId: input.trainerId,
      supervisorId: input.supervisorId,
      status: 'asteapta_hr',
      titlu: `Re-instruire: ${input.topicTitle}`,
      descriere: input.supplementaryNote?.trim()
        ? `${session.descriere}\n\nInformații suplimentare: ${input.supplementaryNote.trim()}`
        : session.descriere,
      documentIds: input.supplementaryDocumentIds?.length
        ? [...new Set([...session.documentIds, ...input.supplementaryDocumentIds])]
        : session.documentIds,
      supervisorSubmittedAt: nowIso(),
      supervisorSubmittedBy: input.supervisorId,
    });
  },

  approveReTrainingPlanByHr(
    sessionId: string,
    hrUser: { id: string; name: string },
  ): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'asteapta_hr') return null;
    setAngajatReTrainingStatus(session.angajatId, true);
    return trainingSystemStore.updateSession(sessionId, {
      status: 'planificat',
      hrPlanApprovedAt: nowIso(),
      hrPlanApprovedBy: hrUser.id,
      hrPlanApprovedByName: hrUser.name,
    });
  },

  startReTraining(sessionId: string): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || normalizeReTrainingStatus(session.status) !== 'planificat') return null;
    return trainingSystemStore.updateSession(sessionId, {
      status: 'in_curs',
      lessonProgress: session.lessonProgress ?? { completedTasks: [], mentorValidated: false },
    });
  },

  toggleReTrainingLessonTask(sessionId: string, taskId: string): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session) return null;
    const st = normalizeReTrainingStatus(session.status);
    if (st !== 'in_curs' && st !== 'planificat') return null;
    if (session.traineeCompletedAt) return session;
    const progress = session.lessonProgress ?? { completedTasks: [], mentorValidated: false };
    const completed = new Set(progress.completedTasks);
    if (completed.has(taskId)) completed.delete(taskId);
    else completed.add(taskId);
    return trainingSystemStore.updateSession(sessionId, {
      status: 'in_curs',
      lessonProgress: { ...progress, completedTasks: [...completed] },
    });
  },

  markReTrainingTraineeComplete(sessionId: string, userId: string): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session || session.angajatId !== userId) return null;
    const st = normalizeReTrainingStatus(session.status);
    if (st !== 'in_curs' && st !== 'planificat') return null;
    if (session.traineeCompletedAt) return session;
    return trainingSystemStore.updateSession(sessionId, {
      status: 'in_curs',
      traineeCompletedAt: nowIso(),
      traineeCompletedBy: userId,
    });
  },

  submitTrainerReport(sessionId: string, report: TrainerReport): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session) return null;
    const st = normalizeReTrainingStatus(session.status);
    const hrErrorFlow = !!session.hrPlanApprovedAt && session.errorCaseIds.length > 0;

    if (hrErrorFlow) {
      if (st !== 'in_curs' || !session.traineeCompletedAt) return null;
      if (!report.comprehension) return null;
      setAngajatReTrainingStatus(session.angajatId, false);
      return trainingSystemStore.updateSession(sessionId, {
        trainerReport: report,
        status: 'finalizat',
        finalizatLa: nowIso(),
        documentIds: report.documentId
          ? [...new Set([...session.documentIds, report.documentId])]
          : session.documentIds,
      });
    }

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
    setAngajatReTrainingStatus(session.angajatId, false);
    const now = nowIso();
    const patch: Partial<ReTrainingSession> = {
      status: 'finalizat',
      supervisorConfirmedAt: now,
      supervisorConfirmedBy: supervisorId,
      finalizatLa: now,
    };
    if (session.trigger === 'cerere_angajat') {
      patch.hrReportSubmittedAt = now;
      patch.hrReportSubmittedBy = supervisorId;
    }
    return trainingSystemStore.updateSession(sessionId, patch);
  },

  createPedagogicReTrainingFromCerere(input: {
    cerere: ReinstruireCerere;
    trainerId: string;
    supervisorId: string;
    plannedStartDate?: string;
  }): ReTrainingSession | null {
    const { cerere, trainerId, supervisorId } = input;
    const mentorUser = userStore.getUserById(trainerId);
    if (!mentorUser?.active) return null;

    const plannedStartDate = input.plannedStartDate ?? todayLocalIso();
    const dateErr = validatePlannedStartDate(plannedStartDate);
    if (dateErr) return null;

    userStore.ensureMentorOnAssignment(trainerId, cerere.angajatId);

    const motivLabel = CERERE_MOTIV_LABELS[cerere.motiv];
    const descriere = [
      `Cerere re-instruire pedagogică — ${motivLabel}`,
      cerere.mesaj ? `Mesaj angajat: ${cerere.mesaj}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const sessions = readSessions();
    const session: ReTrainingSession = {
      id: newId('retr'),
      angajatId: cerere.angajatId,
      supervisorId,
      trainerId,
      mentorId: trainerId,
      trigger: 'cerere_angajat',
      reinstruireCerereId: cerere.id,
      cerereMotiv: cerere.motiv,
      errorMotiv: 'altul',
      errorCaseIds: [],
      topicDayId: cerere.topicDayId,
      topicTitle: cerere.topicTitle,
      titlu: `Re-instruire: ${cerere.topicTitle}`,
      descriere,
      materialUrls: [],
      documentIds: [],
      status: 'planificat',
      plannedStartDate,
      lessonProgress: { completedTasks: [], mentorValidated: false },
      termenLimita: computeReTrainingDeadline(new Date(plannedStartDate)),
      createdAt: nowIso(),
    };
    sessions.push(session);
    writeSessions(sessions);
    setAngajatReTrainingStatus(cerere.angajatId, true);
    return session;
  },

  confirmByHr(sessionId: string, hrUser: { id: string; name: string }): ReTrainingSession | null {
    const session = trainingSystemStore.getSessionById(sessionId);
    if (!session) return null;
    const st = normalizeReTrainingStatus(session.status);
    if (st === 'asteapta_hr') {
      return trainingSystemStore.approveReTrainingPlanByHr(sessionId, hrUser);
    }
    if (st !== 'confirmat_supervizor') return null;
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

  getActiveLinkedErrorCaseIds(): Set<string> {
    return new Set(
      readSessions()
        .filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat')
        .flatMap((s) => s.errorCaseIds),
    );
  },

  getUngroupedErrorCases(filters?: { angajatId?: string }): ErrorCase[] {
    const linked = trainingSystemStore.getActiveLinkedErrorCaseIds();
    let cases = hrPerformanceStore.getErrorCases();
    if (filters?.angajatId) cases = cases.filter((c) => c.angajatId === filters.angajatId);
    return cases.filter((c) => !linked.has(c.id));
  },

  getErrorsPendingHrReview(): ErrorCase[] {
    return hrPerformanceStore
      .getErrorCases()
      .filter((c) => (c.hrStatus ?? 'ciorna') === 'trimis_hr')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getApproveErrorBlockReason(input: {
    angajatId: string;
    errorCaseIds: string[];
    topicDayId?: string;
    topicTitle?: string;
    trainerId?: string;
    plannedStartDate?: string;
  }): string | null {
    const uniqueIds = [...new Set(input.errorCaseIds)];
    if (uniqueIds.length === 0) return 'Selectați o eroare de confirmat.';

    const cases = uniqueIds
      .map((id) => hrPerformanceStore.getErrorCases().find((c) => c.id === id))
      .filter((c): c is ErrorCase => !!c);

    if (cases.length !== uniqueIds.length) return 'Înregistrarea nu a fost găsită.';
    if (cases.some((c) => c.angajatId !== input.angajatId)) {
      return 'Erorile selectate aparțin altor angajați.';
    }
    if (cases.some((c) => (c.hrStatus ?? 'ciorna') !== 'trimis_hr')) {
      return 'Eroarea nu este în status „Trimis la HR”. Reîncărcați pagina.';
    }
    if (cases.some((c) => !c.reTrainingProposal)) {
      return 'Propunerea de re-instruire lipsește.';
    }

    const linked = trainingSystemStore.getActiveLinkedErrorCaseIds();
    if (cases.some((c) => linked.has(c.id))) {
      return 'Eroarea este deja legată de o re-instruire activă.';
    }

    const baseProposal = cases[0]!.reTrainingProposal!;
    const topicDayId = input.topicDayId ?? baseProposal.topicDayId;
    const trainerId = input.trainerId ?? baseProposal.trainerId;
    if (!topicDayId) return 'Lipsește lecția din plan.';
    if (!trainerId) return 'Lipsește mentorul desemnat.';
    const mentorUser = userStore.getUserById(trainerId);
    if (!mentorUser?.active) return 'Mentorul selectat nu este valid sau este inactiv.';

    const plannedStartDate =
      input.plannedStartDate ?? baseProposal.plannedStartDate ?? todayLocalIso();
    const dateErr = validatePlannedStartDate(plannedStartDate);
    if (dateErr) return dateErr;

    const supervisorId = resolveSupervisorId(input.angajatId) ?? cases[0]!.raportatDe;
    if (!supervisorId) {
      return 'Angajatul nu are supervizor setat. Setați supervizorul în Responsabilități.';
    }

    return null;
  },

  approveErrorSubmissionsByHr(input: {
    angajatId: string;
    errorCaseIds: string[];
    hrUser: { id: string; name: string };
    topicDayId?: string;
    topicTitle?: string;
    trainerId?: string;
    plannedStartDate?: string;
  }): ReTrainingSession | null {
    const block = trainingSystemStore.getApproveErrorBlockReason(input);
    if (block) return null;

    const uniqueIds = [...new Set(input.errorCaseIds)];
    const cases = uniqueIds
      .map((id) => hrPerformanceStore.getErrorCases().find((c) => c.id === id))
      .filter((c): c is ErrorCase => !!c);

    const supervisorId = resolveSupervisorId(input.angajatId) ?? cases[0]!.raportatDe!;
    const baseProposal = cases[0]!.reTrainingProposal!;
    const topicDayId = input.topicDayId ?? baseProposal.topicDayId;
    const topicTitle = input.topicTitle ?? baseProposal.topicTitle;
    const trainerId = input.trainerId ?? baseProposal.trainerId;

    const plannedStartDate =
      input.plannedStartDate ?? baseProposal.plannedStartDate ?? todayLocalIso();

    const motivs = new Set(cases.map((c) => c.motiv));
    const errorMotiv = motivs.size === 1 ? cases[0]!.motiv : 'altul';
    const lessonNotes = cases
      .map((c) => c.reTrainingProposal?.lessonNotes.trim())
      .filter(Boolean)
      .join('\n\n');
    const documentIds = [
      ...new Set(cases.flatMap((c) => c.reTrainingProposal?.lessonDocumentIds ?? [])),
    ];

    userStore.ensureMentorOnAssignment(trainerId, input.angajatId);

    const sessions = readSessions();
    const session: ReTrainingSession = {
      id: newId('retr'),
      angajatId: input.angajatId,
      supervisorId,
      trainerId,
      mentorId: trainerId,
      errorMotiv,
      errorCaseIds: uniqueIds,
      topicDayId,
      topicTitle,
      titlu: `Re-instruire: ${topicTitle}`,
      descriere:
        cases.length > 1
          ? buildReTrainingDescriptionFromGroupedErrors(cases)
          : buildReTrainingDescriptionForCase(cases[0]!),
      materialUrls: [],
      documentIds,
      status: 'in_curs',
      plannedStartDate,
      lessonProgress: { completedTasks: [], mentorValidated: false },
      termenLimita: computeReTrainingDeadline(new Date(plannedStartDate)),
      hrGroupedAt: nowIso(),
      hrGroupedBy: input.hrUser.id,
      hrGroupedByName: input.hrUser.name,
      hrPlanApprovedAt: nowIso(),
      hrPlanApprovedBy: input.hrUser.id,
      hrPlanApprovedByName: input.hrUser.name,
      createdAt: nowIso(),
    };
    if (lessonNotes) {
      session.descriere += `\n\nLecție / materiale: ${lessonNotes}`;
    }
    sessions.push(session);
    writeSessions(sessions);
    setAngajatReTrainingStatus(input.angajatId, true);

    const now = nowIso();
    for (const c of cases) {
      hrPerformanceStore.updateErrorCase(c.id, {
        hrStatus: 'aprobat_hr',
        hrReviewedAt: now,
        hrReviewedBy: input.hrUser.id,
        reTrainingSessionId: session.id,
      });
    }

    return session;
  },

  rejectErrorSubmissionByHr(
    errorCaseId: string,
    hrUser: { id: string; name: string },
    note: string,
  ): ErrorCase | null {
    const err = hrPerformanceStore.getErrorCases().find((c) => c.id === errorCaseId);
    if (!err || (err.hrStatus ?? 'ciorna') !== 'trimis_hr') return null;
    return hrPerformanceStore.updateErrorCase(errorCaseId, {
      hrStatus: 'respins_hr',
      hrReviewNote: note.trim() || 'Modificări necesare.',
      hrReviewedAt: nowIso(),
      hrReviewedBy: hrUser.id,
    });
  },

  createReTrainingFromGroupedErrors(input: {
    angajatId: string;
    errorCaseIds: string[];
    hrUser: { id: string; name: string };
  }): ReTrainingSession | null {
    const uniqueIds = [...new Set(input.errorCaseIds)];
    if (uniqueIds.length === 0) return null;

    const linked = trainingSystemStore.getActiveLinkedErrorCaseIds();
    const cases = uniqueIds
      .map((id) => hrPerformanceStore.getErrorCases().find((c) => c.id === id))
      .filter((c): c is ErrorCase => !!c);

    if (cases.length !== uniqueIds.length) return null;
    if (cases.some((c) => c.angajatId !== input.angajatId)) return null;
    if (cases.some((c) => linked.has(c.id))) return null;

    const supervisorId = resolveSupervisorId(input.angajatId);
    if (!supervisorId) return null;

    const motivs = new Set(cases.map((c) => c.motiv));
    const errorMotiv = motivs.size === 1 ? cases[0]!.motiv : 'altul';
    const titlu =
      cases.length > 1
        ? `Re-instruire grupată — ${cases.length} erori`
        : buildReTrainingTitle(errorMotiv);

    const sessions = readSessions();
    const session: ReTrainingSession = {
      id: newId('retr'),
      angajatId: input.angajatId,
      supervisorId,
      mentorId: supervisorId,
      errorMotiv,
      errorCaseIds: uniqueIds,
      titlu,
      descriere: buildReTrainingDescriptionFromGroupedErrors(cases),
      materialUrls: [],
      documentIds: [],
      status: 'alerta_supervizor',
      termenLimita: computeReTrainingDeadline(),
      hrGroupedAt: nowIso(),
      hrGroupedBy: input.hrUser.id,
      hrGroupedByName: input.hrUser.name,
      createdAt: nowIso(),
    };
    sessions.push(session);
    writeSessions(sessions);

    const recentSameMotiv = getRecentSameMotivCases(
      hrPerformanceStore.getErrorCases(),
      input.angajatId,
      errorMotiv,
    );
    const alerts = readJson<ErrorRepeatAlert[]>(ERROR_ALERTS_KEY, []);
    alerts.push({
      id: newId('alert'),
      angajatId: input.angajatId,
      supervisorId,
      mentorId: supervisorId,
      errorMotiv,
      errorTag: getErrorTag(errorMotiv),
      count: cases.length > 1 ? cases.length : recentSameMotiv.length,
      errorCaseIds: uniqueIds,
      reTrainingSessionId: session.id,
      severity: alertSeverity(cases.length > 1 ? cases.length : recentSameMotiv.length),
      createdAt: nowIso(),
    });
    writeJson(ERROR_ALERTS_KEY, alerts);
    return session;
  },

  processErrorReTraining(newCase: ErrorCase): ReTrainingSession | null {
    return trainingSystemStore.createReTrainingFromGroupedErrors({
      angajatId: newCase.angajatId,
      errorCaseIds: [newCase.id],
      hrUser: { id: newCase.raportatDe, name: newCase.raportatDeNume },
    });
  },

  /** @deprecated folosiți processErrorReTraining */
  processErrorRepeat(newCase: ErrorCase): ErrorRepeatAlert | null {
    const session = trainingSystemStore.processErrorReTraining(newCase);
    if (!session) return null;
    return (
      trainingSystemStore
        .getErrorRepeatAlerts({ angajatId: newCase.angajatId })
        .find((a) => a.reTrainingSessionId === session.id) ?? null
    );
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
