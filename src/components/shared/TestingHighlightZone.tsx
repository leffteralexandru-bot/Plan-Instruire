import type { ReactNode } from 'react';
import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import { getTestingStageTheme } from '@/lib/testingStageThemes';
import type { TestingZoneId } from '@/lib/testingStageGuide';

interface TestingHighlightZoneProps {
  zoneId: TestingZoneId;
  children: ReactNode;
  className?: string;
}

export function TestingHighlightZone({ zoneId, children, className = '' }: TestingHighlightZoneProps) {
  const guide = useTestingStageGuide();
  const active = guide?.enabled && guide.activeZone === zoneId;
  const theme = guide ? getTestingStageTheme(guide.category) : null;

  if (!active || !guide || !theme) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={[
        'rounded-xl border-4 ring-4',
        theme.border,
        theme.ring,
        guide.isViewerTurn ? '' : 'opacity-95',
        className,
      ].join(' ')}
    >
      <div className={['rounded-t-lg px-3 py-2 text-xs font-semibold', theme.headerBg, theme.headerText].join(' ')}>
        <span className="uppercase tracking-wide text-[10px] opacity-90">{theme.label}</span>
        <span className="block mt-0.5">TEST — {guide.title}</span>
        <span className="block font-normal mt-0.5">{guide.instruction}</span>
        {!guide.isViewerTurn && (
          <span className="block text-[10px] font-medium mt-1 opacity-90">
            Rol activ: {guide.roleLabel} — vizualizare pas curent
          </span>
        )}
      </div>
      <div className={['p-3 sm:p-4 rounded-b-lg', theme.bodyBg].join(' ')}>{children}</div>
    </div>
  );
}
