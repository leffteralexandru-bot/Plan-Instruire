import type { DepartmentId } from '@/data/departments';
import type {
  DesignerCompetencyScores,
  EmployeeProfile,
  EmployeeArchiveFolder,
  EmployeeSelfAssessment,
  ErrorCase,
  ErrorMotiv,
  EvaluationCycle,
  EvaluationScores,
  EvaluationStage,
  EvaluationStatus,
  HrDocument,
  HrDocumentType,
  KpiSnapshot,
  QuickNote,
  QuickNoteType,
  User,
} from '@/types';
import { userStore } from '@/lib/userStore';
import { isAngajatUser, isMentorUser, canEditTrainingPlan } from '@/lib/roles';
import { storage } from '@/store/storage';
import { hrDocumentStore } from '@/store/hrDocumentStore';
import { buildTraineeHrReport } from '@/lib/hrReport';
import {
  computeCompetencyOutcome,
  competencyToEvaluationScores,
  isCompetencyScoresComplete,
} from '@/lib/competencyScoring';
import {
  createDefaultEvaluationStages,
  ensureEvaluationStages,
  isSelfAssessmentComplete,
  isSupervisorAssessmentComplete,
} from '@/lib/evaluationStages';
import { upsertWeeklyEvalMentor, getWeeklyEvalMentorForWeek } from '@/lib/evaluationWeekMentors';
import {
  appendPrincipalMentorHistory,
  appendSupervisorHistory,
  appendWeeklyMentorHistory,
  createHistoryEntry,
} from '@/lib/assignmentHistory';

const PROFILES_KEY = 'artgranit_employee_profiles';
const EVALUATIONS_KEY = 'artgranit_evaluation_cycles';
const NOTES_KEY = 'artgranit_quick_notes';
const ERRORS_KEY = 'artgranit_error_cases';
const DOCS_KEY = 'artgranit_hr_documents';
const KPI_KEY = 'artgranit_kpi_snapshots';
const PERF_MIGRATION_FLAG = 'artgranit_perf_migrated_v1';

export const EVALUATION_CYCLE_DAYS = 90;
export const EVALUATION_ALERT_DAYS = 7;
/** Reminder angajat/supervizor — evaluare se apropie */
export const EVALUATION_REMINDER_START_DAYS = 14;
/** După câte zile fără auto-evaluare → escalare supervizor */
export const SELF_ASSESSMENT_SUPERVISOR_ESCALATION_DAYS = 7;
/** După câte zile fără auto-evaluare → excepție HR */
export const SELF_ASSESSMENT_HR_ESCALATION_DAYS = 14;

export interface HrPerformancePayload {
  profiles: EmployeeProfile[];
  evaluations: EvaluationCycle[];
  quickNotes: QuickNote[];
  errorCases: ErrorCase[];
  documents: HrDocument[];
  kpiSnapshots: KpiSnapshot[];
  updatedAt: string;
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

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function splitName(fullName: string): { prenume: string; nume: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { prenume: parts[0] ?? '', nume: '' };
  return { prenume: parts[0], nume: parts.slice(1).join(' ') };
}

function inferDepartment(userId: string): DepartmentId {
  const enr = userStore.getActiveEnrollmentForAngajat(userId);
  return enr?.departmentId ?? 'ingineri';
}

function resolveDocumentFolder(
  tip: HrDocumentType,
  explicit?: EmployeeArchiveFolder,
): EmployeeArchiveFolder | undefined {
  if (explicit) return explicit;
  if (tip === 'evaluare_semnata' || tip === 'evaluare_electronica') return 'istoric_evaluari';
  if (tip === 're_instruire') return 'istoric_instruire';
  if (tip === 'sablon_lucru' || tip === 'material_instruire') return 'documentatie_baza';
  return undefined;
}

function inferSupervisorForProfile(userId: string): string | undefined {
  const enr = userStore.getActiveEnrollmentForAngajat(userId);
  return enr?.mentorId;
}

function revertOrphanAutoStartedCycle(c: EvaluationCycle): EvaluationCycle {
  if (c.status !== 'in_curs' && c.status !== 'intarziat') return c;
  const hasWork =
    c.employeeSelfAssessment?.completedAt ||
    c.competencySelfScores ||
    c.scoruri ||
    c.observatiiMentor;
  if (hasWork) return c;
  const stages = c.stages ?? createDefaultEvaluationStages();
  const started = stages.some((s) => s.status === 'in_curs' || s.status === 'completat');
  if (!started) return c;
  return {
    ...c,
    status: 'planificat',
    stages: createDefaultEvaluationStages(),
    updatedAt: nowIso(),
  };
}

function syncEvaluationStatuses(cycles: EvaluationCycle[]): EvaluationCycle[] {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  const updated = cycles.map((c) => {
    if (c.status === 'evaluat') return c;
    const reverted = revertOrphanAutoStartedCycle(c);
    if (reverted !== c) {
      changed = true;
      c = reverted;
    }
    if (c.termenReevaluare < today && c.status !== 'intarziat') {
      changed = true;
      return { ...c, status: 'intarziat' as EvaluationStatus, updatedAt: nowIso() };
    }
    return c;
  });
  if (changed) writeJson(EVALUATIONS_KEY, updated);
  return updated;
}

function inferMotivFromText(text: string): ErrorMotiv {
  const t = text.toLowerCase();
  if (t.includes('procedur')) return 'lipsa_procedura';
  if (t.includes('comunic')) return 'comunicare';
  if (t.includes('material')) return 'materiale';
  if (t.includes('echip')) return 'echipament';
  if (t.includes('aten')) return 'neatentie';
  return 'altul';
}

function inferFunctie(u: User): string {
  if (isMentorUser(u) && isAngajatUser(u)) return 'Angajat · Mentor';
  if (isMentorUser(u)) return 'Mentor';
  const dept = inferDepartment(u.id);
  if (dept === 'ingineri') return 'Inginer Proiectant';
  if (dept === 'montatori') return 'Montator';
  if (dept === 'productie') return 'Operator Producție';
  return 'Angajat';
}

function migrateActeConstatare(): void {
  try {
    if (localStorage.getItem(PERF_MIGRATION_FLAG)) return;
  } catch {
    return;
  }

  const existing = readJson<ErrorCase[]>(ERRORS_KEY, []);
  const migratedIds = new Set(existing.map((e) => e.migratedFromActId).filter(Boolean));

  const users = userStore.getAllUsers().filter((u) => isAngajatUser(u));
  for (const u of users) {
    const progress = storage.getProgress(u.id);
    for (const act of progress.acteConstatare) {
      if (migratedIds.has(act.id)) continue;
      const enr = userStore.getActiveEnrollmentForAngajat(u.id);
      existing.push({
        id: newId('err'),
        angajatId: u.id,
        raportatDe: enr?.mentorId ?? u.id,
        raportatDeNume: 'Migrat din act constatare',
        data: act.dataMasuratoare || act.createdAt.slice(0, 10),
        proiectNume: act.proiectNume,
        motiv: inferMotivFromText(act.eroriIdentificate),
        descriere: [act.eroriIdentificate, act.abateriMasuratori].filter(Boolean).join(' · '),
        planActiune: {
          pasi: act.masuriCorective || '—',
          responsabilId: enr?.mentorId ?? u.id,
          termenLimita: addDays(act.createdAt.slice(0, 10), 30),
          status: act.masuriCorective ? 'in_lucru' : 'deschis',
        },
        migratedFromActId: act.id,
        createdAt: act.createdAt,
        updatedAt: act.createdAt,
      });
    }
  }

  writeJson(ERRORS_KEY, existing);
  try {
    localStorage.setItem(PERF_MIGRATION_FLAG, nowIso());
  } catch {
    /* ignore */
  }
}

function isEvaluationSubject(profile: EmployeeProfile): boolean {
  return !!(profile.supervisorId || profile.managerId);
}

function evaluationCycleHasWork(c: EvaluationCycle): boolean {
  return !!(
    c.employeeSelfAssessment?.completedAt ||
    c.competencySelfScores ||
    c.scoruri ||
    c.observatiiMentor ||
    c.status === 'in_curs' ||
    c.status === 'intarziat' ||
    c.status === 'evaluat'
  );
}

/** Angajat încă în programul inițial de 4 săptămâni — fără evaluare tri-lunară încă */
function isInActiveInitialTraining(angajatId: string): boolean {
  const enr = userStore.getActiveEnrollmentForAngajat(angajatId);
  return !!enr && enr.status === 'active';
}

function cleanupPrematureEvaluationCycles(): void {
  const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
  const next = cycles.filter((c) => {
    if (!isInActiveInitialTraining(c.angajatId)) return true;
    return evaluationCycleHasWork(c);
  });
  if (next.length !== cycles.length) writeJson(EVALUATIONS_KEY, next);
}

/** Elimină profile, evaluări și date HR pentru utilizatori șterși sau inexistenți */
function pruneOrphanHrData(): void {
  const activeIds = new Set(userStore.getAllUsers().filter((u) => u.active).map((u) => u.id));

  const filterStore = <T>(key: string, keep: (row: T) => boolean) => {
    const rows = readJson<T[]>(key, []);
    const next = rows.filter(keep);
    if (next.length !== rows.length) writeJson(key, next);
  };

  filterStore<EmployeeProfile>(PROFILES_KEY, (p) => activeIds.has(p.userId));
  filterStore<QuickNote>(NOTES_KEY, (n) => activeIds.has(n.angajatId));
  filterStore<ErrorCase>(ERRORS_KEY, (e) => activeIds.has(e.angajatId));

  const profiles = readJson<EmployeeProfile[]>(PROFILES_KEY, []);
  const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

  const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
  const nextCycles = cycles.filter((c) => {
    if (!activeIds.has(c.angajatId)) return false;
    const profile = profileByUser.get(c.angajatId);
    return profile ? isEvaluationSubject(profile) : false;
  });
  if (nextCycles.length !== cycles.length) writeJson(EVALUATIONS_KEY, nextCycles);

  const docs = readJson<HrDocument[]>(DOCS_KEY, []);
  const nextDocs = docs.filter((d) => !d.angajatId || activeIds.has(d.angajatId));
  if (nextDocs.length !== docs.length) writeJson(DOCS_KEY, nextDocs);

  try {
    const progressRaw = localStorage.getItem('artgranit_progress');
    if (progressRaw) {
      const progress = JSON.parse(progressRaw) as Record<string, unknown>;
      const pruned = Object.fromEntries(
        Object.entries(progress).filter(([userId]) => activeIds.has(userId)),
      );
      if (Object.keys(pruned).length !== Object.keys(progress).length) {
        localStorage.setItem('artgranit_progress', JSON.stringify(pruned));
      }
    }
  } catch {
    /* ignore */
  }
}

function ensureProfiles(): EmployeeProfile[] {
  pruneOrphanHrData();
  const profiles = readJson<EmployeeProfile[]>(PROFILES_KEY, []);
  const byUser = new Map(profiles.map((p) => [p.userId, p]));
  const users = userStore.getAllUsers().filter((u) => u.active && isAngajatUser(u));
  let changed = false;

  for (const u of users) {
    if (byUser.has(u.id)) continue;
    const { prenume, nume } = splitName(u.name);
    const profile: EmployeeProfile = {
      userId: u.id,
      prenume,
      nume,
      functie: inferFunctie(u),
      departamentId: inferDepartment(u.id),
      dataAngajarii: u.createdAt.slice(0, 10),
      managerId: inferSupervisorForProfile(u.id),
      supervisorId: inferSupervisorForProfile(u.id),
      status: 'activ',
      tipAngajat: userStore.getActiveEnrollmentForAngajat(u.id) ? 'incepator' : 'experimentat',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    profiles.push(profile);
    byUser.set(u.id, profile);
    changed = true;
  }

  if (changed) writeJson(PROFILES_KEY, profiles);

  cleanupPrematureEvaluationCycles();

  const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
  let cyclesChanged = false;
  for (const u of users) {
    if (cycles.some((c) => c.angajatId === u.id)) continue;
    const profile = byUser.get(u.id)!;
    if (!isEvaluationSubject(profile)) continue;
    if (isInActiveInitialTraining(u.id)) continue;
    cycles.push({
      id: newId('eval'),
      angajatId: u.id,
      evaluatorId: profile.supervisorId ?? profile.managerId ?? u.id,
      perioadaStart: profile.dataAngajarii,
      perioadaEnd: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
      termenReevaluare: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
      status: 'planificat',
      stages: createDefaultEvaluationStages(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    cyclesChanged = true;
  }
  if (cyclesChanged) writeJson(EVALUATIONS_KEY, cycles);

  migrateActeConstatare();
  return profiles;
}

export const hrPerformanceStore = {
  ensureProfiles,

  getProfiles(): EmployeeProfile[] {
    const activeIds = new Set(userStore.getUsers().map((u) => u.id));
    return ensureProfiles().filter((p) => p.status !== 'incetat' && activeIds.has(p.userId));
  },

  getProfile(userId: string): EmployeeProfile | undefined {
    return ensureProfiles().find((p) => p.userId === userId);
  },

  updateProfile(
    userId: string,
    patch: Partial<
      Pick<
        EmployeeProfile,
        'prenume' | 'nume' | 'functie' | 'departamentId' | 'dataAngajarii' | 'managerId' | 'supervisorId' |         'status' | 'tipAngajat' | 'weeklyEvalMentors' | 'assignmentHistory'
        | 'nivelCompetenta' | 'scorCompetentaTotal' | 'coeficientSalarialPercent'
      >
    >,
  ): EmployeeProfile {
    const profiles = ensureProfiles();
    const idx = profiles.findIndex((p) => p.userId === userId);
    if (idx < 0) throw new Error('Profil angajat negăsit.');
    profiles[idx] = { ...profiles[idx], ...patch, updatedAt: nowIso() };
    writeJson(PROFILES_KEY, profiles);
    return profiles[idx];
  },

  setWeeklyEvalMentor(
    userId: string,
    weekNumber: number,
    mentorId: string,
    changedBy?: { id: string; name: string },
  ): EmployeeProfile {
    const profile = hrPerformanceStore.getProfile(userId);
    if (!profile) throw new Error('Profil angajat negăsit.');
    const fromId = getWeeklyEvalMentorForWeek(profile, weekNumber);
    const toId = mentorId || undefined;
    const weeklyEvalMentors = upsertWeeklyEvalMentor(profile.weeklyEvalMentors, weekNumber, mentorId);
    let assignmentHistory = profile.assignmentHistory;
    if (fromId !== toId) {
      assignmentHistory = appendWeeklyMentorHistory(
        assignmentHistory,
        { ...createHistoryEntry(fromId, toId, changedBy), weekNumber },
      );
    }
    if (toId) {
      userStore.ensureMentorOnAssignment(toId, userId);
    }
    return hrPerformanceStore.updateProfile(userId, { weeklyEvalMentors, assignmentHistory });
  },

  setSupervisor(
    userId: string,
    supervisorId: string,
    changedBy?: { id: string; name: string },
  ): EmployeeProfile {
    const profile = hrPerformanceStore.getProfile(userId);
    if (!profile) throw new Error('Profil angajat negăsit.');
    const fromId = profile.supervisorId ?? profile.managerId;
    let assignmentHistory = profile.assignmentHistory;
    if (fromId !== supervisorId) {
      assignmentHistory = appendSupervisorHistory(
        assignmentHistory,
        createHistoryEntry(fromId, supervisorId, changedBy),
      );
    }
    const updated = hrPerformanceStore.updateProfile(userId, {
      supervisorId,
      managerId: supervisorId,
      assignmentHistory,
    });
    const evalCurrent = hrPerformanceStore.getCurrentEvaluation(userId);
    if (evalCurrent && evalCurrent.status !== 'evaluat') {
      hrPerformanceStore.updateEvaluation(evalCurrent.id, { evaluatorId: supervisorId });
    }
    return updated;
  },

  recordPrincipalMentorChange(
    angajatId: string,
    fromUserId: string | undefined,
    toUserId: string,
    changedBy?: { id: string; name: string },
  ): EmployeeProfile {
    const profile = hrPerformanceStore.getProfile(angajatId);
    if (!profile) throw new Error('Profil angajat negăsit.');
    if (fromUserId === toUserId) return profile;
    const assignmentHistory = appendPrincipalMentorHistory(
      profile.assignmentHistory,
      createHistoryEntry(fromUserId, toUserId, changedBy),
    );
    return hrPerformanceStore.updateProfile(angajatId, { assignmentHistory });
  },

  createProfileForUser(user: User, extra?: Partial<EmployeeProfile>): EmployeeProfile {
    ensureProfiles();
    const existing = readJson<EmployeeProfile[]>(PROFILES_KEY, []).find((p) => p.userId === user.id);
    if (existing) return existing;
    const { prenume, nume } = splitName(user.name);
    const profile: EmployeeProfile = {
      userId: user.id,
      prenume,
      nume,
      functie: extra?.functie ?? inferFunctie(user),
      departamentId: extra?.departamentId ?? 'ingineri',
      dataAngajarii: extra?.dataAngajarii ?? new Date().toISOString().slice(0, 10),
      managerId: extra?.managerId ?? extra?.supervisorId,
      supervisorId: extra?.supervisorId ?? extra?.managerId,
      status: 'activ',
      tipAngajat: extra?.tipAngajat ?? 'incepator',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const profiles = readJson<EmployeeProfile[]>(PROFILES_KEY, []);
    profiles.push(profile);
    writeJson(PROFILES_KEY, profiles);

    if (isEvaluationSubject(profile) && profile.tipAngajat !== 'incepator') {
      const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
      cycles.push({
        id: newId('eval'),
        angajatId: user.id,
        evaluatorId: profile.supervisorId ?? profile.managerId ?? user.id,
        perioadaStart: profile.dataAngajarii,
        perioadaEnd: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
        termenReevaluare: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
        status: 'planificat',
        stages: createDefaultEvaluationStages(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      writeJson(EVALUATIONS_KEY, cycles);
    }
    return profile;
  },

  getEvaluations(angajatId?: string): EvaluationCycle[] {
    pruneOrphanHrData();
    const all = syncEvaluationStatuses(readJson<EvaluationCycle[]>(EVALUATIONS_KEY, [])).map(
      ensureEvaluationStages,
    );
    const activeIds = new Set(userStore.getUsers().map((u) => u.id));
    const visible = all.filter((e) => activeIds.has(e.angajatId));
    return angajatId ? visible.filter((e) => e.angajatId === angajatId) : visible;
  },

  /** Curăță evaluări și profile pentru conturi șterse */
  pruneOrphanRecords(): void {
    pruneOrphanHrData();
  },

  getCurrentEvaluation(angajatId: string): EvaluationCycle | undefined {
    const cycles = hrPerformanceStore.getEvaluations(angajatId);
    return (
      cycles.find((c) => c.status === 'in_curs' || c.status === 'intarziat') ??
      cycles.find((c) => c.status === 'planificat') ??
      cycles.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    );
  },

  createEvaluationCycle(input: {
    angajatId: string;
    evaluatorId: string;
    startDate: string;
  }): EvaluationCycle {
    const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
    const start = input.startDate.slice(0, 10);
    const cycle: EvaluationCycle = {
      id: newId('eval'),
      angajatId: input.angajatId,
      evaluatorId: input.evaluatorId,
      perioadaStart: start,
      perioadaEnd: addDays(start, EVALUATION_CYCLE_DAYS),
      termenReevaluare: addDays(start, EVALUATION_CYCLE_DAYS),
      status: 'planificat',
      stages: createDefaultEvaluationStages(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    cycles.push(cycle);
    writeJson(EVALUATIONS_KEY, cycles);
    return cycle;
  },

  /**
   * Programează prima evaluare tri-lunară la 90 zile după finalizarea instruirii inițiale (certificat).
   */
  schedulePostTrainingEvaluation(
    angajatId: string,
    trainingCompletedOn: string,
  ): EvaluationCycle | null {
    ensureProfiles();
    const profile = hrPerformanceStore.getProfile(angajatId);
    if (!profile || !isEvaluationSubject(profile)) return null;

    const start = trainingCompletedOn.slice(0, 10);
    const termen = addDays(start, EVALUATION_CYCLE_DAYS);
    const evaluatorId = profile.supervisorId ?? profile.managerId ?? angajatId;

    const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
    const openIdx = cycles.findIndex(
      (c) =>
        c.angajatId === angajatId &&
        c.status === 'planificat' &&
        !evaluationCycleHasWork(c),
    );

    let cycle: EvaluationCycle;
    if (openIdx >= 0) {
      cycle = {
        ...cycles[openIdx],
        evaluatorId,
        perioadaStart: start,
        perioadaEnd: termen,
        termenReevaluare: termen,
        stages: createDefaultEvaluationStages(),
        updatedAt: nowIso(),
      };
      cycles[openIdx] = cycle;
    } else if (
      !cycles.some(
        (c) =>
          c.angajatId === angajatId &&
          (c.status === 'planificat' || c.status === 'in_curs' || c.status === 'intarziat'),
      )
    ) {
      cycle = {
        id: newId('eval'),
        angajatId,
        evaluatorId,
        perioadaStart: start,
        perioadaEnd: termen,
        termenReevaluare: termen,
        status: 'planificat',
        stages: createDefaultEvaluationStages(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      cycles.push(cycle);
    } else {
      writeJson(EVALUATIONS_KEY, cycles);
      return hrPerformanceStore.getCurrentEvaluation(angajatId) ?? null;
    }

    writeJson(EVALUATIONS_KEY, cycles);
    hrPerformanceStore.updateProfile(angajatId, { tipAngajat: 'experimentat' });
    return cycle;
  },

  updateEvaluation(
    id: string,
    patch: Partial<
      Pick<
        EvaluationCycle,
        | 'evaluatorId'
        | 'termenReevaluare'
        | 'status'
        | 'scoruri'
        | 'concluzii'
        | 'planDezvoltare'
        | 'documentId'
        | 'dataEvaluare'
        | 'stages'
        | 'employeeSelfAssessment'
        | 'supervisorAssessment'
        | 'observatiiMentor'
        | 'electronicDocumentId'
        | 'competencySelfScores'
        | 'competencySupervisorScores'
        | 'competencyResult'
      >
    >,
  ): EvaluationCycle {
    const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
    const idx = cycles.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Evaluare negăsită.');
    cycles[idx] = { ...cycles[idx], ...patch, updatedAt: nowIso() };
    writeJson(EVALUATIONS_KEY, cycles);
    return cycles[idx];
  },

  completeEvaluation(
    id: string,
    input: {
      scoruri?: EvaluationScores;
      competencySupervisorScores?: DesignerCompetencyScores;
      concluzii: string;
      planDezvoltare?: string;
      documentId?: string;
    },
  ): EvaluationCycle {
    const existing = hrPerformanceStore.getEvaluations().find((c) => c.id === id);
    if (!existing) throw new Error('Evaluare negăsită.');

    const competencyScores =
      input.competencySupervisorScores ??
      existing.competencySupervisorScores ??
      existing.competencySelfScores;
    if (!isCompetencyScoresComplete(competencyScores)) {
      throw new Error('Completați matricea de competențe (10 criterii) înainte de finalizare.');
    }

    const competencyResult = computeCompetencyOutcome(competencyScores);
    const scoruri = input.scoruri ?? competencyToEvaluationScores(competencyScores);

    const stages = (existing.stages ?? createDefaultEvaluationStages()).map((s) => ({
      ...s,
      status: 'completat' as const,
      completedAt: s.completedAt ?? nowIso(),
    }));
    const completed = hrPerformanceStore.updateEvaluation(id, {
      scoruri,
      competencySupervisorScores: competencyScores,
      competencyResult,
      concluzii: input.concluzii,
      planDezvoltare: input.planDezvoltare,
      documentId: input.documentId,
      status: 'evaluat',
      dataEvaluare: new Date().toISOString().slice(0, 10),
      stages,
    });

    hrPerformanceStore.updateProfile(completed.angajatId, {
      nivelCompetenta: competencyResult.nivel,
      scorCompetentaTotal: competencyResult.total,
      coeficientSalarialPercent: competencyResult.coeficientSalarialPercent,
    });
    hrPerformanceStore.createEvaluationCycle({
      angajatId: completed.angajatId,
      evaluatorId: completed.evaluatorId,
      startDate: completed.termenReevaluare,
    });
    return completed;
  },

  /** HR pornește fluxul de evaluare — etapa 1 devine activă */
  startEvaluationWorkflow(id: string, _actor: Pick<User, 'id' | 'name'>): EvaluationCycle {
    const stages = createDefaultEvaluationStages();
    stages[0] = {
      ...stages[0],
      status: 'in_curs',
    };
    return hrPerformanceStore.updateEvaluation(id, {
      status: 'in_curs',
      stages,
    });
  },

  /** Angajat sau HR salvează auto-evaluarea */
  saveEmployeeSelfAssessment(
    id: string,
    data: EmployeeSelfAssessment,
    actor: Pick<User, 'id' | 'name'>,
    competencySelfScores?: DesignerCompetencyScores,
  ): EvaluationCycle {
    const cycle = hrPerformanceStore.getEvaluations().find((c) => c.id === id);
    if (!cycle) throw new Error('Evaluare negăsită.');
    const assessment: EmployeeSelfAssessment = {
      ...data,
      completedAt:
        isSelfAssessmentComplete(data) && isCompetencyScoresComplete(competencySelfScores)
          ? nowIso()
          : data.completedAt,
    };
    const stages = [...(cycle.stages ?? createDefaultEvaluationStages())];
    const stageIdx = stages.findIndex((s) => s.id === 'auto_evaluare');
    if (stageIdx >= 0 && isSelfAssessmentComplete(assessment) && isCompetencyScoresComplete(competencySelfScores)) {
      stages[stageIdx] = {
        ...stages[stageIdx],
        status: 'completat',
        completedAt: nowIso(),
        completedBy: actor.id,
        completedByName: actor.name,
      };
      const mentorIdx = stages.findIndex((s) => s.id === 'evaluare_mentor');
      if (mentorIdx >= 0 && stages[mentorIdx].status === 'neinceput') {
        stages[mentorIdx] = { ...stages[mentorIdx], status: 'in_curs' };
      }
    }
    return hrPerformanceStore.updateEvaluation(id, {
      employeeSelfAssessment: assessment,
      competencySelfScores,
      stages,
      status: cycle.status === 'planificat' ? 'in_curs' : cycle.status,
    });
  },

  /** Supervizor/HR completează etapa de evaluare (evaluatorId = supervizorul angajatului) */
  saveMentorEvaluationStage(
    id: string,
    input: {
      scoruri?: EvaluationScores;
      supervisorAssessment: EmployeeSelfAssessment;
      competencySupervisorScores: DesignerCompetencyScores;
      observatiiMentor?: string;
    },
    actor: Pick<User, 'id' | 'name'>,
  ): EvaluationCycle {
    if (!isSupervisorAssessmentComplete(input.supervisorAssessment)) {
      throw new Error('Completați realizările, dificultățile și obiectivele (minim caractere cerute).');
    }
    if (!isCompetencyScoresComplete(input.competencySupervisorScores)) {
      throw new Error('Completați toate criteriile matricei de competențe.');
    }
    const assessment: EmployeeSelfAssessment = {
      ...input.supervisorAssessment,
      completedAt: nowIso(),
    };
    const observatiiMentor =
      input.observatiiMentor?.trim() ||
      assessment.realizari.trim().slice(0, 500);
    const scoruri =
      input.scoruri ?? competencyToEvaluationScores(input.competencySupervisorScores);
    const cycle = hrPerformanceStore.getEvaluations().find((c) => c.id === id);
    if (!cycle) throw new Error('Evaluare negăsită.');
    const stages = [...(cycle.stages ?? createDefaultEvaluationStages())];
    const mentorIdx = stages.findIndex((s) => s.id === 'evaluare_mentor');
    if (mentorIdx >= 0) {
      stages[mentorIdx] = {
        ...stages[mentorIdx],
        status: 'completat',
        completedAt: nowIso(),
        completedBy: actor.id,
        completedByName: actor.name,
      };
    }
    const hrIdx = stages.findIndex((s) => s.id === 'validare_hr');
    if (hrIdx >= 0) {
      stages[hrIdx] = { ...stages[hrIdx], status: 'in_curs' };
    }
    return hrPerformanceStore.updateEvaluation(id, {
      scoruri,
      supervisorAssessment: assessment,
      competencySupervisorScores: input.competencySupervisorScores,
      observatiiMentor,
      stages,
      status: 'in_curs',
    });
  },

  /** HR editează manual etapele (ex. reset sau corecție) */
  updateEvaluationStages(id: string, stages: EvaluationStage[]): EvaluationCycle {
    return hrPerformanceStore.updateEvaluation(id, { stages });
  },

  getQuickNotes(angajatId?: string): QuickNote[] {
    const notes = readJson<QuickNote[]>(NOTES_KEY, []);
    const filtered = angajatId ? notes.filter((n) => n.angajatId === angajatId) : notes;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addQuickNote(input: {
    angajatId: string;
    autorId: string;
    autorNume: string;
    autorRol: QuickNote['autorRol'];
    text: string;
    tip: QuickNoteType;
  }): QuickNote {
    const notes = readJson<QuickNote[]>(NOTES_KEY, []);
    const note: QuickNote = { id: newId('note'), ...input, createdAt: nowIso() };
    notes.push(note);
    writeJson(NOTES_KEY, notes);
    return note;
  },

  getErrorCases(filters?: { angajatId?: string; luna?: string }): ErrorCase[] {
    let cases = readJson<ErrorCase[]>(ERRORS_KEY, []);
    if (filters?.angajatId) cases = cases.filter((c) => c.angajatId === filters.angajatId);
    if (filters?.luna) cases = cases.filter((c) => c.data.startsWith(filters.luna!));
    return cases.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addErrorCase(input: Omit<ErrorCase, 'id' | 'createdAt' | 'updatedAt'>): ErrorCase {
    const cases = readJson<ErrorCase[]>(ERRORS_KEY, []);
    const item: ErrorCase = { ...input, id: newId('err'), createdAt: nowIso(), updatedAt: nowIso() };
    cases.push(item);
    writeJson(ERRORS_KEY, cases);
    return item;
  },

  updateErrorCase(id: string, patch: Partial<Pick<ErrorCase, 'planActiune' | 'descriere' | 'motiv' | 'documentId'>>): ErrorCase {
    const cases = readJson<ErrorCase[]>(ERRORS_KEY, []);
    const idx = cases.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Eroare negăsită.');
    cases[idx] = { ...cases[idx], ...patch, updatedAt: nowIso() };
    writeJson(ERRORS_KEY, cases);
    return cases[idx];
  },

  getDocuments(filters?: {
    angajatId?: string;
    tip?: HrDocumentType;
    folder?: EmployeeArchiveFolder;
    dayId?: string;
  }): HrDocument[] {
    let docs = readJson<HrDocument[]>(DOCS_KEY, []);
    if (filters?.angajatId) docs = docs.filter((d) => d.angajatId === filters.angajatId);
    if (filters?.tip) docs = docs.filter((d) => d.tip === filters.tip);
    if (filters?.folder) docs = docs.filter((d) => d.folder === filters.folder);
    if (filters?.dayId) docs = docs.filter((d) => d.dayId === filters.dayId);
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async uploadDocument(input: {
    file: File;
    tip: HrDocumentType;
    angajatId?: string;
    uploadedBy: string;
    uploadedByNume: string;
    evaluationCycleId?: string;
    errorCaseId?: string;
    reTrainingSessionId?: string;
    folder?: EmployeeArchiveFolder;
    dayId?: string;
    departmentId?: DepartmentId;
  }): Promise<HrDocument> {
    if (input.tip === 'material_instruire') {
      const uploader = userStore.getUserById(input.uploadedBy);
      if (!canEditTrainingPlan(uploader)) {
        throw new Error('Doar Resurse Umane (HR) pot încărca materiale în planul de instruire.');
      }
    }
    const id = newId('doc');
    await hrDocumentStore.save({ id, blob: input.file });
    const meta: HrDocument = {
      id,
      angajatId: input.angajatId,
      tip: input.tip,
      folder: resolveDocumentFolder(input.tip, input.folder),
      nume: input.file.name,
      mimeType: input.file.type || 'application/octet-stream',
      sizeBytes: input.file.size,
      uploadedBy: input.uploadedBy,
      uploadedByNume: input.uploadedByNume,
      evaluationCycleId: input.evaluationCycleId,
      errorCaseId: input.errorCaseId,
      reTrainingSessionId: input.reTrainingSessionId,
      dayId: input.dayId,
      departmentId: input.departmentId,
      createdAt: nowIso(),
    };
    const docs = readJson<HrDocument[]>(DOCS_KEY, []);
    docs.push(meta);
    writeJson(DOCS_KEY, docs);
    return meta;
  },

  async downloadDocument(id: string): Promise<{ meta: HrDocument; blob: Blob } | null> {
    const meta = hrPerformanceStore.getDocuments().find((d) => d.id === id);
    if (!meta) return null;
    const stored = await hrDocumentStore.get(id);
    if (!stored) return null;
    return { meta, blob: stored.blob };
  },

  getKpiSnapshots(): KpiSnapshot[] {
    return readJson<KpiSnapshot[]>(KPI_KEY, []).sort((a, b) => a.luna.localeCompare(b.luna));
  },

  generateMonthlySnapshot(): KpiSnapshot {
    const luna = new Date().toISOString().slice(0, 7);
    const snapshots = hrPerformanceStore.getKpiSnapshots();
    const existing = snapshots.find((s) => s.luna === luna);
    if (existing) return existing;

    const profiles = hrPerformanceStore.getProfiles();
    const evaluations = hrPerformanceStore.getEvaluations();
    const errors = hrPerformanceStore.getErrorCases({ luna });
    const trainees = userStore.getTraineeProfiles();
    let progressSum = 0;
    let progressCount = 0;
    for (const t of trainees) {
      const row = buildTraineeHrReport(t, storage.getProgress(t.id));
      progressSum += row.progressPercent;
      progressCount += 1;
    }

    const snap: KpiSnapshot = {
      id: newId('kpi'),
      luna,
      totalAngajati: profiles.length,
      eroriLuna: errors.length,
      evaluariIntarziate: evaluations.filter((e) => e.status === 'intarziat').length,
      evaluariFinalizate: evaluations.filter(
        (e) => e.status === 'evaluat' && e.dataEvaluare?.startsWith(luna),
      ).length,
      progresInstruireMediu: progressCount ? Math.round(progressSum / progressCount) : 0,
      createdAt: nowIso(),
    };
    snapshots.push(snap);
    writeJson(KPI_KEY, snapshots);
    return snap;
  },

  countErrorsThisMonth(): number {
    const luna = new Date().toISOString().slice(0, 7);
    return hrPerformanceStore.getErrorCases({ luna }).length;
  },

  daysUntil(termen: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(termen);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  },

  exportPayload(): HrPerformancePayload {
    ensureProfiles();
    return {
      profiles: readJson<EmployeeProfile[]>(PROFILES_KEY, []),
      evaluations: readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []),
      quickNotes: readJson<QuickNote[]>(NOTES_KEY, []),
      errorCases: readJson<ErrorCase[]>(ERRORS_KEY, []),
      documents: readJson<HrDocument[]>(DOCS_KEY, []),
      kpiSnapshots: readJson<KpiSnapshot[]>(KPI_KEY, []),
      updatedAt: nowIso(),
    };
  },

  importPayload(cloud: HrPerformancePayload, mode: 'replace' | 'merge' = 'merge'): void {
    if (mode === 'replace') {
      writeJson(PROFILES_KEY, cloud.profiles);
      writeJson(EVALUATIONS_KEY, cloud.evaluations);
      writeJson(NOTES_KEY, cloud.quickNotes);
      writeJson(ERRORS_KEY, cloud.errorCases);
      writeJson(DOCS_KEY, cloud.documents);
      writeJson(KPI_KEY, cloud.kpiSnapshots);
      return;
    }

    const mergeById = <T extends { id: string }>(
      local: T[],
      remote: T[],
      timeKey: (item: T) => string = (i) => (i as T & { updatedAt?: string }).updatedAt ?? (i as T & { createdAt?: string }).createdAt ?? '',
    ): T[] => {
      const map = new Map<string, T>();
      for (const item of local) map.set(item.id, item);
      for (const item of remote) {
        const existing = map.get(item.id);
        if (!existing || timeKey(item) >= timeKey(existing)) map.set(item.id, item);
      }
      return [...map.values()];
    };

    const mergeProfiles = (local: EmployeeProfile[], remote: EmployeeProfile[]): EmployeeProfile[] => {
      const map = new Map(local.map((p) => [p.userId, p]));
      for (const p of remote) {
        const ex = map.get(p.userId);
        if (!ex || p.updatedAt >= ex.updatedAt) map.set(p.userId, p);
      }
      return [...map.values()];
    };

    writeJson(PROFILES_KEY, mergeProfiles(readJson(PROFILES_KEY, []), cloud.profiles));
    writeJson(EVALUATIONS_KEY, mergeById(readJson(EVALUATIONS_KEY, []), cloud.evaluations));
    writeJson(NOTES_KEY, mergeById(readJson(NOTES_KEY, []), cloud.quickNotes));
    writeJson(ERRORS_KEY, mergeById(readJson(ERRORS_KEY, []), cloud.errorCases));
    writeJson(DOCS_KEY, mergeById(readJson(DOCS_KEY, []), cloud.documents));
    writeJson(KPI_KEY, mergeById(readJson(KPI_KEY, []), cloud.kpiSnapshots));
  },
};

export const ERROR_MOTIV_LABELS: Record<ErrorMotiv, string> = {
  neatentie: 'Neatenție',
  lipsa_procedura: 'Lipsă procedură',
  comunicare: 'Comunicare',
  materiale: 'Materiale',
  echipament: 'Echipament',
  altul: 'Altul',
};

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  planificat: 'Planificat',
  in_curs: 'În curs de evaluare',
  evaluat: 'Evaluat',
  intarziat: 'Termen depășit',
};

export const QUICK_NOTE_TYPE_LABELS: Record<QuickNoteType, string> = {
  observatie: 'Observație',
  apreciere: 'Apreciere',
  atentionare: 'Atenționare',
};
