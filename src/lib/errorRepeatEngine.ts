import type { ErrorCase, ErrorMotiv } from '@/types';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';

/** Fereastră în care se numără repetările aceluiași tip de eroare */
export const ERROR_REPEAT_WINDOW_DAYS = 90;

/** A câta apariție ridică severitatea alertei (informativ) */
export const ERROR_REPEAT_THRESHOLD = 2;

export const RE_TRAINING_TERM_DAYS = 14;

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getErrorTag(motiv: ErrorMotiv): string {
  return motiv;
}

export function getRecentSameMotivCases(
  cases: ErrorCase[],
  angajatId: string,
  motiv: ErrorMotiv,
  windowDays = ERROR_REPEAT_WINDOW_DAYS,
): ErrorCase[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  return cases
    .filter(
      (c) =>
        c.angajatId === angajatId &&
        c.motiv === motiv &&
        new Date(c.data.slice(0, 10)) >= cutoff,
    )
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function shouldTriggerRepeatAlert(
  allCases: ErrorCase[],
  newCase: ErrorCase,
): { trigger: boolean; recentCases: ErrorCase[] } {
  const recentCases = getRecentSameMotivCases(allCases, newCase.angajatId, newCase.motiv);
  return {
    trigger: recentCases.length >= ERROR_REPEAT_THRESHOLD,
    recentCases,
  };
}

export function buildReTrainingTitle(motiv: ErrorMotiv): string {
  const label = ERROR_MOTIV_LABELS[motiv] ?? motiv;
  return `Re-instruire obligatorie — ${label}`;
}

export function buildReTrainingDescription(motiv: ErrorMotiv, count: number): string {
  const label = ERROR_MOTIV_LABELS[motiv] ?? motiv;
  return (
    `Eroarea de tip „${label}” s-a repetat de ${count} ori în ultimele ${ERROR_REPEAT_WINDOW_DAYS} zile. ` +
    'Completați sesiunea de re-instruire și arhivați materialele în Istoric Instruire.'
  );
}

export function buildReTrainingDescriptionForCase(errorCase: ErrorCase): string {
  const label = ERROR_MOTIV_LABELS[errorCase.motiv] ?? errorCase.motiv;
  const detail = errorCase.descriere.trim().slice(0, 120);
  return (
    `Re-instruire pentru eroarea „${label}” (${errorCase.data}). ` +
    `${detail ? `${detail}. ` : ''}` +
    'Încărcați nota semnată, alegeți tema din instruirea de bază și trimiteți planul la HR.'
  );
}

export function buildReTrainingDescriptionFromGroupedErrors(errors: ErrorCase[]): string {
  if (errors.length === 1) return buildReTrainingDescriptionForCase(errors[0]!);
  const dates = errors.map((e) => e.data).join(', ');
  const motivs = [...new Set(errors.map((e) => ERROR_MOTIV_LABELS[e.motiv] ?? e.motiv))];
  return (
    `Re-instruire grupată de HR pentru ${errors.length} erori (${dates}). ` +
    `Tipuri: ${motivs.join(', ')}. ` +
    'Supervizorul încarcă notele semnate, alege tema și mentorul, apoi trimite planul la HR.'
  );
}

export function computeReTrainingDeadline(fromDate = new Date()): string {
  return addDays(fromDate.toISOString().slice(0, 10), RE_TRAINING_TERM_DAYS);
}

export function alertSeverity(count: number): 'warning' | 'critical' {
  return count >= ERROR_REPEAT_THRESHOLD + 1 ? 'critical' : 'warning';
}
