import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { TrainingPlanTree } from '@/components/training/TrainingPlanTree';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { ProgressProvider, useProgress } from '@/hooks/useProgress';

interface EmployeeActiveTrainingBodyProps {
  angajatId: string;
  onOpenPlan: () => void;
}

function ActiveTrainingContent({ onOpenPlan }: { onOpenPlan: () => void }) {
  const plan = useTrainingPlan();
  const { stats, isDayComplete, isDayUnlocked, getResumeDay } = useProgress();
  const [expanded, setExpanded] = useState(false);
  const resumeDay = getResumeDay();

  return (
    <ProfessionalPanel
      variant="training"
      icon="training"
      eyebrow="Plan activ · 4 săptămâni"
      title="Continuați instruirea inițială"
      subtitle={`${stats.completedDays}/${stats.totalDays} zile · ${stats.overallPercent}%`}
      collapsible
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      toggleLabels={{
        expanded: 'Restrânge planul',
        collapsed: 'Deschide structura planului',
      }}
      headerAction={
        <Button type="button" variant="secondary" size="sm" onClick={onOpenPlan}>
          Plan complet →
        </Button>
      }
      collapsedPeek={
        resumeDay ? (
          <p className="text-sm text-corporate-muted">
            Continuați de la Ziua {resumeDay.dayNumber} — {resumeDay.title}
          </p>
        ) : undefined
      }
    >
      {expanded && (
        <div className="space-y-4">
          <ProgressBar percent={stats.overallPercent} size="lg" label="Completare totală" />
          <TrainingPlanTree
            plan={plan}
            isDayComplete={isDayComplete}
            isDayUnlocked={isDayUnlocked}
          />
        </div>
      )}
    </ProfessionalPanel>
  );
}

/** Instruire inițială în curs — panou imbricat în extinderea din Panou Angajat. */
export function EmployeeActiveTrainingBody({ angajatId, onOpenPlan }: EmployeeActiveTrainingBodyProps) {
  return (
    <ProgressProvider userId={angajatId}>
      <ActiveTrainingContent onOpenPlan={onOpenPlan} />
    </ProgressProvider>
  );
}
