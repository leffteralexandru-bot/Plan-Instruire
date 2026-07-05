import { ALL_DAYS } from '@/data/trainingPlan';
import { COMPETENCIES, scoreFromFeedback } from '@/data/competencies';
import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import type { AppProgress, DayProgress, TraineeProfile, TrainingEnrollment, User } from '@/types';
import { isDayComplete } from '@/lib/progressLogic';
import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';

/** Zile cu validare mentor obligatorie — din planul artGRANIT */
export const MENTOR_VALIDATION_DAY_NUMBERS = ALL_DAYS.filter(
  (d) => d.requiresMentorValidation,
).map((d) => d.dayNumber);

export interface TraineeHrReport {
  userId: string;
  name: string;
  email: string;
  programStart: string;
  completedDays: number;
  totalDays: number;
  progressPercent: number;
  pendingMentorValidations: number[];
  quizPassed: boolean | null;
  quizScoreLabel: string | null;
  quizAttempts: number | null;
  certificateIssued: boolean;
  certificateDate: string | null;
  acteConstatareCount: number;
  photosCount: number;
  competencyScores: Record<string, number>;
  lastActivityAt: string | null;
}

export interface HrAggregateReport {
  generatedAt: string;
  programVersion: string;
  organization: 'artGRANIT';
  trainees: TraineeHrReport[];
  summary: {
    totalTrainees: number;
    fullyCompleted: number;
    certificatesIssued: number;
    pendingValidationsTotal: number;
  };
}

function emptyDayProgress(): DayProgress {
  return { completedTasks: [], mentorValidated: false };
}

function getDayProgress(progress: AppProgress, dayId: string): DayProgress {
  return progress.days[dayId] ?? emptyDayProgress();
}

export function countCompletedDays(progress: AppProgress): number {
  return ALL_DAYS.filter((d) => isDayComplete(d, getDayProgress(progress, d.id))).length;
}

export function getPendingMentorValidations(progress: AppProgress): number[] {
  return ALL_DAYS.filter((d) => {
    if (!d.requiresMentorValidation) return false;
    const dp = getDayProgress(progress, d.id);
    const tasksDone = d.tasks.every((t) => dp.completedTasks.includes(t.id));
    return tasksDone && !dp.mentorValidated;
  }).map((d) => d.dayNumber);
}

function getQuizSummary(progress: AppProgress): Pick<
  TraineeHrReport,
  'quizPassed' | 'quizScoreLabel' | 'quizAttempts'
> {
  const dp = progress.days[THEORETICAL_TEST.dayId];
  const quiz = dp?.quizResult;
  if (!quiz) {
    return { quizPassed: null, quizScoreLabel: null, quizAttempts: null };
  }
  const pct = Math.round((quiz.score / quiz.total) * 100);
  return {
    quizPassed: quiz.passed,
    quizScoreLabel: `${quiz.score}/${quiz.total} (${pct}%)`,
    quizAttempts: quiz.attempts,
  };
}

function getLastActivityAt(progress: AppProgress): string | null {
  const timestamps: string[] = [];
  for (const dp of Object.values(progress.days)) {
    if (dp.mentorValidatedAt) timestamps.push(dp.mentorValidatedAt);
    if (dp.quizResult?.completedAt) timestamps.push(dp.quizResult.completedAt);
  }
  for (const f of progress.feedbacks) {
    if (f.completedAt) timestamps.push(f.completedAt);
  }
  for (const a of progress.acteConstatare) {
    timestamps.push(a.createdAt);
  }
  if (progress.certificate?.issuedAt) timestamps.push(progress.certificate.issuedAt);
  for (const e of progress.auditLog) {
    timestamps.push(e.createdAt);
  }
  if (!timestamps.length) return null;
  return timestamps.sort().at(-1) ?? null;
}

export function buildTraineeHrReport(trainee: TraineeProfile, progress: AppProgress): TraineeHrReport {
  const completedDays = countCompletedDays(progress);
  const totalDays = ALL_DAYS.length;
  const scores = scoreFromFeedback(progress.feedbacks);
  const competencyScores = Object.fromEntries(
    COMPETENCIES.map((c) => [c.id, scores[c.id as keyof typeof scores] ?? 0]),
  );

  return {
    userId: trainee.id,
    name: trainee.name,
    email: trainee.email,
    programStart: trainee.programStart,
    completedDays,
    totalDays,
    progressPercent: totalDays ? Math.round((completedDays / totalDays) * 100) : 0,
    pendingMentorValidations: getPendingMentorValidations(progress),
    ...getQuizSummary(progress),
    certificateIssued: !!progress.certificate,
    certificateDate: progress.certificate?.issuedAt ?? null,
    acteConstatareCount: progress.acteConstatare.length,
    photosCount: progress.photos.length,
    competencyScores,
    lastActivityAt: getLastActivityAt(progress),
  };
}

export function isTrainingPlanComplete(
  report: Pick<TraineeHrReport, 'completedDays' | 'totalDays' | 'certificateIssued'>,
): boolean {
  return report.certificateIssued || (report.totalDays > 0 && report.completedDays >= report.totalDays);
}

/** Angajat încă în programul inițial de 4 săptămâni (monitorizare mentor activă) */
export function isTraineeInActiveTraining(
  trainee: Pick<TraineeProfile, 'id' | 'name' | 'email' | 'programStart' | 'enrollmentId' | 'mentorId' | 'cohortId' | 'departmentId' | 'enrollmentStatus'>,
): boolean {
  const report = buildTraineeHrReport(trainee as TraineeProfile, storage.getProgress(trainee.id));
  return !isTrainingPlanComplete(report);
}

/** Apare în Cohortă instruire — înscriere activă, certificat neemis încă */
export function isInMentorCohort(
  trainee: Pick<TraineeProfile, 'id'>,
): boolean {
  const enrollment = userStore.getActiveEnrollmentForAngajat(trainee.id);
  if (!enrollment) return false;
  return !storage.getProgress(trainee.id).certificate;
}

export function getAngajatTrainingReport(userId: string): TraineeHrReport | null {
  const user = userStore.getUserById(userId);
  if (!user) return null;

  const enrollment = userStore
    .getEnrollments()
    .find((e) => e.angajatId === userId && (e.status === 'active' || e.status === 'completed'));
  if (!enrollment) return null;

  const trainee = toTraineeProfileForReport(user, enrollment);
  return buildTraineeHrReport(trainee, storage.getProgress(userId));
}

/** Înscriere activă în planul inițial — certificat / zile nefinalizate */
export function isAngajatInActiveInitialTraining(userId: string): boolean {
  const report = getAngajatTrainingReport(userId);
  if (!report) return false;
  return !isTrainingPlanComplete(report);
}

function toTraineeProfileForReport(user: User, enrollment: TrainingEnrollment): TraineeProfile {
  return {
    id: user.id,
    name: user.name,
    roles: user.roles,
    email: user.email,
    active: user.active,
    createdAt: user.createdAt,
    enrollmentId: enrollment.id,
    mentorId: enrollment.mentorId,
    cohortId: enrollment.cohortId,
    departmentId: enrollment.departmentId,
    programStart: enrollment.programStart,
    enrollmentStatus: enrollment.status,
  };
}

export function buildHrAggregateReport(
  trainees: TraineeProfile[],
  getProgress: (userId: string) => AppProgress,
  programVersion: string,
): HrAggregateReport {
  const rows = trainees.map((t) => buildTraineeHrReport(t, getProgress(t.id)));

  return {
    generatedAt: new Date().toISOString(),
    programVersion,
    organization: 'artGRANIT',
    trainees: rows,
    summary: {
      totalTrainees: rows.length,
      fullyCompleted: rows.filter((r) => r.completedDays === r.totalDays).length,
      certificatesIssued: rows.filter((r) => r.certificateIssued).length,
      pendingValidationsTotal: rows.reduce((n, r) => n + r.pendingMentorValidations.length, 0),
    },
  };
}
