import { ALL_DAYS } from '@/data/trainingPlan';
import type { AppProgress, AuditEntry, User } from '@/types';
import type { TraineeHrReport } from '@/lib/hrReport';
import { getPendingMentorValidations } from '@/lib/hrReport';

/** Plan artGRANIT: 20 zile instruire în 4 săptămâni calendaristice */
export const PROGRAM_CALENDAR_DAYS = 28;
export const PROGRAM_TRAINING_DAYS = ALL_DAYS.length;

export type TraineeStatus = 'completed' | 'on_track' | 'at_risk' | 'behind' | 'not_started';

export interface AuditLogRow extends AuditEntry {
  traineeId: string;
  traineeName: string;
}

export interface MentorWorkloadItem {
  traineeId: string;
  traineeName: string;
  pendingDayNumbers: number[];
}

const STATUS_LABELS: Record<TraineeStatus, string> = {
  completed: 'Finalizat',
  on_track: 'La zi',
  at_risk: 'Risc moderat',
  behind: 'Întârziat',
  not_started: 'Neînceput',
};

export function getTraineeStatusLabel(status: TraineeStatus): string {
  return STATUS_LABELS[status];
}

export function daysSinceProgramStart(programStart: string, reference = new Date()): number | null {
  const start = new Date(programStart);
  if (Number.isNaN(start.getTime())) return null;
  const diff = reference.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/** Zile așteptate completate — proporțional cu durata programului artGRANIT */
export function getExpectedCompletedDays(programStart: string, reference = new Date()): number {
  const elapsed = daysSinceProgramStart(programStart, reference);
  if (elapsed == null) return 0;
  const ratio = Math.min(1, elapsed / PROGRAM_CALENDAR_DAYS);
  return Math.min(PROGRAM_TRAINING_DAYS, Math.round(ratio * PROGRAM_TRAINING_DAYS));
}

export function getTraineeStatus(row: TraineeHrReport, reference = new Date()): TraineeStatus {
  if (row.completedDays >= row.totalDays || row.certificateIssued) return 'completed';
  if (row.completedDays === 0 && !row.lastActivityAt) return 'not_started';

  const expected = getExpectedCompletedDays(row.programStart, reference);
  const gap = expected - row.completedDays;

  if (row.pendingMentorValidations.length > 0) return 'behind';
  if (row.quizPassed === false) return 'behind';

  const elapsed = daysSinceProgramStart(row.programStart, reference);
  if (elapsed != null && elapsed > 14 && row.progressPercent < 40) return 'behind';

  if (gap <= 1) return 'on_track';
  if (gap <= 3) return 'at_risk';
  return 'behind';
}

export function aggregateAuditLog(
  trainees: User[],
  getProgress: (userId: string) => AppProgress,
  limit = 50,
): AuditLogRow[] {
  const rows: AuditLogRow[] = [];
  for (const t of trainees) {
    const p = getProgress(t.id);
    for (const entry of p.auditLog) {
      rows.push({ ...entry, traineeId: t.id, traineeName: t.name });
    }
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function getMentorWorkload(
  trainees: User[],
  getProgress: (userId: string) => AppProgress,
): MentorWorkloadItem[] {
  return trainees
    .map((t) => ({
      traineeId: t.id,
      traineeName: t.name,
      pendingDayNumbers: getPendingMentorValidations(getProgress(t.id)),
    }))
    .filter((item) => item.pendingDayNumbers.length > 0)
    .sort((a, b) => b.pendingDayNumbers.length - a.pendingDayNumbers.length);
}

export function countByStatus(trainees: TraineeHrReport[], reference = new Date()): Record<TraineeStatus, number> {
  const counts: Record<TraineeStatus, number> = {
    completed: 0,
    on_track: 0,
    at_risk: 0,
    behind: 0,
    not_started: 0,
  };
  for (const row of trainees) {
    counts[getTraineeStatus(row, reference)] += 1;
  }
  return counts;
}

export function getCohortProgressAverage(trainees: TraineeHrReport[]): number {
  if (!trainees.length) return 0;
  const sum = trainees.reduce((n, t) => n + t.progressPercent, 0);
  return Math.round(sum / trainees.length);
}

/** Distribuție progres pe săptămâni — pentru grafic cohortă */
export function getWeekCompletionRates(
  trainees: User[],
  getProgress: (userId: string) => AppProgress,
): { week: number; label: string; percent: number }[] {
  const weeks = [
    { week: 1, dayIds: ALL_DAYS.filter((d) => d.dayNumber <= 5).map((d) => d.id), label: 'Săpt. 1' },
    { week: 2, dayIds: ALL_DAYS.filter((d) => d.dayNumber >= 6 && d.dayNumber <= 10).map((d) => d.id), label: 'Săpt. 2' },
    { week: 3, dayIds: ALL_DAYS.filter((d) => d.dayNumber >= 11 && d.dayNumber <= 15).map((d) => d.id), label: 'Săpt. 3' },
    { week: 4, dayIds: ALL_DAYS.filter((d) => d.dayNumber >= 16).map((d) => d.id), label: 'Săpt. 4' },
  ];

  return weeks.map(({ week, dayIds, label }) => {
    if (!trainees.length) return { week, label, percent: 0 };
    let total = 0;
    for (const t of trainees) {
      const p = getProgress(t.id);
      const done = dayIds.filter((id) => {
        const dp = p.days[id];
        const day = ALL_DAYS.find((d) => d.id === id);
        if (!dp || !day) return false;
        const tasks = day.tasks.every((task) => dp.completedTasks.includes(task.id));
        const mentor = !day.requiresMentorValidation || dp.mentorValidated;
        return tasks && mentor;
      }).length;
      total += (done / dayIds.length) * 100;
    }
    return { week, label, percent: Math.round(total / trainees.length) };
  });
}
