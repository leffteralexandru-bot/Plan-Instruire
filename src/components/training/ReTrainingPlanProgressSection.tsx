import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { ReTrainingLessonView } from '@/components/retraining/ReTrainingLessonView';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { isReTrainingLessonReadOnly } from '@/lib/reTrainingAccess';
import { getReTrainingDay } from '@/lib/reTrainingLesson';
import { getReTrainingLessonProgress } from '@/lib/reTrainingLessonProgress';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import type { ReTrainingSession } from '@/types';

interface ReTrainingPlanProgressSectionProps {
  session: ReTrainingSession;
  angajatId: string;
  expanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onProgressChange?: () => void;
  headerAction?: React.ReactNode;
}

/** Bară separată de planul inițial — la expand arată doar lecția de re-instruire cu tot conținutul. */
export function ReTrainingPlanProgressSection({
  session,
  angajatId,
  expanded,
  onExpandedChange,
  onProgressChange,
  headerAction,
}: ReTrainingPlanProgressSectionProps) {
  const version = useTrainingSystemVersion();

  const live = useMemo(
    () => trainingSystemStore.getSessionById(session.id) ?? session,
    [session, version],
  );

  const progress = getReTrainingLessonProgress(live);
  const day = getReTrainingDay(live);
  const topic = live.topicTitle ?? day?.title ?? live.titlu;
  const isFinalized = normalizeReTrainingStatus(live.status) === 'finalizat';

  return (
    <ProfessionalPanel
      variant={isFinalized ? 'retraining-success' : 'retraining'}
      icon={isFinalized ? 'certificate' : 'retraining'}
      eyebrow={isFinalized ? 'Re-instruire · finalizată' : 'Re-instruire în curs'}
      title={topic}
      subtitle={
        isFinalized
          ? 'Instruire de succes — 1 lecție remediată'
          : `${progress.completedTasks} din ${progress.totalTasks} activități · ${progress.percent}%`
      }
      compact={!expanded}
      collapsible={!!onExpandedChange}
      expanded={expanded}
      onToggle={onExpandedChange ? () => onExpandedChange(!expanded) : undefined}
      headerAction={headerAction}
      collapsedPeek={
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[10rem] flex-1">
            <ProgressBar percent={progress.percent} size="sm" label="Progres lecție" />
          </div>
          {isFinalized && <Badge variant="success">Instruire de succes ✓</Badge>}
        </div>
      }
    >
      {!expanded && <ProgressBar percent={progress.percent} size="lg" label="Progres lecție" />}

      {expanded && (
        <ReTrainingLessonView
          session={live}
          readOnly={isReTrainingLessonReadOnly(live, { id: angajatId })}
          embedded
          hideHeader
          onProgressChange={onProgressChange}
        />
      )}
    </ProfessionalPanel>
  );
}
