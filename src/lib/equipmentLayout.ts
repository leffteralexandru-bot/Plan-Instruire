import { BREAKPOINTS } from '@/lib/responsiveLayout';

/** 4 ecrane: telefon 0–639, tabletă 640–1023, laptop 1024–1279, desktop ≥1280. */
export type EquipmentLayoutMode = 'phone' | 'tablet' | 'laptop' | 'desktop';

export const EQUIPMENT_LAYOUT_BREAKPOINTS = {
  phoneMax: BREAKPOINTS.mobileMax,
  tabletMin: BREAKPOINTS.mobileMax + 1,
  laptopMin: BREAKPOINTS.laptop,
  desktopMin: BREAKPOINTS.desktop,
} as const;

export function resolveEquipmentLayoutMode(width: number): EquipmentLayoutMode {
  if (width <= EQUIPMENT_LAYOUT_BREAKPOINTS.phoneMax) return 'phone';
  if (width < EQUIPMENT_LAYOUT_BREAKPOINTS.laptopMin) return 'tablet';
  if (width < EQUIPMENT_LAYOUT_BREAKPOINTS.desktopMin) return 'laptop';
  return 'desktop';
}

/** Container root pentru query-uri @container în modulul echipament. */
export const EQUIPMENT_GUIDE_CONTAINER = '@container equipment-guide';

/** Grid capitole — 1 col telefon, 2 col tabletă, sidebar la laptop+. */
export const EQUIPMENT_CHAPTER_GRID =
  'grid grid-cols-1 gap-2 @min-[640px]:grid-cols-2 @min-[640px]:gap-3 @lg:grid-cols-1 @lg:gap-1';

/** Layout principal laptop/desktop: sidebar + conținut. */
export const EQUIPMENT_SIDEBAR_LAYOUT =
  '@lg:grid @lg:grid-cols-[minmax(220px,280px)_1fr] @lg:gap-6 @xl:grid-cols-[minmax(260px,300px)_1fr]';

/** Zonă inferioară telefon — reachability (nav + PDF). */
export const EQUIPMENT_REACHABILITY_BAR =
  'fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-corporate-border bg-white/95 px-4 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] @min-[640px]:hidden';

/** Spațiu sub bara fixă pe telefon. */
export const EQUIPMENT_PHONE_BOTTOM_PAD = 'pb-24 @min-[640px]:pb-0';
