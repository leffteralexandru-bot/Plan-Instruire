import type { DepartmentId } from '@/data/departments';
import type {
  EmployeeProfile,
  EmployeeArchiveFolder,
  ErrorCase,
  ErrorMotiv,
  EvaluationCycle,
  EvaluationScores,
  EvaluationStatus,
  HrDocument,
  HrDocumentType,
  KpiSnapshot,
  QuickNote,
  QuickNoteType,
  User,
} from '@/types';
import { isAngajatUser, isMentorUser } from '@/lib/roles';
import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';
import { hrDocumentStore } from '@/store/hrDocumentStore';
import { buildTraineeHrReport } from '@/lib/hrReport';

const PROFILES_KEY = 'artgranit_employee_profiles';
const EVALUATIONS_KEY = 'artgranit_evaluation_cycles';
const NOTES_KEY = 'artgranit_quick_notes';
const ERRORS_KEY = 'artgranit_error_cases';
const DOCS_KEY = 'artgranit_hr_documents';
const KPI_KEY = 'artgranit_kpi_snapshots';
const PERF_MIGRATION_FLAG = 'artgranit_perf_migrated_v1';

export const EVALUATION_CYCLE_DAYS = 90;
export const EVALUATION_ALERT_DAYS = 7;

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
  if (tip === 'sablon_lucru') return 'documentatie_baza';
  return undefined;
}

function inferManager(userId: string): string | undefined {
  const enr = userStore.getActiveEnrollmentForAngajat(userId);
  return enr?.mentorId;
}

function syncEvaluationStatuses(cycles: EvaluationCycle[]): EvaluationCycle[] {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  const updated = cycles.map((c) => {
    if (c.status === 'evaluat') return c;
    if (c.termenReevaluare < today && c.status !== 'intarziat') {
      changed = true;
      return { ...c, status: 'intarziat' as EvaluationStatus, updatedAt: nowIso() };
    }
    if (c.status === 'planificat' && c.perioadaStart <= today) {
      changed = true;
      return { ...c, status: 'in_curs' as EvaluationStatus, updatedAt: nowIso() };
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

function ensureProfiles(): EmployeeProfile[] {
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
      managerId: inferManager(u.id),
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

  const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
  let cyclesChanged = false;
  for (const u of users) {
    if (cycles.some((c) => c.angajatId === u.id)) continue;
    const profile = byUser.get(u.id)!;
    cycles.push({
      id: newId('eval'),
      angajatId: u.id,
      evaluatorId: profile.managerId ?? u.id,
      perioadaStart: profile.dataAngajarii,
      perioadaEnd: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
      termenReevaluare: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
      status: 'planificat',
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
    return ensureProfiles().filter((p) => p.status !== 'incetat');
  },

  getProfile(userId: string): EmployeeProfile | undefined {
    return ensureProfiles().find((p) => p.userId === userId);
  },

  updateProfile(
    userId: string,
    patch: Partial<
      Pick<
        EmployeeProfile,
        'prenume' | 'nume' | 'functie' | 'departamentId' | 'dataAngajarii' | 'managerId' | 'status' | 'tipAngajat'
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
      managerId: extra?.managerId,
      status: 'activ',
      tipAngajat: extra?.tipAngajat ?? 'incepator',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const profiles = readJson<EmployeeProfile[]>(PROFILES_KEY, []);
    profiles.push(profile);
    writeJson(PROFILES_KEY, profiles);

    const cycles = readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []);
    cycles.push({
      id: newId('eval'),
      angajatId: user.id,
      evaluatorId: profile.managerId ?? user.id,
      perioadaStart: profile.dataAngajarii,
      perioadaEnd: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
      termenReevaluare: addDays(profile.dataAngajarii, EVALUATION_CYCLE_DAYS),
      status: 'planificat',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    writeJson(EVALUATIONS_KEY, cycles);
    return profile;
  },

  getEvaluations(angajatId?: string): EvaluationCycle[] {
    const all = syncEvaluationStatuses(readJson<EvaluationCycle[]>(EVALUATIONS_KEY, []));
    return angajatId ? all.filter((e) => e.angajatId === angajatId) : all;
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
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    cycles.push(cycle);
    writeJson(EVALUATIONS_KEY, cycles);
    return cycle;
  },

  updateEvaluation(
    id: string,
    patch: Partial<
      Pick<
        EvaluationCycle,
        'evaluatorId' | 'termenReevaluare' | 'status' | 'scoruri' | 'concluzii' | 'planDezvoltare' | 'documentId' | 'dataEvaluare'
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
    input: { scoruri: EvaluationScores; concluzii: string; planDezvoltare?: string; documentId?: string },
  ): EvaluationCycle {
    const completed = hrPerformanceStore.updateEvaluation(id, {
      ...input,
      status: 'evaluat',
      dataEvaluare: new Date().toISOString().slice(0, 10),
    });
    hrPerformanceStore.createEvaluationCycle({
      angajatId: completed.angajatId,
      evaluatorId: completed.evaluatorId,
      startDate: completed.termenReevaluare,
    });
    return completed;
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
  }): HrDocument[] {
    let docs = readJson<HrDocument[]>(DOCS_KEY, []);
    if (filters?.angajatId) docs = docs.filter((d) => d.angajatId === filters.angajatId);
    if (filters?.tip) docs = docs.filter((d) => d.tip === filters.tip);
    if (filters?.folder) docs = docs.filter((d) => d.folder === filters.folder);
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
  }): Promise<HrDocument> {
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
