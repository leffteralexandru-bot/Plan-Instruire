import type { TestingZoneId } from '@/lib/testingStageGuide';

/** Categorii vizuale pentru modul de testare */
export type TestingStageCategory =
  | 'hr-admin'
  | 'instruire'
  | 'mentor-validari'
  | 'rapoarte'
  | 'evaluare';

export interface TestingStageTheme {
  category: TestingStageCategory;
  label: string;
  border: string;
  ring: string;
  headerBg: string;
  headerText: string;
  bodyBg: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
  chipCurrent: string;
  chipDone: string;
  chipPending: string;
  navRing: string;
  legendDot: string;
}

const THEMES: Record<TestingStageCategory, TestingStageTheme> = {
  'hr-admin': {
    category: 'hr-admin',
    label: 'Administrare HR',
    border: 'border-sky-500',
    ring: 'ring-sky-300/50',
    headerBg: 'bg-sky-500',
    headerText: 'text-sky-950',
    bodyBg: 'bg-sky-50/70',
    bannerBg: 'bg-sky-100',
    bannerBorder: 'border-sky-500',
    bannerText: 'text-sky-950',
    chipCurrent: 'bg-sky-400 border-sky-600 text-sky-950 ring-1 ring-sky-600',
    chipDone: 'bg-sky-200/70 border-sky-300 text-sky-800 line-through',
    chipPending: 'bg-white/60 border-sky-200 text-sky-700',
    navRing: 'ring-sky-400',
    legendDot: 'bg-sky-500',
  },
  instruire: {
    category: 'instruire',
    label: 'Instruire zilnică',
    border: 'border-emerald-500',
    ring: 'ring-emerald-300/50',
    headerBg: 'bg-emerald-500',
    headerText: 'text-emerald-950',
    bodyBg: 'bg-emerald-50/70',
    bannerBg: 'bg-emerald-100',
    bannerBorder: 'border-emerald-500',
    bannerText: 'text-emerald-950',
    chipCurrent: 'bg-emerald-400 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600',
    chipDone: 'bg-emerald-200/70 border-emerald-300 text-emerald-800 line-through',
    chipPending: 'bg-white/60 border-emerald-200 text-emerald-700',
    navRing: 'ring-emerald-400',
    legendDot: 'bg-emerald-500',
  },
  'mentor-validari': {
    category: 'mentor-validari',
    label: 'Validări mentor',
    border: 'border-violet-500',
    ring: 'ring-violet-300/50',
    headerBg: 'bg-violet-500',
    headerText: 'text-violet-950',
    bodyBg: 'bg-violet-50/70',
    bannerBg: 'bg-violet-100',
    bannerBorder: 'border-violet-500',
    bannerText: 'text-violet-950',
    chipCurrent: 'bg-violet-400 border-violet-600 text-violet-950 ring-1 ring-violet-600',
    chipDone: 'bg-violet-200/70 border-violet-300 text-violet-800 line-through',
    chipPending: 'bg-white/60 border-violet-200 text-violet-700',
    navRing: 'ring-violet-400',
    legendDot: 'bg-violet-500',
  },
  rapoarte: {
    category: 'rapoarte',
    label: 'Rapoarte feedback',
    border: 'border-amber-500',
    ring: 'ring-amber-300/50',
    headerBg: 'bg-amber-500',
    headerText: 'text-amber-950',
    bodyBg: 'bg-amber-50/70',
    bannerBg: 'bg-amber-100',
    bannerBorder: 'border-amber-500',
    bannerText: 'text-amber-950',
    chipCurrent: 'bg-amber-400 border-amber-600 text-amber-950 ring-1 ring-amber-600',
    chipDone: 'bg-amber-200/70 border-amber-300 text-amber-800 line-through',
    chipPending: 'bg-white/60 border-amber-200 text-amber-800',
    navRing: 'ring-amber-400',
    legendDot: 'bg-amber-500',
  },
  evaluare: {
    category: 'evaluare',
    label: 'Evaluare tri-lunară',
    border: 'border-rose-500',
    ring: 'ring-rose-300/50',
    headerBg: 'bg-rose-500',
    headerText: 'text-rose-950',
    bodyBg: 'bg-rose-50/70',
    bannerBg: 'bg-rose-100',
    bannerBorder: 'border-rose-500',
    bannerText: 'text-rose-950',
    chipCurrent: 'bg-rose-400 border-rose-600 text-rose-950 ring-1 ring-rose-600',
    chipDone: 'bg-rose-200/70 border-rose-300 text-rose-800 line-through',
    chipPending: 'bg-white/60 border-rose-200 text-rose-700',
    navRing: 'ring-rose-400',
    legendDot: 'bg-rose-500',
  },
};

const STAGE_CODE_CATEGORY: Record<string, TestingStageCategory> = {
  'hr-setup': 'hr-admin',
  'angajat-instruire': 'instruire',
  'mentor-validare': 'mentor-validari',
  'mentor-feedback-s2': 'rapoarte',
  'mentor-feedback-s4': 'rapoarte',
  'hr-start-eval': 'evaluare',
  'angajat-auto-eval': 'evaluare',
  'supervisor-eval': 'evaluare',
  'hr-finalize-eval': 'evaluare',
};

const ZONE_CATEGORY: Record<TestingZoneId, TestingStageCategory> = {
  'zone-hr-planning': 'hr-admin',
  'zone-plan-dashboard': 'instruire',
  'zone-mentor-validari': 'mentor-validari',
  'zone-mentor-feedback-s2': 'rapoarte',
  'zone-mentor-feedback-s4': 'rapoarte',
  'zone-hr-evaluari': 'evaluare',
  'zone-angajat-eval': 'evaluare',
  'zone-supervisor-eval': 'evaluare',
};

export function getTestingStageCategory(stageCode: string): TestingStageCategory {
  return STAGE_CODE_CATEGORY[stageCode] ?? 'instruire';
}

export function getTestingZoneCategory(zoneId: TestingZoneId): TestingStageCategory {
  return ZONE_CATEGORY[zoneId];
}

export function getTestingStageTheme(
  categoryOrStageCode: TestingStageCategory | string,
): TestingStageTheme {
  const category =
    categoryOrStageCode in THEMES
      ? (categoryOrStageCode as TestingStageCategory)
      : getTestingStageCategory(categoryOrStageCode);
  return THEMES[category];
}

export const TESTING_CATEGORY_LEGEND: { category: TestingStageCategory; label: string }[] = [
  { category: 'hr-admin', label: 'Administrare HR' },
  { category: 'instruire', label: 'Instruire' },
  { category: 'mentor-validari', label: 'Validări mentor' },
  { category: 'rapoarte', label: 'Rapoarte' },
  { category: 'evaluare', label: 'Evaluare 90 zile' },
];
