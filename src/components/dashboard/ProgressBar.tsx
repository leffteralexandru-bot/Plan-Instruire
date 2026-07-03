import { PanelSubsection, ProfessionalPanel } from '@/components/ui/ProfessionalPanel';

interface ProgressBarProps {
  percent: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
}

export function ProgressBar({ percent, label, size = 'md', showPercent = true }: ProgressBarProps) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

  return (
    <div className="space-y-1.5">
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showPercent && <span className="text-corporate-muted tabular-nums">{percent}%</span>}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full bg-gradient-to-r from-corporate-gold to-corporate-gold-hover transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

interface WeekProgressOverviewProps {
  weekProgress: { weekNumber: number; percent: number }[];
  overallPercent: number;
}

export function WeekProgressOverview({ weekProgress, overallPercent }: WeekProgressOverviewProps) {
  return (
    <ProfessionalPanel
      variant="training"
      icon="chart"
      eyebrow="Instruire în curs"
      title="Progres general"
      subtitle="Plan 4 săptămâni · 20 zile de instruire la angajare"
    >
      <ProgressBar percent={overallPercent} size="lg" label="Completare totală" />

      <PanelSubsection label="Progres pe săptămâni">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {weekProgress.map((w) => (
            <div key={w.weekNumber} className="rounded-xl bg-white/80 border border-corporate-border/50 p-3">
              <p className="text-xs font-medium text-corporate-muted mb-2">Săpt. {w.weekNumber}</p>
              <ProgressBar percent={w.percent} size="sm" showPercent />
            </div>
          ))}
        </div>
      </PanelSubsection>
    </ProfessionalPanel>
  );
}
