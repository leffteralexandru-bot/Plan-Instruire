import type { WeekPlan } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { TrainingPlanTree } from '@/components/training/TrainingPlanTree';
import { PanelSubsection, ProfessionalPanel } from '@/components/ui/ProfessionalPanel';

interface InitialTrainingPlanProgressSectionProps {
  totalDays: number;
  weekProgress: { weekNumber: number; percent: number }[];
  overallPercent: number;
  plan: WeekPlan[];
  isDayComplete: (dayId: string) => boolean;
  isDayUnlocked: (dayId: string) => boolean;
  certificateIssued?: boolean;
  onOpenCertificate?: () => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

/** Instruire inițială finalizată — la expand arată planul complet pe 4 săptămâni (ca re-instruirea). */
export function InitialTrainingPlanProgressSection({
  totalDays,
  weekProgress,
  overallPercent,
  plan,
  isDayComplete,
  isDayUnlocked,
  certificateIssued,
  onOpenCertificate,
  expanded,
  onExpandedChange,
}: InitialTrainingPlanProgressSectionProps) {
  return (
    <ProfessionalPanel
      variant="training-success"
      icon="certificate"
      eyebrow="Instruire inițială · finalizată"
      title={`Program de ${totalDays} zile complet`}
      subtitle={
        certificateIssued
          ? 'Certificat emis — urmează evaluarea tri-lunară de performanță'
          : 'Toate zilele sunt finalizate — așteptați certificatul de la mentor'
      }
      compact={!expanded}
      collapsible
      expanded={expanded}
      onToggle={() => onExpandedChange(!expanded)}
      headerAction={
        <div className="flex flex-wrap gap-2">
          {certificateIssued && onOpenCertificate && (
            <Button type="button" variant="secondary" size="sm" onClick={onOpenCertificate}>
              Certificat
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            onClick={() => onExpandedChange(!expanded)}
          >
            {expanded ? 'Închide planul' : 'Instruire de succes ✓'}
          </Button>
        </div>
      }
      collapsedPeek={
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[10rem] flex-1">
            <ProgressBar percent={overallPercent} size="sm" label="Completare totală" />
          </div>
          <Badge variant="success">Instruire de succes ✓</Badge>
        </div>
      }
    >
      {!expanded && <ProgressBar percent={overallPercent} size="lg" label="Completare totală" />}

      {expanded && (
        <PanelSubsection label="Plan 4 săptămâni · structură completă">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weekProgress.map((w) => (
                <div
                  key={w.weekNumber}
                  className="rounded-xl bg-white/80 border border-corporate-border/50 p-3"
                >
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
