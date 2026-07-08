import type { ReactNode } from 'react';
import { useViewportPreview } from '@/context/ViewportPreviewContext';
import { RESPONSIVE_TRANSITION } from '@/lib/responsiveLayout';

export function ViewportFrame({ children }: { children: ReactNode }) {
  const { frameWidth, isSimulated } = useViewportPreview();

  return (
    <div
      className={[
        'flex flex-1 flex-col',
        RESPONSIVE_TRANSITION,
        isSimulated ? 'items-center bg-slate-200/80 px-2 py-3 @md:px-4' : '',
      ].join(' ')}
    >
      <div
        className={[
          '@container flex min-h-0 w-full flex-1 flex-col',
          RESPONSIVE_TRANSITION,
          isSimulated
            ? 'min-h-[min(100dvh,820px)] overflow-hidden rounded-xl border border-corporate-border bg-corporate-surface shadow-neural-lg'
            : 'min-h-screen',
        ].join(' ')}
        style={frameWidth ? { width: frameWidth, maxWidth: '100%' } : undefined}
        data-viewport-frame={isSimulated ? 'simulated' : 'native'}
      >
        {children}
      </div>
    </div>
  );
}
