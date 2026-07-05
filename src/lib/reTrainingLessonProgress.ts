import type { ReTrainingSession } from '@/types';
import { getDayById } from '@/data/trainingPlan';
import {
  isReTrainingLessonComplete,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import { getReTrainingDay } from '@/lib/reTrainingLesson';

export interface ReTrainingLessonProgress {
  completedTasks: number;
  totalTasks: number;
  percent: number;
  traineeCompleted: boolean;
  finalized: boolean;
}

export function getReTrainingLessonTaskCount(session: ReTrainingSession): number {
  const day = getReTrainingDay(session) ?? (session.topicDayId ? getDayById(session.topicDayId) : undefined);
  if (day && day.tasks.length > 0) return day.tasks.length;
  return 1;
}

export function getReTrainingLessonProgress(session: ReTrainingSession): ReTrainingLessonProgress {
  const totalTasks = getReTrainingLessonTaskCount(session);
  const completedTasks = session.lessonProgress?.completedTasks.length ?? 0;
  const finalized = normalizeReTrainingStatus(session.status) === 'finalizat';
  const traineeCompleted = !!session.traineeCompletedAt;
  const lessonComplete = isReTrainingLessonComplete(session, totalTasks);

  let percent = 0;
  if (finalized || traineeCompleted || lessonComplete) {
    percent = 100;
  } else if (totalTasks > 0) {
    percent = Math.round((completedTasks / totalTasks) * 100);
  }

  return {
    completedTasks: lessonComplete || traineeCompleted || finalized ? totalTasks : completedTasks,
    totalTasks,
    percent,
    traineeCompleted,
    finalized,
  };
}
