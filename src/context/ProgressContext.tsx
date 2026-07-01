import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  ActConstatare,
  AppProgress,
  Certificate,
  DayPlan,
  DayProgress,
  DevelopmentPlan,
  FeedbackForm,
  PhotoAttachment,
  QuizResult,
} from '@/types';
import { ALL_DAYS, getDayById, getTotalTasks, TRAINING_PLAN } from '@/data/trainingPlan';
import { getDefaultOrgSettings } from '@/data/bitrix';
import { certificateNumber as genCertNumber } from '@/lib/certificatePdf';
import { storage } from '@/store/storage';
import { loadProgress, syncProgressToCloud } from '@/lib/sync';
import {
  isDayComplete as checkDayComplete,
  isDayUnlocked as checkDayUnlocked,
  getResumeDayId,
} from '@/lib/progressLogic';
import { useAuth } from '@/hooks/useAuth';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { ACTIVE_DEPARTMENT_ID } from '@/lib/departmentPlans';
import { userStore } from '@/lib/userStore';

function emptyDayProgress(): DayProgress {
  return { completedTasks: [], mentorValidated: false };
}

export interface ProgressContextValue {
  progress: AppProgress | null;
  loading: boolean;
  getDayProgress: (dayId: string) => DayProgress;
  toggleTask: (dayId: string, taskId: string) => void;
  setMentorValidation: (dayId: string, validated: boolean, notes?: string) => void;
  setMentorUnlock: (dayId: string, unlocked: boolean) => void;
  saveFeedback: (feedback: FeedbackForm) => void;
  saveActConstatare: (act: Omit<ActConstatare, 'id' | 'createdAt'>) => void;
  saveQuizResult: (dayId: string, result: QuizResult, autoTaskId?: string) => void;
  savePhoto: (photo: Omit<PhotoAttachment, 'createdAt'>) => void;
  saveDevelopmentPlan: (plan: Omit<DevelopmentPlan, 'completedAt'>) => void;
  issueCertificate: (cert: Omit<Certificate, 'issuedAt' | 'programVersion'>) => void;
  visitDay: (dayId: string) => void;
  isDayComplete: (dayId: string) => boolean;
  isDayUnlocked: (dayId: string) => boolean;
  getResumeDay: () => DayPlan | null;
  stats: {
    totalTasks: number;
    completedTasks: number;
    overallPercent: number;
    completedDays: number;
    totalDays: number;
    weekProgress: { weekNumber: number; percent: number }[];
  };
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ userId, children }: { userId: string | undefined; children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<AppProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadProgress(userId).then((data) => {
      if (!cancelled) {
        setProgress(data);
        setLoading(false);
      }
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'artgranit_progress' && e.newValue) {
        try {
          const all = JSON.parse(e.newValue) as Record<string, AppProgress>;
          if (all[userId]) setProgress(all[userId]);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [userId]);

  const persist = useCallback(
    (next: AppProgress, audit?: { action: string; targetDayId?: string; details?: string }) => {
      setProgress(next);
      storage.saveProgress(next);
      if (audit && user) {
        storage.appendAudit(next.userId, {
          action: audit.action,
          actorId: user.id,
          actorName: user.name,
          targetDayId: audit.targetDayId,
          details: audit.details,
        });
      }
      void syncProgressToCloud(next.userId, next);

      const allDaysComplete = ALL_DAYS.every((day) =>
        checkDayComplete(day, next.days[day.id] ?? emptyDayProgress()),
      );
      if (allDaysComplete) {
        const enr = userStore.getActiveEnrollmentForAngajat(next.userId);
        const totalTasks = getTotalTasks();
        let completedTasks = 0;
        ALL_DAYS.forEach((day) => {
          completedTasks += next.days[day.id]?.completedTasks.length ?? 0;
        });
        trainingSystemStore.tryArchiveCompletedPlan({
          angajatId: next.userId,
          departmentId: enr?.departmentId ?? ACTIVE_DEPARTMENT_ID,
          enrollmentId: enr?.id,
          progressPercent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 100,
          allDaysComplete: true,
        });
      }
    },
    [user],
  );

  const getDayProgress = useCallback(
    (dayId: string): DayProgress => progress?.days[dayId] ?? emptyDayProgress(),
    [progress],
  );

  const toggleTask = useCallback(
    (dayId: string, taskId: string) => {
      if (!progress) return;
      const day = getDayProgress(dayId);
      const completed = day.completedTasks.includes(taskId)
        ? day.completedTasks.filter((id) => id !== taskId)
        : [...day.completedTasks, taskId];
      persist(
        { ...progress, days: { ...progress.days, [dayId]: { ...day, completedTasks: completed } }, lastVisitedDayId: dayId },
        { action: 'toggle_task', targetDayId: dayId, details: taskId },
      );
    },
    [progress, getDayProgress, persist],
  );

  const visitDay = useCallback(
    (dayId: string) => {
      if (!progress) return;
      persist({ ...progress, lastVisitedDayId: dayId });
    },
    [progress, persist],
  );

  const setMentorValidation = useCallback(
    (dayId: string, validated: boolean, notes?: string) => {
      if (!progress) return;
      const day = getDayProgress(dayId);
      persist(
        {
          ...progress,
          days: {
            ...progress.days,
            [dayId]: {
              ...day,
              mentorValidated: validated,
              mentorValidatedAt: validated ? new Date().toISOString() : undefined,
              mentorNotes: notes,
            },
          },
        },
        { action: validated ? 'mentor_validate' : 'mentor_revoke', targetDayId: dayId, details: notes },
      );
    },
    [progress, getDayProgress, persist],
  );

  const setMentorUnlock = useCallback(
    (dayId: string, unlocked: boolean) => {
      if (!progress) return;
      const day = getDayProgress(dayId);
      persist(
        { ...progress, days: { ...progress.days, [dayId]: { ...day, mentorUnlocked: unlocked } } },
        { action: unlocked ? 'mentor_unlock' : 'mentor_lock', targetDayId: dayId },
      );
    },
    [progress, getDayProgress, persist],
  );

  const saveFeedback = useCallback(
    (feedback: FeedbackForm) => {
      if (!progress) return;
      const filtered = progress.feedbacks.filter((f) => f.weekNumber !== feedback.weekNumber);
      persist(
        { ...progress, feedbacks: [...filtered, { ...feedback, completedAt: new Date().toISOString() }] },
        { action: 'feedback_save', details: `Săptămâna ${feedback.weekNumber}` },
      );
    },
    [progress, persist],
  );

  const saveActConstatare = useCallback(
    (act: Omit<ActConstatare, 'id' | 'createdAt'>) => {
      if (!progress) return;
      const entry: ActConstatare = { ...act, id: `act-${Date.now()}`, createdAt: new Date().toISOString() };
      persist(
        { ...progress, acteConstatare: [...progress.acteConstatare, entry] },
        { action: 'act_constatare', details: act.proiectNume },
      );
    },
    [progress, persist],
  );

  const saveQuizResult = useCallback(
    (dayId: string, result: QuizResult, autoTaskId?: string) => {
      if (!progress) return;
      const day = getDayProgress(dayId);
      const completedTasks =
        result.passed && autoTaskId && !day.completedTasks.includes(autoTaskId)
          ? [...day.completedTasks, autoTaskId]
          : day.completedTasks;
      persist(
        {
          ...progress,
          days: { ...progress.days, [dayId]: { ...day, quizResult: result, completedTasks } },
          lastVisitedDayId: dayId,
        },
        { action: 'quiz_submit', targetDayId: dayId, details: `${result.score}/${result.total}` },
      );
    },
    [progress, getDayProgress, persist],
  );

  const savePhoto = useCallback(
    (photo: Omit<PhotoAttachment, 'createdAt'>) => {
      if (!progress) return;
      const entry: PhotoAttachment = { ...photo, createdAt: new Date().toISOString() };
      const filtered = progress.photos.filter((p) => p.id !== photo.id);
      persist(
        { ...progress, photos: [...filtered, entry].slice(-30) },
        { action: 'photo_upload', targetDayId: photo.dayId, details: photo.label },
      );
    },
    [progress, persist],
  );

  const saveDevelopmentPlan = useCallback(
    (plan: Omit<DevelopmentPlan, 'completedAt'>) => {
      if (!progress) return;
      persist(
        { ...progress, developmentPlan: { ...plan, completedAt: new Date().toISOString() } },
        { action: 'development_plan' },
      );
    },
    [progress, persist],
  );

  const issueCertificate = useCallback(
    (cert: Omit<Certificate, 'issuedAt' | 'programVersion'>) => {
      if (!progress) return;
      persist(
        {
          ...progress,
          certificate: {
            ...cert,
            issuedAt: new Date().toISOString(),
            programVersion: getDefaultOrgSettings().programVersion,
            certificateNumber: genCertNumber({
              ...cert,
              issuedAt: new Date().toISOString(),
              programVersion: getDefaultOrgSettings().programVersion,
            }),
          },
        },
        { action: 'certificate_issued' },
      );
    },
    [progress, persist],
  );

  const isDayComplete = useCallback(
    (dayId: string): boolean => {
      const dayPlan = ALL_DAYS.find((d) => d.id === dayId);
      return checkDayComplete(dayPlan, getDayProgress(dayId));
    },
    [getDayProgress],
  );

  const isDayUnlocked = useCallback(
    (dayId: string): boolean =>
      checkDayUnlocked(dayId, ALL_DAYS, getDayProgress, isDayComplete),
    [getDayProgress, isDayComplete],
  );

  const getResumeDay = useCallback((): DayPlan | null => {
    const id = getResumeDayId(
      ALL_DAYS,
      progress?.lastVisitedDayId,
      isDayUnlocked,
      isDayComplete,
    );
    return id ? getDayById(id) ?? null : null;
  }, [progress, isDayUnlocked, isDayComplete]);

  const stats = useMemo(() => {
    const totalTasks = getTotalTasks();
    let completedTasks = 0;
    let completedDays = 0;
    ALL_DAYS.forEach((day) => {
      const dp = getDayProgress(day.id);
      completedTasks += dp.completedTasks.length;
      if (isDayComplete(day.id)) completedDays++;
    });
    const weekProgress = TRAINING_PLAN.map((week) => {
      const weekDone = week.days.filter((d) => isDayComplete(d.id)).length;
      return { weekNumber: week.weekNumber, percent: Math.round((weekDone / week.days.length) * 100) };
    });
    return {
      totalTasks,
      completedTasks,
      overallPercent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      completedDays,
      totalDays: ALL_DAYS.length,
      weekProgress,
    };
  }, [getDayProgress, isDayComplete, progress]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      loading,
      getDayProgress,
      toggleTask,
      setMentorValidation,
      setMentorUnlock,
      saveFeedback,
      saveActConstatare,
      saveQuizResult,
      savePhoto,
      saveDevelopmentPlan,
      issueCertificate,
      visitDay,
      isDayComplete,
      isDayUnlocked,
      getResumeDay,
      stats,
    }),
    [
      progress,
      loading,
      getDayProgress,
      toggleTask,
      setMentorValidation,
      setMentorUnlock,
      saveFeedback,
      saveActConstatare,
      saveQuizResult,
      savePhoto,
      saveDevelopmentPlan,
      issueCertificate,
      visitDay,
      isDayComplete,
      isDayUnlocked,
      getResumeDay,
      stats,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress în ProgressProvider');
  return ctx;
}
