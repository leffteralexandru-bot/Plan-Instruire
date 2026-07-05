import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured } from '@/store/storage';
import { syncHrPerformanceWithCloud, scheduleHrCloudPush } from '@/lib/hrPerformanceSync';
import type {
  EmployeeProfile,
  ErrorCase,
  EvaluationCycle,
  EvaluationScores,
  HrDocument,
  HrDocumentType,
  KpiSnapshot,
  QuickNote,
  QuickNoteType,
  User,
} from '@/types';
import {
  hrPerformanceStore,
  EVALUATION_ALERT_DAYS,
} from '@/lib/hrPerformanceStore';

interface HrPerformanceContextValue {
  profiles: EmployeeProfile[];
  evaluations: EvaluationCycle[];
  errorCases: ErrorCase[];
  quickNotes: QuickNote[];
  documents: HrDocument[];
  kpiSnapshots: KpiSnapshot[];
  refresh: () => void;
  updateProfile: (
    userId: string,
    patch: Partial<
      Pick<
        EmployeeProfile,
        'prenume' | 'nume' | 'functie' | 'departamentId' | 'dataAngajarii' | 'managerId' | 'status' | 'tipAngajat' | 'weeklyEvalMentors' | 'photoUrl'
      >
    >,
  ) => EmployeeProfile;
  completeEvaluation: (
    id: string,
    input: {
      scoruri?: EvaluationScores;
      concluzii: string;
      planDezvoltare?: string;
      documentId?: string;
    },
  ) => EvaluationCycle;
  updateEvaluation: (
    id: string,
    patch: Partial<Pick<EvaluationCycle, 'evaluatorId' | 'termenReevaluare' | 'status'>>,
  ) => EvaluationCycle;
  addQuickNote: (input: {
    angajatId: string;
    autorId: string;
    autorNume: string;
    autorRol: QuickNote['autorRol'];
    text: string;
    tip: QuickNoteType;
  }) => QuickNote;
  addErrorCase: (input: Omit<ErrorCase, 'id' | 'createdAt' | 'updatedAt'>) => ErrorCase;
  updateErrorCase: (
    id: string,
    patch: Partial<
      Pick<
        ErrorCase,
        | 'planActiune'
        | 'descriere'
        | 'motiv'
        | 'documentId'
        | 'notaConstatare'
        | 'signedDocumentId'
        | 'reTrainingProposal'
        | 'hrStatus'
        | 'hrReviewNote'
        | 'hrReviewedAt'
        | 'hrReviewedBy'
        | 'reTrainingSessionId'
      >
    >,
  ) => ErrorCase;
  deleteErrorCase: (id: string) => boolean;
  uploadDocument: (input: {
    file: File;
    tip: HrDocumentType;
    angajatId?: string;
    uploadedBy: string;
    uploadedByNume: string;
    evaluationCycleId?: string;
    errorCaseId?: string;
    reTrainingSessionId?: string;
    folder?: import('@/types').EmployeeArchiveFolder;
    dayId?: string;
    departmentId?: import('@/data/departments').DepartmentId;
  }) => Promise<HrDocument>;
  downloadDocument: (id: string) => Promise<void>;
  ensureMonthlyKpi: () => KpiSnapshot;
  createProfileForUser: (user: User, extra?: Partial<EmployeeProfile>) => EmployeeProfile;
  evaluationAlertDays: number;
}

const HrPerformanceContext = createContext<HrPerformanceContextValue | null>(null);

export function HrPerformanceProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void syncHrPerformanceWithCloud().then(() => refresh());
  }, [refresh]);

  const profiles = useMemo(() => hrPerformanceStore.getProfiles(), [tick]);
  const evaluations = useMemo(() => hrPerformanceStore.getEvaluations(), [tick]);
  const errorCases = useMemo(() => hrPerformanceStore.getErrorCases(), [tick]);
  const quickNotes = useMemo(() => hrPerformanceStore.getQuickNotes(), [tick]);
  const documents = useMemo(() => hrPerformanceStore.getDocuments(), [tick]);
  const kpiSnapshots = useMemo(() => {
    hrPerformanceStore.generateMonthlySnapshot();
    return hrPerformanceStore.getKpiSnapshots();
  }, [tick]);

  const value = useMemo<HrPerformanceContextValue>(
    () => ({
      profiles,
      evaluations,
      errorCases,
      quickNotes,
      documents,
      kpiSnapshots,
      refresh,
      updateProfile: (userId, patch) => {
        const updated = hrPerformanceStore.updateProfile(userId, patch);
        refresh();
        return updated;
      },
      completeEvaluation: (id, input) => {
        const done = hrPerformanceStore.completeEvaluation(id, input);
        refresh();
        return done;
      },
      updateEvaluation: (id, patch) => {
        const updated = hrPerformanceStore.updateEvaluation(id, patch);
        refresh();
        return updated;
      },
      addQuickNote: (input) => {
        const note = hrPerformanceStore.addQuickNote(input);
        refresh();
        return note;
      },
      addErrorCase: (input) => {
        const item = hrPerformanceStore.addErrorCase(input);
        refresh();
        scheduleHrCloudPush();
        return item;
      },
      updateErrorCase: (id, patch) => {
        const updated = hrPerformanceStore.updateErrorCase(id, patch);
        refresh();
        scheduleHrCloudPush();
        return updated;
      },
      deleteErrorCase: (id) => {
        const ok = hrPerformanceStore.deleteErrorCase(id);
        if (ok) {
          refresh();
          scheduleHrCloudPush();
        }
        return ok;
      },
      uploadDocument: async (input) => {
        const doc = await hrPerformanceStore.uploadDocument(input);
        refresh();
        return doc;
      },
      downloadDocument: async (id) => {
        const result = await hrPerformanceStore.downloadDocument(id);
        if (!result) return;
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.meta.nume;
        a.click();
        URL.revokeObjectURL(url);
      },
      ensureMonthlyKpi: () => {
        const snap = hrPerformanceStore.generateMonthlySnapshot();
        refresh();
        return snap;
      },
      createProfileForUser: (user, extra) => {
        const profile = hrPerformanceStore.createProfileForUser(user, extra);
        refresh();
        return profile;
      },
      evaluationAlertDays: EVALUATION_ALERT_DAYS,
    }),
    [profiles, evaluations, errorCases, quickNotes, documents, kpiSnapshots, refresh],
  );

  return <HrPerformanceContext.Provider value={value}>{children}</HrPerformanceContext.Provider>;
}

export function useHrPerformance(): HrPerformanceContextValue {
  const ctx = useContext(HrPerformanceContext);
  if (!ctx) throw new Error('useHrPerformance în HrPerformanceProvider');
  return ctx;
}
