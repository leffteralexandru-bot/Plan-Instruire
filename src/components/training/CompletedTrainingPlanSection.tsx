import type { WeekPlan } from '@/types';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { TrainingPlanTree } from '@/components/training/TrainingPlanTree';
import { PanelSubsection, ProfessionalPanel } from '@/components/ui/ProfessionalPanel';

interface CompletedTrainingPlanSectionProps {
  weekProgress: { weekNumber: number; percent: number }[];
  overallPercent: number;
  totalDays: number;
  plan: WeekPlan[];
  isDayComplete: (dayId: string) => boolean;
  isDayUnlocked: (dayId: string) => boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function CompletedTrainingPlanSection({
  weekProgress,
  overallPercent,
  totalDays,
  plan,
  isDayComplete,
  isDayUnlocked,
  expanded,
  onExpandedChange,
}: CompletedTrainingPlanSectionProps) {
  return (
    <ProfessionalPanel
      variant="training"
      icon="chart"
      eyebrow="Progres general"
      title={expanded ? 'Plan de instruire · structură completă' : 'Plan 4 săptămâni · instruire'}
      subtitle={`${totalDays} zile · ${overallPercent}% complet${expanded ? 'are totală' : ''}`}
      compact={!expanded}
      collapsible
      expanded={expanded}
      onToggle={() => onExpandedChange(!expanded)}
      collapsedPeek={
        <ProgressBar percent={overallPercent} size="sm" label="Completare totală" />
      }
    >
      <ProgressBar percent={overallPercent} size="lg" label="Completare totală" />

      {expanded && (
        <PanelSubsection label="Săptămâni & zile parcurse">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weekProgress.map((w) => (
                <div key={w.weekNumber} className="rounded-xl bg-white/80 border border-corporate-border/50 p-3">
                  <p className="text-xs font-medium text-corporate-muted mb-2">Săpt. {w.weekNumber}</p>
                  <ProgressBar percent={w.percent} size="sm" showPercent />
                </div>
              ))}
            </div>
            <TrainingPlanTree
              plan={plan}
              isDayComplete={isDayComplete}
              isDayUnlocked={isDayUnlocked}
            />
          </div>
        </PanelSubsection>
      )}
    </ProfessionalPanel>
  );
}
