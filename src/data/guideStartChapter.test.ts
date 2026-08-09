import { describe, expect, it } from 'vitest';
import {
  getFieldGuideStartChapterId,
  getFieldGuideDevice,
  getFieldGuideDownload,
} from '@/data/fieldGuideChapters';
import {
  getDesignGuideStartChapterId,
  getDesignGuideDevice,
  getDesignGuideDownload,
  DESIGN_GUIDE_MANUAL_PDF,
} from '@/data/designGuideChapters';
import { FIELD_GUIDE_MANUAL_PDF } from '@/data/fieldGuideChapters';
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

describe('Documentație completă = PDF general (toate tipurile)', () => {
  it.each(OPERATIONAL_GUIDE_TASK_ORDER)('măsurare %s descarcă același PDF master', (taskId) => {
    const d = getFieldGuideDownload(taskId);
    expect(d.url).toBe(FIELD_GUIDE_MANUAL_PDF);
    expect(d.fileName).toBe('Ghid-teren-masurare.pdf');
    const ch1 = getFieldGuideDevice(taskId).chapters?.[0];
    expect(ch1?.pdfUrl).toBe(FIELD_GUIDE_MANUAL_PDF);
  });

  it.each(OPERATIONAL_GUIDE_TASK_ORDER)('proiectare %s descarcă același PDF master', (taskId) => {
    const d = getDesignGuideDownload(taskId);
    expect(d.url).toBe(DESIGN_GUIDE_MANUAL_PDF);
    expect(d.fileName).toBe('Ghid-proiectare-cad.pdf');
    const ch1 = getDesignGuideDevice(taskId).chapters?.[0];
    expect(ch1?.pdfUrl).toBe(DESIGN_GUIDE_MANUAL_PDF);
  });
});
