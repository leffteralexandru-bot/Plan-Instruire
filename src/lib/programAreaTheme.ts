/** Culori consistente: instruire (amber), certificat (emerald), re-instruire (orange), evaluare (indigo). */
export type ProgramArea = 'training' | 'certificate' | 'retraining' | 'evaluation';

export interface ProgramAreaTheme {
  summaryCard: string;
  summaryLabel: string;
  blockShell: string;
  blockHeader: string;
  blockTitle: string;
  blockBody: string;
  itemShell: string;
  progressBar: string;
  flowShell: string;
  flowEyebrow: string;
  accentBar: string;
}

export const PROGRAM_AREA_THEMES: Record<ProgramArea, ProgramAreaTheme> = {
  training: {
    summaryCard: 'border-amber-200/80 bg-amber-50/50',
    summaryLabel: 'text-amber-800/80',
    blockShell: 'border-amber-200/70 bg-white',
    blockHeader: 'border-amber-100 bg-amber-50/50',
    blockTitle: 'text-amber-800/90',
    blockBody: 'bg-white',
    itemShell: 'border-amber-100/80 bg-amber-50/30',
    progressBar: 'bg-amber-400',
    flowShell: 'border-amber-200/70 bg-amber-50/25',
    flowEyebrow: 'text-amber-800/90',
    accentBar: 'bg-amber-400',
  },
  certificate: {
    summaryCard: 'border-emerald-200/80 bg-emerald-50/50',
    summaryLabel: 'text-emerald-800/80',
    blockShell: 'border-emerald-200/80 bg-white',
    blockHeader: 'border-emerald-100 bg-emerald-50/60',
    blockTitle: 'text-emerald-800/90',
    blockBody: 'bg-white',
    itemShell: 'border-emerald-100/80 bg-emerald-50/30',
    progressBar: 'bg-emerald-500',
    flowShell: 'border-emerald-200/80 bg-emerald-50/25',
    flowEyebrow: 'text-emerald-800/90',
    accentBar: 'bg-emerald-500',
  },
  retraining: {
    summaryCard: 'border-orange-200/80 bg-orange-50/50',
    summaryLabel: 'text-orange-900/70',
    blockShell: 'border-orange-200/70 bg-white',
    blockHeader: 'border-orange-100 bg-orange-50/55',
    blockTitle: 'text-orange-800/90',
    blockBody: 'bg-orange-50/25',
    itemShell: 'border-orange-200/70 bg-orange-50/30',
    progressBar: 'bg-orange-500',
    flowShell: 'border-orange-200/80 bg-orange-50/25',
    flowEyebrow: 'text-orange-800/90',
    accentBar: 'bg-orange-500',
  },
  evaluation: {
    summaryCard: 'border-indigo-200/80 bg-indigo-50/50',
    summaryLabel: 'text-indigo-800/80',
    blockShell: 'border-indigo-200/70 bg-white',
    blockHeader: 'border-indigo-100 bg-indigo-50/50',
    blockTitle: 'text-indigo-800/90',
    blockBody: 'bg-white',
    itemShell: 'border-indigo-100 bg-indigo-50/30',
    progressBar: 'bg-indigo-400',
    flowShell: 'border-indigo-200/70 bg-indigo-50/25',
    flowEyebrow: 'text-indigo-800/90',
    accentBar: 'bg-indigo-400',
  },
};

export function programAreaTheme(area: ProgramArea): ProgramAreaTheme {
  return PROGRAM_AREA_THEMES[area];
}
