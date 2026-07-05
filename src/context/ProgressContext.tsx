import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  AppProgress,
  Certificate,
  DayPlan,
  DayProgress,
  DevelopmentPlan,
  FeedbackForm,
  PhotoAttachment,
  QuizResult,
} from '@/types';
import { getDayById, getTotalTasks } from '@/data/trainingPlan';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { getDefaultOrgSettings } from '@/data/orgSettings';
import { certificateNumber as genCertNumber } from '@/lib/certificatePdf';
import { buildCertificateMetrics } from '@/lib/certificateMetrics';
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
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';

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
  const planWeeks = useTrainingPlan();
  const allDays = useMemo(() => planWeeks.flatMap((w) => w.days), [planWeeks]);
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

      const allDaysComplete = allDays.every((day) =>
        checkDayComplete(day, next.days[day.id] ?? emptyDayProgress()),
      );
      if (allDaysComplete) {
        const enr = userStore.getActiveEnrollmentForAngajat(next.userId);
        const totalTasks = getTotalTasks();
        let completedTasks = 0;
        allDays.forEach((day) => {
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
    [user, allDays],
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
      const metrics = buildCertificateMetrics(progress);
      const issuedAt = new Date().toISOString();
      const programVersion = getDefaultOrgSettings().programVersion;
      const enr = userStore.getActiveEnrollmentForAngajat(progress.userId);
      if (enr) {
        userStore.updateEnrollment(enr.id, { status: 'completed' });
      }
      persist(
        {
          ...progress,
          certificate: {
            ...cert,
            issuedAt,
            programVersion,
            certificateNumber: genCertNumber({
              ...cert,
              issuedAt,
              programVersion,
            }),
            ...(metrics.nivelLabel && metrics.nivelScore !== null
              ? { nivelLabel: metrics.nivelLabel, nivelScore: metrics.nivelScore }
              : {}),
            ...(metrics.testScoreLabel && metrics.testPercent !== null
              ? {
                  testScoreLabel: metrics.testScoreLabel,
                  testPercent: metrics.testPercent,
                  testPassed: metrics.testPassed ?? undefined,
                }
              : {}),
          },
        },
        { action: 'certificate_issued' },
      );
      hrPerformanceStore.schedulePostTrainingEvaluation(progress.userId, issuedAt);
    },
    [progress, persist],
  );

  const isDayComplete = useCallback(
    (dayId: string): boolean => {
      const dayPlan = allDays.find((d) => d.id === dayId);
      return checkDayComplete(dayPlan, getDayProgress(dayId));
    },
    [getDayProgress, allDays],
  );

  const isDayUnlocked = useCallback(
    (dayId: string): boolean =>
      checkDayUnlocked(dayId, allDays, getDayProgress, isDayComplete),
    [getDayProgress, isDayComplete, allDays],
  );

  const getResumeDay = useCallback((): DayPlan | null => {
    const id = getResumeDayId(
      allDays,
      progress?.lastVisitedDayId,
      isDayUnlocked,
      isDayComplete,
    );
    return id ? getDayById(id) ?? null : null;
  }, [progress, isDayUnlocked, isDayComplete, allDays]);

  const stats = useMemo(() => {
    const totalTasks = getTotalTasks();
    let completedTasks = 0;
    let completedDays = 0;
    allDays.forEach((day) => {
      const dp = getDayProgress(day.id);
      completedTasks += dp.completedTasks.length;
      if (isDayComplete(day.id)) completedDays++;
    });
    const weekProgress = planWeeks.map((week) => {
      const weekDone = week.days.filter((d) => isDayComplete(d.id)).length;
      return { weekNumber: week.weekNumber, percent: Math.round((weekDone / week.days.length) * 100) };
    });
    return {
      totalTasks,
      completedTasks,
      overallPercent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      completedDays,
      totalDays: allDays.length,
      weekProgress,
    };
  }, [getDayProgress, isDayComplete, progress, allDays, planWeeks]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      loading,
      getDayProgress,
      toggleTask,
      setMentorValidation,
      setMentorUnlock,
      saveFeedback,
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
