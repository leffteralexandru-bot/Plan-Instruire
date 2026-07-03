import { useAuth } from '@/hooks/useAuth';
import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import {
  getTestingRoadmap,
  TESTING_VISUAL_GUIDE_ENABLED,
} from '@/lib/testingStageGuide';
import {
  getTestingStageTheme,
  TESTING_CATEGORY_LEGEND,
} from '@/lib/testingStageThemes';

export function TestingStageBanner() {
  const { user } = useAuth();
  const guide = useTestingStageGuide();
  const roadmap = getTestingRoadmap(guide);
  const currentTheme = guide ? getTestingStageTheme(guide.category) : null;

  if (!TESTING_VISUAL_GUIDE_ENABLED || !user || !guide || !currentTheme) return null;

  return (
    <div
      className={[
        'mb-4 rounded-lg border-2 px-4 py-3 text-sm space-y-2',
        currentTheme.bannerBorder,
        currentTheme.bannerBg,
        currentTheme.bannerText,
      ].join(' ')}
    >
      <div>
        <span className="font-bold">Mod testare — scenariu Andrei Popescu</span>
        {' · '}
        <span
          className={[
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold',
            currentTheme.headerBg,
            currentTheme.headerText,
          ].join(' ')}
        >
          {currentTheme.label}
        </span>
        {' · '}
        <span className="font-medium">{guide.title}</span>
      </div>

      <p>
        <span className="font-medium">Rol activ:</span> {guide.roleLabel} — {guide.instruction}
        {guide.isViewerTurn ? (
          <span
            className={[
              'ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-bold',
              currentTheme.headerBg,
              currentTheme.headerText,
            ].join(' ')}
          >
            Este rândul tău
          </span>
        ) : (
          <span className="ml-2 text-xs opacity-80">(alt rol acum — urmăriți pașii de mai jos)</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="font-semibold uppercase tracking-wide opacity-70">Legenda:</span>
        {TESTING_CATEGORY_LEGEND.map((item) => {
          const t = getTestingStageTheme(item.category);
          return (
            <span key={item.category} className="inline-flex items-center gap-1">
              <span className={['h-2.5 w-2.5 rounded-full', t.legendDot].join(' ')} aria-hidden />
              {item.label}
            </span>
          );
        })}
      </div>

      <div
        className="flex flex-wrap gap-1.5 pt-1"
        role="list"
        aria-label="Pași scenariu testare"
      >
        {roadmap.map((step) => {
          const stepTheme = getTestingStageTheme(step.category);
          const chipClass =
            step.status === 'current'
              ? stepTheme.chipCurrent
              : step.status === 'done'
                ? stepTheme.chipDone
                : stepTheme.chipPending;

          return (
            <span
              key={step.stageCode}
              role="listitem"
              title={`${step.label} — ${step.roleLabel} (${stepTheme.label})`}
              className={['rounded px-2 py-0.5 text-[11px] font-medium border', chipClass].join(' ')}
            >
              {step.step}. {step.label}
              <span className="opacity-70"> ({step.roleLabel})</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
