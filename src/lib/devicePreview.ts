export type DevicePreview = 'auto' | 'phone' | 'tablet' | 'laptop';
export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

/** Mod implicit — adaptare după ecranul real. Override-ul e doar în sesiunea curentă. */
export const DEFAULT_DEVICE_PREVIEW: DevicePreview = 'auto';

export function viewportLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet';
  return 'desktop';
}

export function resolveLayoutMode(preview: DevicePreview): LayoutMode {
  if (preview === 'phone') return 'mobile';
  if (preview === 'tablet') return 'tablet';
  if (preview === 'laptop') return 'desktop';
  return viewportLayoutMode();
}

export const PREVIEW_FRAME_WIDTH: Record<Exclude<DevicePreview, 'auto'>, string> = {
  phone: 'max-w-[390px]',
  tablet: 'max-w-[768px]',
  laptop: 'max-w-screen-xl',
};

export const DEVICE_PREVIEW_LABELS: Record<Exclude<DevicePreview, 'auto'>, string> = {
  phone: 'Forțează vizualizare telefon',
  tablet: 'Forțează vizualizare tabletă',
  laptop: 'Forțează vizualizare laptop',
};

export function layoutModeLabel(mode: LayoutMode): string {
  if (mode === 'mobile') return 'Telefon';
  if (mode === 'tablet') return 'Tabletă';
  return 'Laptop / desktop';
}
