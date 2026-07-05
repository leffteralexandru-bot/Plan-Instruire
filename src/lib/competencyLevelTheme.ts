import type { DesignerCompetencyLevel } from '@/types';

export interface CompetencyLevelTheme {
  shell: string;
  label: string;
  number: string;
}

const LEVEL_THEMES: Record<DesignerCompetencyLevel, CompetencyLevelTheme> = {
  1: {
    shell: 'border-slate-300/90 bg-slate-100 ring-slate-200/80',
    label: 'text-slate-600',
    number: 'text-slate-900',
  },
  2: {
    shell: 'border-sky-300/90 bg-sky-50 ring-sky-200/80',
    label: 'text-sky-700',
    number: 'text-sky-950',
  },
  3: {
    shell: 'border-indigo-300/90 bg-indigo-50 ring-indigo-200/80',
    label: 'text-indigo-700',
    number: 'text-indigo-950',
  },
  4: {
    shell: 'border-amber-400/90 bg-amber-50 ring-amber-200/80',
    label: 'text-amber-800',
    number: 'text-amber-950',
  },
};

export function getCompetencyLevelTheme(level: number): CompetencyLevelTheme | null {
  if (level < 1 || level > 4) return null;
  return LEVEL_THEMES[level as DesignerCompetencyLevel];
}

export function competencyLevelShortLabel(title?: string, level?: number): string {
  if (title) {
    const stripped = title.replace(/^Nivel \d+\s*[—–-]\s*/i, '').trim();
    return stripped || title;
  }
  return level ? `Nivel ${level}` : '—';
}
