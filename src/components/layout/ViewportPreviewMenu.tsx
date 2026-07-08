import { useEffect, useId, useRef, useState } from 'react';
import { useViewportPreview } from '@/context/ViewportPreviewContext';
import {
  VIEWPORT_PREVIEW_LABELS,
  VIEWPORT_PREVIEW_WIDTHS,
  VIEWPORT_DOTS_ICON,
  VIEWPORT_DOTS_PANEL_AUTO,
  VIEWPORT_DOTS_PANEL_OPTION,
  HEADER_ICON_BTN,
  HEADER_ICON_BTN_SIZE,
  HEADER_ICON_BTN_DARK,
  HEADER_ICON_BTN_LIGHT,
  type ViewportPreviewMode,
} from '@/lib/responsiveLayout';

const PREVIEW_MODES = ['mobile', 'tablet', 'laptop', 'desktop'] as const;

const MODE_HINTS: Record<ViewportPreviewMode, string> = {
  auto: 'Auto — lățime nativă (telefon)',
  mobile: `Mobil · ${VIEWPORT_PREVIEW_WIDTHS.mobile}px`,
  tablet: `Tabletă · ${VIEWPORT_PREVIEW_WIDTHS.tablet}px`,
  laptop: `Laptop · ${VIEWPORT_PREVIEW_WIDTHS.laptop}px`,
  desktop: `Desktop · ${VIEWPORT_PREVIEW_WIDTHS.desktop}px`,
};

export function ViewportModeIcon({
  mode,
  className = '',
}: {
  mode: (typeof PREVIEW_MODES)[number];
  className?: string;
}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (mode) {
    case 'mobile':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect {...common} x="8" y="3" width="8" height="18" rx="2" />
          <path {...common} d="M11.5 18.5h1" />
        </svg>
      );
    case 'tablet':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect {...common} x="5" y="4" width="14" height="16" rx="2" />
          <path {...common} d="M11.5 17.5h1" />
        </svg>
      );
    case 'laptop':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect {...common} x="5" y="5" width="14" height="10" rx="1.5" />
          <path {...common} d="M3 17h18" />
          <path {...common} d="M7 17l1-2h8l1 2" />
        </svg>
      );
    case 'desktop':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect {...common} x="3" y="4" width="18" height="12" rx="1.5" />
          <path {...common} d="M9 20h6" />
          <path {...common} d="M12 16v4" />
        </svg>
      );
  }
}

function DotsVerticalIcon({ className = VIEWPORT_DOTS_ICON }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <circle cx="12" cy="7" r="1.35" />
      <circle cx="12" cy="12" r="1.35" />
      <circle cx="12" cy="17" r="1.35" />
    </svg>
  );
}

interface ViewportPreviewMenuProps {
  tone?: 'dark' | 'light';
  /** Meniu deschis în sus (bara de jos). */
  placement?: 'top' | 'bottom';
  /** compact = desktop; dots = 3 puncte verticale pe mobil; bottomNav = bara de jos. */
  layout?: 'compact' | 'dots' | 'bottomNav';
}

export function ViewportPreviewMenu({
  tone = 'dark',
  placement = 'top',
  layout = 'dots',
}: ViewportPreviewMenuProps) {
  const { mode, setMode, phoneLayoutLocked } = useViewportPreview();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const select = (next: ViewportPreviewMode) => {
    setMode(next);
    setOpen(false);
  };

  const isDark = tone === 'dark';
  const isAuto = mode === 'auto';
  const isBottomNav = layout === 'bottomNav';
  const isDots = layout === 'dots';
  const panelOpensUp = placement === 'bottom';

  const shellClass = isDark
    ? 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
    : 'border-corporate-border bg-white text-corporate-muted hover:bg-corporate-surface hover:text-corporate-stone';

  const panelClass = isDark
    ? 'border-white/15 bg-corporate-darker shadow-neural-lg'
    : 'border-corporate-border bg-white shadow-neural-lg';

  const optionBase = isDark
    ? 'text-white/55 hover:bg-white/8 hover:text-white/90'
    : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-stone';

  const optionActive = isDark
    ? 'bg-corporate-gold/15 text-corporate-gold ring-1 ring-corporate-gold/40'
    : 'bg-corporate-gold-light text-corporate-black ring-1 ring-corporate-gold/50';

  const triggerLabel = phoneLayoutLocked ? 'AUTO' : isAuto ? 'AUTO' : VIEWPORT_PREVIEW_LABELS[mode];

  if (phoneLayoutLocked && isBottomNav) {
    return (
      <div
        className="flex min-h-[44px] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-corporate-gold"
        title={MODE_HINTS.auto}
        aria-label={MODE_HINTS.auto}
      >
        <ViewportModeIcon mode="mobile" className="h-4 w-4" />
        <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.08em]">AUTO</span>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={
          isBottomNav
            ? [
                'flex min-h-[44px] min-w-0 flex-col items-center justify-center gap-0.5 rounded px-0.5 transition-colors',
                isAuto ? 'text-corporate-gold' : 'text-white/55',
              ].join(' ')
            : isDots
              ? [
                  HEADER_ICON_BTN,
                  HEADER_ICON_BTN_SIZE,
                  isDark ? HEADER_ICON_BTN_DARK : HEADER_ICON_BTN_LIGHT,
                  open
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-corporate-surface text-corporate-stone'
                    : '',
                ].join(' ')
              : [
                  'flex h-7 items-center justify-center rounded-md border px-1.5 transition-colors',
                  isAuto ? 'min-w-[2rem]' : 'w-7',
                  shellClass,
                  open
                    ? isDark
                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                      : 'bg-corporate-surface text-corporate-stone ring-1 ring-corporate-border'
                    : '',
                  isAuto ? 'text-corporate-gold' : '',
                ].join(' ')
        }
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={`Previzualizare: ${VIEWPORT_PREVIEW_LABELS[mode]}`}
        title={MODE_HINTS[mode]}
        onClick={() => setOpen((v) => !v)}
      >
        {isBottomNav ? (
          <>
            {isAuto ? (
              <ViewportModeIcon mode="mobile" className="h-4 w-4" />
            ) : (
              <ViewportModeIcon mode={mode} className="h-4 w-4" />
            )}
            <span className="text-[8px] font-medium leading-tight">{triggerLabel}</span>
          </>
        ) : isDots ? (
          <DotsVerticalIcon className={VIEWPORT_DOTS_ICON} />
        ) : isAuto ? (
          <span className="text-[7px] font-semibold uppercase tracking-[0.12em]">AUTO</span>
        ) : (
          <ViewportModeIcon mode={mode} className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Mod previzualizare"
          className={[
            'absolute z-[70] rounded-lg border p-1 @md:p-1.5',
            isDots ? 'left-0' : 'right-0',
            panelOpensUp ? 'bottom-full mb-1' : 'top-full mt-1',
            panelClass,
          ].join(' ')}
        >
          <div className="flex items-center gap-0.5 @md:gap-1">
            <button
              type="button"
              role="option"
              aria-selected={isAuto}
              aria-label="Auto"
              title={MODE_HINTS.auto}
              className={[
                'flex items-center justify-center rounded-md px-1 font-semibold uppercase tracking-[0.12em] transition-colors',
                isDots ? VIEWPORT_DOTS_PANEL_AUTO : 'h-7 min-w-[1.75rem] text-[7px]',
                isAuto ? optionActive : optionBase,
              ].join(' ')}
              onClick={() => select('auto')}
            >
              AUTO
            </button>

            {!phoneLayoutLocked &&
              PREVIEW_MODES.map((previewMode) => (
                <button
                  key={previewMode}
                  type="button"
                  role="option"
                  aria-selected={mode === previewMode}
                  aria-label={VIEWPORT_PREVIEW_LABELS[previewMode]}
                  title={MODE_HINTS[previewMode]}
                  className={[
                    'flex items-center justify-center rounded-md transition-colors',
                    isDots ? VIEWPORT_DOTS_PANEL_OPTION : 'h-7 w-7',
                    mode === previewMode ? optionActive : optionBase,
                  ].join(' ')}
                  onClick={() => select(previewMode)}
                >
                  <ViewportModeIcon
                    mode={previewMode}
                    className={isDots ? VIEWPORT_DOTS_ICON : 'h-3.5 w-3.5'}
                  />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
