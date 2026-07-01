import type { ActConstatare } from '@/types';
import { ERROR_LIBRARY } from '@/data/errorLibrary';

/** Cuvinte cheie artGRANIT pentru mapare acte → bibliotecă erori */
const ERROR_KEYWORDS: Record<string, string[]> = {
  e1: ['oglind', 'simetri', '3mm', 'simetrie'],
  e2: ['obstacol', 'proliner', 'priz', 'coloar'],
  e3: ['cant', 'cad', 'latura', 'dulap'],
  e4: ['quartz', 'exterior', 'uv', 'granit'],
  e5: ['unghi', 'atipic', '90', 'decupaj'],
  e6: ['bitrix', 'document', 'upload', 'folder', 'lips'],
};

export interface ErrorHeatmapEntry {
  errorId: string;
  title: string;
  category: string;
  count: number;
  frequency: string;
}

export function matchActToErrorIds(act: ActConstatare): string[] {
  const text = `${act.eroriIdentificate} ${act.abateriMasuratori} ${act.masuriCorective} ${act.observatii ?? ''}`.toLowerCase();
  return ERROR_LIBRARY.filter((e) =>
    (ERROR_KEYWORDS[e.id] ?? []).some((kw) => text.includes(kw)),
  ).map((e) => e.id);
}

export function buildErrorHeatmap(acte: ActConstatare[]): ErrorHeatmapEntry[] {
  const counts = new Map<string, number>();
  for (const act of acte) {
    for (const id of matchActToErrorIds(act)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return ERROR_LIBRARY.map((e) => ({
    errorId: e.id,
    title: e.title,
    category: e.category,
    count: counts.get(e.id) ?? 0,
    frequency: e.frequency,
  })).sort((a, b) => b.count - a.count);
}

export function aggregateCohortErrorHeatmap(
  acteLists: ActConstatare[][],
): ErrorHeatmapEntry[] {
  return buildErrorHeatmap(acteLists.flat());
}
