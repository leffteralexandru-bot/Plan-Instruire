/** Breakpoints standard (container queries): mobil <768, tabletă @md, laptop @lg, desktop @xl. */
export const BREAKPOINTS = {
  mobileMax: 639,
  mobileOptimized: 390,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const;

/** Clasă pe `<html>` când layout-ul e telefon (<768px). */
export const PHONE_LAYOUT_HTML_CLASS = 'phone-layout';

/** Font rădăcină pe telefon — scalare proporțională (rem) pentru tot UI-ul. */
export const PHONE_ROOT_FONT_PX = 13;

export const RESPONSIVE_TRANSITION = 'transition-all duration-300';

/** Iconițe UI — w-6/h-6 mobil, w-8/h-8 desktop. */
export const ICON_RESPONSIVE = 'h-6 w-6 @lg:h-8 @lg:w-8 shrink-0';

/** Etichetă buton — mobil compact (390px), scalare progresivă spre desktop. */
export const BUTTON_LABEL_RESPONSIVE = 'text-[10px] leading-none @md:text-xs @lg:text-sm';

/** Video încorporat — fullscreen pe mobil, container pe desktop. */
export const VIDEO_EMBED =
  'w-full aspect-video transition-all duration-300 @xl:max-w-4xl @xl:mx-auto';

export const VIEWPORT_PREVIEW_WIDTHS = {
  mobile: 390,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const;

export type ViewportPreviewMode = keyof typeof VIEWPORT_PREVIEW_WIDTHS | 'auto';

export const VIEWPORT_PREVIEW_LABELS: Record<ViewportPreviewMode, string> = {
  auto: 'Auto',
  mobile: 'Mobil',
  tablet: 'Tabletă',
  laptop: 'Laptop',
  desktop: 'Desktop',
};

/** Container principal — lățime fluidă, centrat pe ecrane mari. */
export const SHELL_INNER =
  'mx-auto w-full px-4 py-6 @md:px-6 @md:py-8 @xl:max-w-screen-xl';

/** Antet / nav — aliniat cu shell-ul. */
export const HEADER_INNER =
  'mx-auto flex w-full items-center justify-between gap-1 px-2 py-1.5 @md:gap-3 @md:px-6 @md:py-2.5 @lg:gap-4 @lg:py-3 @xl:max-w-screen-xl';

/** Logo artGRANIT în header — scalat per ecran. */
export const HEADER_LOGO_SIZE = 'h-[12px] shrink-0 @md:h-4 @lg:h-5 @xl:h-[26px]';

/** Bloc titlu lângă logo (2 rânduri). */
export const HEADER_BRAND_BLOCK =
  'min-w-0 border-l border-white/15 pl-1.5 @md:pl-2 @lg:pl-3';

export const HEADER_BRAND_TITLE =
  'line-clamp-2 text-[10px] font-medium uppercase leading-tight tracking-wide text-corporate-gold @md:text-xs @lg:text-sm @xl:text-base';

export const HEADER_BRAND_SUBTITLE =
  'line-clamp-2 text-[10px] leading-tight text-white/80 @md:text-xs @lg:text-sm @xl:text-base';

/** Nume + funcție angajat (dreapta). */
export const HEADER_USER_AREA =
  'flex max-w-[48%] shrink-0 items-center gap-1 @md:max-w-[40%] @md:gap-2 @lg:max-w-none @lg:gap-3';

export const HEADER_USER_BLOCK = 'min-w-0 text-right';

export const HEADER_USER_NAME =
  'line-clamp-1 text-[11px] font-medium leading-tight text-white @md:text-xs @lg:text-sm @xl:text-base';

export const HEADER_USER_ROLE =
  'line-clamp-1 text-[10px] leading-tight text-white/75 @md:text-xs @lg:text-sm @xl:text-base';

/** Etichete în bare (departamente, bottom nav) — lizibile pe 390px. */
export const BAR_NAV_LABEL =
  'w-full text-center text-[10px] font-medium leading-snug @md:text-xs';

export const BAR_NAV_LABEL_DEPT =
  'dept-nav-label w-full text-center leading-tight break-words';

export const BAR_NAV_LABEL_DEPT_MOBILE =
  'dept-nav-label--mobile @md:hidden break-normal';

export const BAR_NAV_LABEL_DEPT_DESKTOP =
  'dept-nav-label--desktop hidden @md:inline font-medium line-clamp-1 @md:text-xs @md:leading-snug @md:uppercase @md:tracking-[0.12em] @lg:text-sm';

export const BAR_NAV_INACTIVE = 'text-white/80 hover:text-white';

export const BAR_NAV_ACTIVE = 'text-corporate-gold';

export const NAV_INNER =
  'mx-auto flex w-full gap-1 overflow-x-auto px-4 py-2 @md:px-6 @md:gap-2 @xl:max-w-screen-xl';

/** Grid-uri standard pentru panouri și dashboard. */
export const GRID_RESPONSIVE =
  'grid grid-cols-1 gap-4 @md:grid-cols-2 @md:gap-6 @lg:grid-cols-3 @lg:gap-6';

/** Touch target minim (WCAG) pe mobil. */
export const TOUCH_TARGET = 'min-h-[44px] min-w-[44px]';

/** Butoane icon header — formă ovală, scalate per ecran (3 puncte + Ieșire). */
export const HEADER_ICON_BTN =
  'inline-flex shrink-0 items-center justify-center !rounded-full p-0 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-2';

/** Oval îngust — mărime buton per breakpoint container. */
export const HEADER_ICON_BTN_SIZE =
  'h-6 w-5 min-h-0 min-w-0 @md:h-7 @md:w-6 @lg:h-8 @lg:w-7 @xl:h-9 @xl:w-8';

/** Iconiță în interiorul butonului — aceeași scalare. */
export const HEADER_ICON_INNER =
  'h-3 w-3 @md:h-3.5 @md:w-3.5 @lg:h-4 @lg:w-4 @xl:h-[18px] @xl:w-[18px]';

export const VIEWPORT_DOTS_ICON = HEADER_ICON_INNER;

export const VIEWPORT_DOTS_PANEL_OPTION =
  'h-7 w-7 @md:h-8 @md:w-8 @lg:h-9 @lg:w-9';

export const VIEWPORT_DOTS_PANEL_AUTO =
  'h-7 min-w-[1.75rem] text-[7px] @md:h-8 @md:min-w-[2rem] @md:text-[8px] @lg:h-9 @lg:text-[9px]';

export const HEADER_ICON_BTN_DARK = 'text-white/80 hover:bg-white/10 hover:text-white';

export const HEADER_ICON_BTN_LIGHT =
  'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-stone';

