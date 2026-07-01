import type { DayPlan, DayProgress } from '@/types';

export function isDayComplete(
  dayPlan: DayPlan | undefined,
  dayProg: DayProgress,
): boolean {
  if (!dayPlan) return false;
  const tasksDone = dayPlan.tasks.every((t) => dayProg.completedTasks.includes(t.id));
  const mentorOk = !dayPlan.requiresMentorValidation || dayProg.mentorValidated;
  return tasksDone && mentorOk;
}

export function isDayUnlocked(
  dayId: string,
  allDays: DayPlan[],
  getDayProgress: (id: string) => DayProgress,
  isComplete: (id: string) => boolean,
): boolean {
  const dayProg = getDayProgress(dayId);
  if (dayProg.mentorUnlocked) return true;
  const idx = allDays.findIndex((d) => d.id === dayId);
  if (idx <= 0) return true;
  return isComplete(allDays[idx - 1].id);
}

export function getResumeDayId(
  allDays: DayPlan[],
  lastVisitedDayId: string | undefined,
  isUnlocked: (id: string) => boolean,
  isComplete: (id: string) => boolean,
): string | null {
  if (lastVisitedDayId) {
    const last = allDays.find((d) => d.id === lastVisitedDayId);
    if (last && isUnlocked(last.id) && !isComplete(last.id)) return last.id;
  }
  const next = allDays.find((d) => isUnlocked(d.id) && !isComplete(d.id));
  return next?.id ?? null;
}

export function compressImage(file: File, maxWidth = 1280, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    img.src = url;
  });
}
