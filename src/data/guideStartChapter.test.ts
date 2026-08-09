import { describe, expect, it } from 'vitest';
import { getFieldGuideStartChapterId, getFieldGuideDevice } from '@/data/fieldGuideChapters';
import { getDesignGuideStartChapterId, getDesignGuideDevice } from '@/data/designGuideChapters';
import { OPERATIONAL_GUIDE_TASK_ORDER } from '@/data/operationalGuide';

describe('guide start chapter = Cuprins', () => {
  it.each(OPERATIONAL_GUIDE_TASK_ORDER)('măsurare %s pornește pe Cuprins (ch-2)', (taskId) => {
    const startId = getFieldGuideStartChapterId(taskId);
    expect(startId).toBe(`field-${taskId}-ch-2`);
    const chapter = getFieldGuideDevice(taskId).chapters?.find((c) => c.id === startId);
    expect(chapter?.title).toMatch(/Cuprins/i);
  });

  it.each(OPERATIONAL_GUIDE_TASK_ORDER)('proiectare %s pornește pe Cuprins (ch-2)', (taskId) => {
    const startId = getDesignGuideStartChapterId(taskId);
    expect(startId).toBe(`design-${taskId}-ch-2`);
    const chapter = getDesignGuideDevice(taskId).chapters?.find((c) => c.id === startId);
    expect(chapter?.title).toMatch(/Cuprins/i);
  });
});
