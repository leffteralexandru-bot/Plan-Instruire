import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import type { EmployeeProfile, TraineeProfile, TrainingEnrollment, User } from '@/types';

export interface MentorOverviewRow {
  mentorId: string;
  mentorName: string;
  angajatId: string;
  angajatName: string;
  responsibility: string;
  progressPercent: number;
  completedDays: number;
  totalDays: number;
  remainingDays: number;
  statusLabel: string;
}

export function buildMentorOverviewRows(
  mentors: User[],
  allTrainees: TraineeProfile[],
  profiles: EmployeeProfile[],
  enrollments: TrainingEnrollment[],
): MentorOverviewRow[] {
  const rows: MentorOverviewRow[] = [];
  const activeEnrollments = enrollments.filter((e) => e.status === 'active');

  const pushRow = (
    mentor: User,
    trainee: TraineeProfile,
    responsibility: string,
  ) => {
    const report = buildTraineeHrReport(trainee, storage.getProgress(trainee.id));
    const status = getTraineeStatus(report);
    rows.push({
      mentorId: mentor.id,
      mentorName: mentor.name,
      angajatId: trainee.id,
      angajatName: trainee.name,
      responsibility,
      progressPercent: report.progressPercent,
      completedDays: report.completedDays,
      totalDays: report.totalDays,
      remainingDays: Math.max(0, report.totalDays - report.completedDays),
      statusLabel: getTraineeStatusLabel(status),
    });
  };

  for (const mentor of mentors) {
    for (const enr of activeEnrollments.filter((e) => e.mentorId === mentor.id)) {
      const trainee = allTrainees.find((t) => t.id === enr.angajatId);
      if (!trainee) continue;
      pushRow(mentor, trainee, 'Mentor principal');
    }

    for (const profile of profiles) {
      const trainee = allTrainees.find((t) => t.id === profile.userId);
      if (!trainee) continue;
      const principalId = activeEnrollments.find((e) => e.angajatId === profile.userId)?.mentorId;
      for (const wm of profile.weeklyEvalMentors ?? []) {
        if (wm.mentorId !== mentor.id) continue;
        if (wm.mentorId === principalId) continue;
        pushRow(mentor, trainee, `Săpt. S${wm.weekNumber} (planificat)`);
      }
    }
  }

  return rows.sort((a, b) => a.mentorName.localeCompare(b.mentorName, 'ro'));
}
