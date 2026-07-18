import { useMemo, useState, type ReactNode } from 'react';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import {
  OPERATIONAL_GUIDE_TASK_ORDER,
  OPERATIONAL_GUIDE_LABELS,
  OPERATIONAL_GUIDE_TASK_COUNT,
  type OperationalGuideTaskId,
} from '@/data/operationalGuide';
import { useOperationalGuide } from '@/hooks/useOperationalGuide';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';
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

function CategoryIcon({ id, className = 'h-4 w-4' }: { id: OperationalGuideTaskId; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  const shape = { stroke: 'currentColor', strokeWidth: 1.05 };
  const cote = { stroke: '#DC2626', strokeWidth: 0.95 };

  /** Desene tehnice măsurători — siluetă clară + cotă roșie. */
  const icons: Record<OperationalGuideTaskId, ReactNode> = {
    /* Blat L — plan bucătărie + cotă lungime / adâncime */
    blat: (
      <svg {...common}>
        <path {...shape} d="M3.5 6.5h12.5v4.5H9.5v7H3.5V6.5z" />
        <path {...shape} d="M6 6.5V5M13.5 6.5V5" />
        <path {...cote} d="M3.5 20.25h6" />
        <path {...cote} d="M3.5 19.1v2.3M9.5 19.1v2.3" />
        <path {...cote} d="M18 6.5v10.5" />
        <path {...cote} d="M16.75 6.5h2.5M16.75 17h2.5" />
      </svg>
    ),
    /* Placare — elevație panouri + cotă înălțime */
    placare: (
      <svg {...common}>
        <rect {...shape} x="4.5" y="3" width="11" height="18" rx="0.6" />
        <path {...shape} d="M4.5 9h11M4.5 15h11" />
        <path {...shape} d="M10 3v18" />
        <path {...cote} d="M18.75 3v18" />
        <path {...cote} d="M17.4 3h2.7M17.4 21h2.7" />
      </svg>
    ),
    /* Scară — profil trepte + cotă anvergură */
    scara: (
      <svg {...common}>
        <path
          {...shape}
          d="M3 19.5h4.25V15.5h4V11.5h4V7.5H19.5V4"
        />
        <path {...cote} d="M3 21.4h16.5" />
        <path {...cote} d="M3 20.15v2.5M19.5 20.15v2.5" />
      </svg>
    ),
    /* Șemineu — portal + nișă + cotă lățime */
    semineu: (
      <svg {...common}>
        <path {...shape} d="M4.5 20V9.25L12 3.75l7.5 5.5V20" />
        <path {...shape} d="M8.75 20v-5.75h6.5V20" />
        <path {...shape} d="M10.25 14.25h3.5" />
        <path {...cote} d="M4.5 21.5h15" />
        <path {...cote} d="M4.5 20.2v2.6M19.5 20.2v2.6" />
      </svg>
    ),
    /* Glaf — fereastră + pervaz + cotă lățime */
    glaf: (
      <svg {...common}>
        <rect {...shape} x="5.5" y="3.5" width="13" height="9.5" rx="0.5" />
        <path {...shape} d="M12 3.5v9.5" />
        <path {...shape} d="M5.5 8.25h13" />
        <path {...shape} d="M3.75 14.5h16.5" />
        <path {...shape} d="M4.75 14.5v2h14.5v-2" />
        <path {...cote} d="M3.75 19.75h16.5" />
        <path {...cote} d="M3.75 18.5v2.5M20.25 18.5v2.5" />
      </svg>
    ),
    /* Scări exterior — trepte + săgeată exterior + cotă */
    scara_exterior: (
      <svg {...common}>
        <path {...shape} d="M2.75 19.5h4.5V16h4.25v-3.5h4.25V9H20" />
        <path {...shape} d="M16.25 5.75l4-2.75" />
        <path {...shape} d="M20.25 3v3.25h-3.25" />
        <path {...cote} d="M2.75 21.35h14.5" />
        <path {...cote} d="M2.75 20.1v2.5M17.25 20.1v2.5" />
      </svg>
    ),
    /* Placare exterior — fațadă / parapet + cotă bază */
    placare_exterior: (
      <svg {...common}>
        <path {...shape} d="M3.75 20V8.75L12 3.5l8.25 5.25V20" />
        <path {...shape} d="M3.75 11.75h16.5" />
        <path {...shape} d="M7.75 11.75V20M16.25 11.75V20" />
        <path {...cote} d="M3.75 21.5h16.5" />
        <path {...cote} d="M3.75 20.2v2.6M20.25 20.2v2.6" />
      </svg>
    ),
  };

  return <>{icons[id]}</>;
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
  const phoneLayout = usePhoneLayout();
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? tasks[0],
    [tasks, activeId],
  );

  return (
    <>
      <nav
        aria-label="Tipuri măsurare"
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
      >
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
              aria-pressed={isActive}
              className={[
                'group relative w-full min-w-0 text-left overflow-hidden rounded-md border transition-all duration-200',
                phoneLayout
                  ? 'px-0.5 py-1.5 flex justify-center min-h-[44px]'
                  : 'px-0.5 py-1.5 flex flex-col items-center justify-center gap-0.5',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-gold focus-visible:ring-offset-1',
                isActive
                  ? 'border-corporate-black bg-corporate-black text-white shadow-sm'
                  : 'border-corporate-border/90 bg-white text-corporate-dark hover:border-corporate-gold/55 hover:bg-corporate-gold-light/15',
              ].join(' ')}
              aria-label={OPERATIONAL_GUIDE_LABELS[id]}
              title={OPERATIONAL_GUIDE_LABELS[id]}
            >
              <span
                className={[
                  'absolute left-0 top-0 bottom-0 w-[2px] transition-colors',
                  isActive ? 'bg-corporate-gold' : 'bg-transparent group-hover:bg-corporate-gold/50',
                ].join(' ')}
                aria-hidden
              />
              {phoneLayout ? (
                <span
                  className={[
                    'flex h-9 w-9 items-center justify-center',
                    isActive ? 'text-corporate-gold' : 'text-corporate-dark',
                  ].join(' ')}
                  aria-hidden
                >
                  <CategoryIcon id={id} className="h-7 w-7" />
                </span>
              ) : (
                <>
                  <span
                    className={[
                      'flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded transition-colors',
                      isActive
                        ? 'bg-white/10 text-corporate-gold'
                        : 'bg-corporate-surface text-corporate-muted group-hover:text-corporate-dark',
                    ].join(' ')}
                    aria-hidden
                  >
                    <CategoryIcon id={id} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <p
                    className={[
                      'text-[8px] sm:text-[9px] lg:text-[10px] font-semibold leading-tight tracking-tight text-center truncate max-w-full px-0.5',
                      isActive ? 'text-white' : 'text-corporate-dark',
                    ].join(' ')}
                  >
                    {OPERATIONAL_GUIDE_LABELS[id]}
                  </p>
                </>
              )}
              {!hasContent && (
                <span
                  className={[
                    'absolute right-0.5 bottom-0.5 h-1 w-1 rounded-full',
                    isActive ? 'bg-white/35' : 'bg-corporate-muted/35',
                  ].join(' ')}
                  aria-label="Conținut necompletat de HR"
                />
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
