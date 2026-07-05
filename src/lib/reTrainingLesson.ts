import { getDayById } from '@/data/trainingPlan';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import type { ReTrainingSession } from '@/types';

export function getReTrainingDay(session: ReTrainingSession) {
  if (!session.topicDayId) return undefined;
  return getDayById(session.topicDayId);
}

export function getReTrainingSupplementaryDocs(session: ReTrainingSession) {
  return hrPerformanceStore
    .getDocuments()
    .filter((d) => session.documentIds.includes(d.id));
}

export function extractLessonNotesFromDescription(session: ReTrainingSession): string | undefined {
  const marker = '\n\nLecție / materiale: ';
  const idx = session.descriere.indexOf(marker);
  if (idx < 0) return undefined;
  return session.descriere.slice(idx + marker.length).trim();
}
