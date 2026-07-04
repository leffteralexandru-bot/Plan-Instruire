import { useCallback, useMemo, useState } from 'react';
import type { FeedbackForm } from '@/types';
import { ALL_DAYS } from '@/data/trainingPlan';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/store/storage';
import { computeTraineeTrainingStats } from '@/lib/traineeProgressStats';
import {
  mentorSaveTraineeFeedback,
  mentorSetTraineeUnlock,
  mentorSetTraineeValidation,
} from '@/lib/mentorTraineeProgress';
import { ValidationList } from '@/components/mentor/ValidationList';
import { MentorFeedbackForm } from '@/components/mentor/FeedbackForm';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { PanelSubsection } from '@/components/ui/ProfessionalPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TraineeCohortExpandPanelProps {
  traineeId: string;
  onProgressChange?: () => void;
}

export function TraineeCohortExpandPanel({ traineeId, onProgressChange }: TraineeCohortExpandPanelProps) {
  const { user } = useAuth();
  const planWeeks = useTrainingPlan();
  const [refreshKey, setRefreshKey] = useState(0);

  const progress = useMemo(
    () => storage.getProgress(traineeId),
    [traineeId, refreshKey],
  );

  const stats = useMemo(
    () => computeTraineeTrainingStats(progress, planWeeks),
    [progress, planWeeks],
  );

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onProgressChange?.();
  }, [onProgressChange]);

  const lockedDays = stats.allDays.filter((d) => !stats.isUnlocked(d.id) && d.dayNumber > 1);

  const pendingValidations = ALL_DAYS.filter(
    (d) => d.requiresMentorValidation && !stats.getDayProgress(d.id).mentorValidated,
  ).length;

  const handleValidate = useCallback(
    (dayId: string, validated: boolean, notes?: string) => {
      if (!user) return;
      mentorSetTraineeValidation(traineeId, user, dayId, validated, notes);
      refresh();
    },
    [traineeId, user, refresh],
  );

  const handleUnlock = useCallback(
    (dayId: string) => {
      if (!user) return;
      mentorSetTraineeUnlock(traineeId, user, dayId, true);
      refresh();
    },
    [traineeId, user, refresh],
  );

  const feedbackWeek2 = progress.feedbacks.find((f) => f.weekNumber === 2);
  const feedbackWeek4 = progress.feedbacks.find((f) => f.weekNumber === 4);

  const handleSaveFeedback = useCallback(
    (feedback: FeedbackForm) => {
      if (!user) return;
      mentorSaveTraineeFeedback(traineeId, user, feedback);
      refresh();
    },
    [traineeId, user, refresh],
  );

  return (
    <div className="mt-2 space-y-4 rounded-lg border border-corporate-border/80 bg-corporate-surface/30 p-4">
      <PanelSubsection label="Progres general">
        <ProgressBar percent={stats.overallPercent} size="lg" label="Completare totală" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.weekProgress.map((w) => (
            <div
              key={w.weekNumber}
              className="rounded-xl bg-white/80 border border-corporate-border/50 p-3"
            >
              <p className="text-xs font-medium text-corporate-muted mb-2">Săpt. {w.weekNumber}</p>
              <ProgressBar percent={w.percent} size="sm" showPercent />
            </div>
          ))}
        </div>
        <p className="text-xs text-corporate-muted mt-2">
          {stats.completedDays}/{stats.totalDays} zile finalizate
        </p>
      </PanelSubsection>

      {lockedDays.length > 0 && (
        <PanelSubsection label="Deblocări manuale">
          <p className="text-xs text-corporate-muted mb-2">
            Override pentru zile blocate (absență, reprogramare)
          </p>
          <div className="flex flex-wrap gap-2">
            {lockedDays.slice(0, 8).map((d) => (
              <Button key={d.id} size="sm" variant="ghost" onClick={() => handleUnlock(d.id)}>
                Deblochează Ziua {d.dayNumber}
              </Button>
            ))}
          </div>
        </PanelSubsection>
      )}

      <PanelSubsection label="Validări instruire">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-corporate-dark">Zile cheie</span>
          {pendingValidations > 0 && (
            <Badge variant="warning">{pendingValidations} în așteptare</Badge>
          )}
        </div>
        <ValidationList
          days={ALL_DAYS}
          getDayProgress={stats.getDayProgress}
          onValidate={handleValidate}
        />
      </PanelSubsection>

      <PanelSubsection label="Rapoarte feedback">
        <p className="text-xs text-corporate-muted mb-4">
          Evaluare mentor Săpt. 2 și Săpt. 4 — salvate în dosarul acestui angajat și folosite la certificat.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <MentorFeedbackForm
            key={`${traineeId}-s2-${refreshKey}`}
            weekNumber={2}
            existing={feedbackWeek2}
            mentorName={user?.name ?? 'Mentor'}
            formIdPrefix={`${traineeId}-`}
            onSave={handleSaveFeedback}
          />
          <MentorFeedbackForm
            key={`${traineeId}-s4-${refreshKey}`}
            weekNumber={4}
            existing={feedbackWeek4}
            mentorName={user?.name ?? 'Mentor'}
            formIdPrefix={`${traineeId}-`}
            onSave={handleSaveFeedback}
          />
        </div>
      </PanelSubsection>
    </div>
  );
}
