import { useMemo, useState } from 'react';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import {
  OPERATIONAL_GUIDE_TASK_ORDER,
  OPERATIONAL_GUIDE_LABELS,
  OPERATIONAL_GUIDE_TASK_COUNT,
  type OperationalGuideTaskId,
} from '@/data/operationalGuide';
import { useOperationalGuide } from '@/hooks/useOperationalGuide';
import { OperationalGuideTaskView } from '@/components/operational/OperationalGuideTaskView';

type OperationalGuideDisplay = 'inline' | 'header' | 'body';

interface OperationalGuidePanelProps {
  userId: string;
  /** HR / mentor în preview — fără bifă echipament */
  readOnly?: boolean;
  display?: OperationalGuideDisplay;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

function OperationalGuideContent({
  userId,
  readOnly,
  activeId,
  onActiveIdChange,
}: {
  userId: string;
  readOnly: boolean;
  activeId: OperationalGuideTaskId;
  onActiveIdChange: (id: OperationalGuideTaskId) => void;
}) {
  const tasks = useOperationalGuide();
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? tasks[0],
    [tasks, activeId],
  );

  return (
    <>
      <nav aria-label="Tipuri măsurare" className="flex flex-wrap gap-1.5">
        {OPERATIONAL_GUIDE_TASK_ORDER.map((id) => {
          const task = tasks.find((t) => t.id === id);
          const hasContent =
            (task?.preMeasurementConditions.length ?? 0) > 0 ||
            !!task?.introText ||
            !!task?.videoUrl ||
            (task?.equipment.length ?? 0) > 0 ||
            (task?.steps.length ?? 0) > 0;
          const isActive = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onActiveIdChange(id)}
              className={[
                'rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors border',
                isActive
                  ? 'bg-corporate-black text-white border-corporate-black shadow-sm'
                  : 'bg-white text-corporate-dark border-corporate-border hover:border-corporate-gold/50 hover:bg-corporate-gold-light/20',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {OPERATIONAL_GUIDE_LABELS[id]}
              {!hasContent && (
                <span className="ml-1.5 text-[10px] opacity-60" aria-label="Conținut necompletat de HR">
                  ·
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {activeTask && (
        <div className="pt-4 border-t border-corporate-border/80">
          <OperationalGuideTaskView task={activeTask} userId={userId} readOnly={readOnly} />
        </div>
      )}
    </>
  );
}

export function OperationalGuidePanel({
  userId,
  readOnly = false,
  display = 'inline',
  expanded: expandedProp,
  onExpandedChange,
}: OperationalGuidePanelProps) {
  const tasks = useOperationalGuide();
  const [expandedInternal, setExpandedInternal] = useState(false);
  const [activeId, setActiveId] = useState<OperationalGuideTaskId>('blat');

  const expanded = display === 'header' ? !!expandedProp : expandedInternal;

  const configuredCount = tasks.filter(
    (t) =>
      t.preMeasurementConditions.length > 0 ||
      t.introText ||
      t.videoUrl ||
      t.equipment.length > 0 ||
      t.steps.length > 0,
  ).length;

  const handleToggle = () => {
    if (display === 'header') {
      onExpandedChange?.(!expanded);
      return;
    }
    setExpandedInternal((v) => {
      const next = !v;
      onExpandedChange?.(next);
      return next;
    });
  };

  if (display === 'body') {
    return (
      <OperationalGuideContent
        userId={userId}
        readOnly={readOnly}
        activeId={activeId}
        onActiveIdChange={setActiveId}
      />
    );
  }

  return (
    <ProfessionalPanel
      variant="neutral"
      icon="training"
      eyebrow="Referință teren"
      title="Ghid Operațional"
      subtitle="7 categorii — reguli pre-măsurare, echipament, pași, video"
      collapsible
      expanded={expanded}
      onToggle={handleToggle}
      bodyDetached={display === 'header'}
      headerTile={display === 'header'}
      toggleLabels={{ expanded: 'Restrânge ghidul', collapsed: 'Deschide ghidul operațional' }}
      badge={
        display === 'header' || configuredCount > 0 ? (
          <span className="text-[10px] font-medium text-corporate-muted tabular-nums">
            {configuredCount}/{OPERATIONAL_GUIDE_TASK_COUNT} categorii
          </span>
        ) : undefined
      }
      collapsedPeek={
        <p className="text-sm text-corporate-muted">
          Apăsați pentru tipul de măsurare — reguli obligatorii, echipament, pași și video.
        </p>
      }
    >
      <OperationalGuideContent
        userId={userId}
        readOnly={readOnly}
        activeId={activeId}
        onActiveIdChange={setActiveId}
      />
    </ProfessionalPanel>
  );
}
