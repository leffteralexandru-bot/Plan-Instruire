import type { AppProgress, DayProgress, WeekPlan } from '@/types';
import { getTotalTasks } from '@/data/trainingPlan';
import { isDayComplete, isDayUnlocked } from '@/lib/progressLogic';

function emptyDayProgress(): DayProgress {
  return { completedTasks: [], mentorValidated: false };
}

export function getTraineeDayProgress(progress: AppProgress, dayId: string): DayProgress {
  return progress.days[dayId] ?? emptyDayProgress();
}

export function computeTraineeTrainingStats(progress: AppProgress, planWeeks: WeekPlan[]) {
  const allDays = planWeeks.flatMap((w) => w.days);
  const totalTasks = getTotalTasks();

  const getDayProgress = (dayId: string) => getTraineeDayProgress(progress, dayId);
  const isComplete = (dayId: string) => {
    const dayPlan = allDays.find((d) => d.id === dayId);
    return isDayComplete(dayPlan, getDayProgress(dayId));
  };
  const isUnlocked = (dayId: string) =>
    isDayUnlocked(dayId, allDays, getDayProgress, isComplete);

  let completedTasks = 0;
  let completedDays = 0;
  allDays.forEach((day) => {
    const dp = getDayProgress(day.id);
    completedTasks += dp.completedTasks.length;
    if (isComplete(day.id)) completedDays++;
  });

  const weekProgress = planWeeks.map((week) => {
    const weekDone = week.days.filter((d) => isComplete(d.id)).length;
    return { weekNumber: week.weekNumber, percent: Math.round((weekDone / week.days.length) * 100) };
  });

  return {
    totalTasks,
    completedTasks,
    overallPercent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    completedDays,
    totalDays: allDays.length,
    weekProgress,
    allDays,
    getDayProgress,
    isComplete,
    isUnlocked,
  };
}
