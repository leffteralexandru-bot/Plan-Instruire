import type { AppProgress, FeedbackForm } from '@/types';
import { storage } from '@/store/storage';
import { syncProgressToCloud } from '@/lib/sync';
import { getTraineeDayProgress } from '@/lib/traineeProgressStats';

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
