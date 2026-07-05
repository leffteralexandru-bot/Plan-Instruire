import type {
  ReinstruireCerere,
  ReinstruireCerereMotiv,
  ReTrainingSession,
} from '@/types';
import type { DepartmentId } from '@/data/departments';
import { TRAINING_SYSTEM_UPDATED_EVENT, getBaseTrainingTopics, trainingSystemStore } from '@/lib/trainingSystemStore';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { resolveSupervisorId } from '@/lib/supervisor';
import { userStore } from '@/lib/userStore';
import { todayLocalIso } from '@/lib/errorCaseWorkflow';

const CERERI_KEY = 'artgranit_reinstruire_cereri';

export const REINSTITUIRE_CERERE_MOTIV_LABELS: Record<ReinstruireCerereMotiv, string> = {
  eroare: 'Am făcut o eroare',
  neintelegere: 'Nu am înțeles lecția',
  uitare: 'Am uitat procedura',
  altele: 'Altele',
};

export const REINSTITUIRE_CERERE_STATUS_LABELS = {
  trimisa: 'Trimisă · așteaptă supervizor',
  acceptata: 'Acceptată · re-instruire planificată',
  respinsa: 'Respinsă',
} as const;

function notifyUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TRAINING_SYSTEM_UPDATED_EVENT));
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readCereri(): ReinstruireCerere[] {
  try {
    const raw = localStorage.getItem(CERERI_KEY);
    return raw ? (JSON.parse(raw) as ReinstruireCerere[]) : [];
  } catch {
    return [];
  }
}

function writeCereri(cereri: ReinstruireCerere[]): void {
  localStorage.setItem(CERERI_KEY, JSON.stringify(cereri));
  notifyUpdated();
}

function defaultMentorId(angajatId: string): string | undefined {
  return (
    userStore.getActiveEnrollmentForAngajat(angajatId)?.mentorId ??
    userStore.getEnrollmentForAngajat(angajatId)?.mentorId
  );
}

function hasActiveSessionForTopic(angajatId: string, topicDayId: string): boolean {
  return trainingSystemStore.getReTrainingSessions({ angajatId }).some(
    (s) => s.topicDayId === topicDayId && normalizeReTrainingStatus(s.status) !== 'finalizat',
  );
}

function hasPendingCerere(angajatId: string, topicDayId: string): boolean {
  return readCereri().some(
    (c) => c.angajatId === angajatId && c.topicDayId === topicDayId && c.status === 'trimisa',
  );
}

export function getSubmitCerereBlockReason(input: {
  angajatId: string;
  topicDayId: string;
  departmentId?: DepartmentId;
}): string | null {
  const supervisorId = resolveSupervisorId(input.angajatId);
  if (!supervisorId) {
    return 'Nu aveți supervizor setat. Contactați HR pentru a seta responsabilitățile.';
  }

  const topics = getBaseTrainingTopics(input.departmentId ?? 'ingineri');
  const topic = topics.find((t) => t.dayId === input.topicDayId);
  if (!topic) return 'Lecția selectată nu există în planul de instruire.';

  if (hasPendingCerere(input.angajatId, input.topicDayId)) {
    return 'Există deja o cerere în așteptare pentru această lecție.';
  }

  if (hasActiveSessionForTopic(input.angajatId, input.topicDayId)) {
    return 'Există deja o re-instruire activă pentru această lecție.';
  }

  return null;
}

export const pedagogicReTrainingStore = {
  getCereri(filters?: {
    angajatId?: string;
    supervisorId?: string;
    status?: ReinstruireCerere['status'];
  }): ReinstruireCerere[] {
    let list = readCereri();
    if (filters?.angajatId) list = list.filter((c) => c.angajatId === filters.angajatId);
    if (filters?.supervisorId) list = list.filter((c) => c.supervisorId === filters.supervisorId);
    if (filters?.status) list = list.filter((c) => c.status === filters.status);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getCerereById(id: string): ReinstruireCerere | undefined {
    return readCereri().find((c) => c.id === id);
  },

  submitCerere(input: {
    angajatId: string;
    topicDayId: string;
    motiv: ReinstruireCerereMotiv;
    mesaj?: string;
    departmentId?: DepartmentId;
  }): { cerere: ReinstruireCerere } | { error: string } {
    const block = getSubmitCerereBlockReason(input);
    if (block) return { error: block };

    const supervisorId = resolveSupervisorId(input.angajatId)!;
    const topics = getBaseTrainingTopics(input.departmentId ?? 'ingineri');
    const topic = topics.find((t) => t.dayId === input.topicDayId)!;

    const cerere: ReinstruireCerere = {
      id: newId('rcer'),
      angajatId: input.angajatId,
      supervisorId,
      topicDayId: topic.dayId,
      topicTitle: topic.title,
      topicWeekNumber: topic.weekNumber,
      topicDayNumber: topic.dayNumber,
      motiv: input.motiv,
      mesaj: input.mesaj?.trim() || undefined,
      status: 'trimisa',
      createdAt: nowIso(),
    };

    const cereri = readCereri();
    cereri.push(cerere);
    writeCereri(cereri);
    return { cerere };
  },

  acceptCerere(input: {
    cerereId: string;
    supervisorId: string;
    trainerId?: string;
    plannedStartDate?: string;
  }): { cerere: ReinstruireCerere; session: ReTrainingSession } | { error: string } {
    const cereri = readCereri();
    const idx = cereri.findIndex((c) => c.id === input.cerereId);
    if (idx < 0) return { error: 'Cererea nu a fost găsită.' };

    const cerere = cereri[idx]!;
    if (cerere.status !== 'trimisa') return { error: 'Cererea nu mai este în așteptare.' };
    if (cerere.supervisorId !== input.supervisorId) {
      return { error: 'Nu aveți dreptul să acceptați această cerere.' };
    }

    const trainerId = input.trainerId ?? defaultMentorId(cerere.angajatId);
    if (!trainerId) return { error: 'Selectați mentorul pentru re-instruire.' };

    const session = trainingSystemStore.createPedagogicReTrainingFromCerere({
      cerere,
      trainerId,
      supervisorId: input.supervisorId,
      plannedStartDate: input.plannedStartDate ?? todayLocalIso(),
    });
    if (!session) return { error: 'Nu s-a putut crea sesiunea de re-instruire.' };

    cereri[idx] = {
      ...cerere,
      status: 'acceptata',
      reTrainingSessionId: session.id,
      reviewedAt: nowIso(),
      reviewedBy: input.supervisorId,
    };
    writeCereri(cereri);
    return { cerere: cereri[idx]!, session };
  },

  rejectCerere(input: {
    cerereId: string;
    supervisorId: string;
    reason: string;
  }): { cerere: ReinstruireCerere } | { error: string } {
    const cereri = readCereri();
    const idx = cereri.findIndex((c) => c.id === input.cerereId);
    if (idx < 0) return { error: 'Cererea nu a fost găsită.' };

    const cerere = cereri[idx]!;
    if (cerere.status !== 'trimisa') return { error: 'Cererea nu mai este în așteptare.' };
    if (cerere.supervisorId !== input.supervisorId) {
      return { error: 'Nu aveți dreptul să respingeți această cerere.' };
    }

    cereri[idx] = {
      ...cerere,
      status: 'respinsa',
      rejectReason: input.reason.trim() || 'Cerere respinsă.',
      reviewedAt: nowIso(),
      reviewedBy: input.supervisorId,
    };
    writeCereri(cereri);
    return { cerere: cereri[idx]! };
  },

  getPedagogicReportsForHr(): ReTrainingSession[] {
    return trainingSystemStore
      .getReTrainingSessions()
      .filter(
        (s) =>
          s.trigger === 'cerere_angajat' &&
          normalizeReTrainingStatus(s.status) === 'finalizat' &&
          !!s.hrReportSubmittedAt,
      );
  },
};
