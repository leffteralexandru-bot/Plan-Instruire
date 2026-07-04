import { TRAINING_PLAN } from '@/data/trainingPlan';
import { ALL_DAYS } from '@/data/trainingPlan';
import { isDayComplete } from '@/lib/progressLogic';
import type { AppProgress, DayProgress, EmployeeProfile, User, WeeklyEvaluationMentor } from '@/types';
import { userStore } from '@/lib/userStore';

export const EVALUATION_WEEK_COUNT = 4;

export const EVALUATION_WEEK_LABELS: { weekNumber: number; title: string }[] = TRAINING_PLAN.map((w) => ({
  weekNumber: w.weekNumber,
  title: w.title,
}));

function emptyDayProgress(): DayProgress {
  return { completedTasks: [], mentorValidated: false };
}

export function getWeeklyEvalMentors(profile: EmployeeProfile): WeeklyEvaluationMentor[] {
  return profile.weeklyEvalMentors ?? [];
}

export function getWeeklyEvalMentorForWeek(
  profile: EmployeeProfile,
  weekNumber: number,
): string | undefined {
  return profile.weeklyEvalMentors?.find((w) => w.weekNumber === weekNumber)?.mentorId;
}

/** Mentor instruire pentru o săptămână — override săptămânal sau mentorul principal din înscriere */
export function resolveWeeklyInstruireMentor(
  profile: EmployeeProfile,
  weekNumber: number,
): { mentorId?: string; isOverride: boolean } {
  const override = getWeeklyEvalMentorForWeek(profile, weekNumber);
  if (override) return { mentorId: override, isOverride: true };
  const enrollment = userStore.getActiveEnrollmentForAngajat(profile.userId);
  if (enrollment?.mentorId) return { mentorId: enrollment.mentorId, isOverride: false };
  return { mentorId: undefined, isOverride: false };
}

export interface WeeklyInstruirePlanRow {
  weekNumber: number;
  title: string;
  mentorId?: string;
  isOverride: boolean;
}

/** Plan efectiv S1–S4: override săptămânal sau mentorul principal din Setări */
export function getWeeklyInstruirePlan(profile: EmployeeProfile): WeeklyInstruirePlanRow[] {
  return EVALUATION_WEEK_LABELS.map(({ weekNumber, title }) => {
    const { mentorId, isOverride } = resolveWeeklyInstruireMentor(profile, weekNumber);
    return { weekNumber, title, mentorId, isOverride };
  });
}

export function resolveUserName(users: User[], userId?: string): string {
  if (!userId) return '—';
  return users.find((u) => u.id === userId)?.name ?? '—';
}

/** Săptămâna curentă din plan (1–4) după progres instruire, sau 1 implicit */
export function inferCurrentTrainingWeek(completedDays: number, totalDays: number): number {
  if (totalDays <= 0) return 1;
  const ratio = completedDays / totalDays;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

/** Săptămâna curentă după prima zi nefinalizată din plan */
export function inferCurrentTrainingWeekFromProgress(progress: AppProgress | null | undefined): number {
  if (!progress) return 1;
  const firstIncomplete = ALL_DAYS.find((d) => {
    const dp = progress.days[d.id] ?? emptyDayProgress();
    return !isDayComplete(d, dp);
  });
  if (!firstIncomplete) return EVALUATION_WEEK_COUNT;
  const week = TRAINING_PLAN.find((w) => w.days.some((day) => day.id === firstIncomplete.id));
  return week?.weekNumber ?? 1;
}

export function formatWeeklyMentorsSummary(profile: EmployeeProfile, users: User[]): string {
  const parts = EVALUATION_WEEK_LABELS.map(({ weekNumber }) => {
    const id = getWeeklyEvalMentorForWeek(profile, weekNumber);
    const name = id ? resolveUserName(users, id).split(' ')[0] : '—';
    return `S${weekNumber}: ${name}`;
  });
  return parts.join(' · ');
}

export function upsertWeeklyEvalMentor(
  existing: WeeklyEvaluationMentor[] | undefined,
  weekNumber: number,
  mentorId: string,
): WeeklyEvaluationMentor[] {
  const list = [...(existing ?? [])];
  const idx = list.findIndex((w) => w.weekNumber === weekNumber);
  if (!mentorId) {
    if (idx >= 0) list.splice(idx, 1);
    return list;
  }
  if (idx >= 0) list[idx] = { weekNumber, mentorId };
  else list.push({ weekNumber, mentorId });
  return list.sort((a, b) => a.weekNumber - b.weekNumber);
}
