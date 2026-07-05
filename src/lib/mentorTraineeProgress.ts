import type { AppProgress, Certificate, FeedbackForm } from '@/types';
import { storage } from '@/store/storage';
import { syncProgressToCloud } from '@/lib/sync';
import { getTraineeDayProgress } from '@/lib/traineeProgressStats';
import { buildCertificateMetrics } from '@/lib/certificateMetrics';
import { certificateNumber as genCertNumber } from '@/lib/certificatePdf';
import { getDefaultOrgSettings } from '@/data/orgSettings';
import { userStore } from '@/lib/userStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';

function persistTraineeProgress(
  traineeId: string,
  next: AppProgress,
  audit: { actorId: string; actorName: string; action: string; targetDayId?: string; details?: string },
) {
  storage.saveProgress(next);
  storage.appendAudit(traineeId, {
    action: audit.action,
    actorId: audit.actorId,
    actorName: audit.actorName,
    targetDayId: audit.targetDayId,
    details: audit.details,
  });
  void syncProgressToCloud(traineeId, next);
}

export function mentorSetTraineeValidation(
  traineeId: string,
  actor: { id: string; name: string },
  dayId: string,
  validated: boolean,
  notes?: string,
) {
  const progress = storage.getProgress(traineeId);
  const day = getTraineeDayProgress(progress, dayId);
  const next: AppProgress = {
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
  };
  persistTraineeProgress(traineeId, next, {
    actorId: actor.id,
    actorName: actor.name,
    action: validated ? 'mentor_validate' : 'mentor_revoke',
    targetDayId: dayId,
    details: notes,
  });
}

export function mentorSetTraineeUnlock(
  traineeId: string,
  actor: { id: string; name: string },
  dayId: string,
  unlocked: boolean,
) {
  const progress = storage.getProgress(traineeId);
  const day = getTraineeDayProgress(progress, dayId);
  const next: AppProgress = {
    ...progress,
    days: {
      ...progress.days,
      [dayId]: { ...day, mentorUnlocked: unlocked },
    },
  };
  persistTraineeProgress(traineeId, next, {
    actorId: actor.id,
    actorName: actor.name,
    action: unlocked ? 'mentor_unlock' : 'mentor_lock',
    targetDayId: dayId,
  });
}

export function mentorSaveTraineeFeedback(
  traineeId: string,
  actor: { id: string; name: string },
  feedback: FeedbackForm,
) {
  const progress = storage.getProgress(traineeId);
  const filtered = progress.feedbacks.filter((f) => f.weekNumber !== feedback.weekNumber);
  const next: AppProgress = {
    ...progress,
    feedbacks: [...filtered, { ...feedback, completedAt: new Date().toISOString() }],
  };
  persistTraineeProgress(traineeId, next, {
    actorId: actor.id,
    actorName: actor.name,
    action: 'feedback_save',
    details: `Săptămâna ${feedback.weekNumber}`,
  });
}

/** Mentor emite certificatul digital din panoul cohortă (echivalent Ziua 20) */
export function mentorIssueCertificate(
  traineeId: string,
  actor: { id: string; name: string },
  input: { mentorName: string; stagiarName: string },
): Certificate {
  const progress = storage.getProgress(traineeId);
  if (progress.certificate) return progress.certificate;

  const metrics = buildCertificateMetrics(progress);
  const issuedAt = new Date().toISOString();
  const programVersion = getDefaultOrgSettings().programVersion;
  const certificate: Certificate = {
    mentorName: input.mentorName,
    stagiarName: input.stagiarName,
    issuedAt,
    programVersion,
    certificateNumber: genCertNumber({
      mentorName: input.mentorName,
      stagiarName: input.stagiarName,
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
  };

  const next: AppProgress = { ...progress, certificate };
  persistTraineeProgress(traineeId, next, {
    actorId: actor.id,
    actorName: actor.name,
    action: 'certificate_issued',
    details: 'Certificat instruire generală 4 săptămâni',
  });

  const enr = userStore.getActiveEnrollmentForAngajat(traineeId);
  if (enr) userStore.updateEnrollment(enr.id, { status: 'completed' });
  hrPerformanceStore.schedulePostTrainingEvaluation(traineeId, issuedAt);

  return certificate;
}
