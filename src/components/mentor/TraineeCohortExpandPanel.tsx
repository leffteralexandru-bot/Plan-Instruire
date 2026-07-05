import { useCallback, useMemo, useState } from 'react';
import type { FeedbackForm } from '@/types';
import { ALL_DAYS } from '@/data/trainingPlan';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { storage } from '@/store/storage';
import { computeTraineeTrainingStats } from '@/lib/traineeProgressStats';
import {
  mentorIssueCertificate,
  mentorSaveTraineeFeedback,
  mentorSetTraineeUnlock,
  mentorSetTraineeValidation,
} from '@/lib/mentorTraineeProgress';
import { ValidationList } from '@/components/mentor/ValidationList';
import { MentorFeedbackForm } from '@/components/mentor/FeedbackForm';
import { CertificateIssue } from '@/components/certificate/CertificateGenerator';
import { CertificateModal } from '@/components/certificate/CertificateModal';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { PanelSubsection } from '@/components/ui/ProfessionalPanel';
import { actionFocusElementId } from '@/lib/actionFocus';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ViewAsEmployeeBar } from '@/components/shared/ViewAsEmployeeBar';

interface TraineeCohortExpandPanelProps {
  traineeId: string;
  onProgressChange?: () => void;
}

export function TraineeCohortExpandPanel({ traineeId, onProgressChange }: TraineeCohortExpandPanelProps) {
  const { user } = useAuth();
  const { visibleTrainees } = useUsers();
  const planWeeks = useTrainingPlan();
  const [refreshKey, setRefreshKey] = useState(0);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const traineeName = visibleTrainees.find((t) => t.id === traineeId)?.name ?? 'Angajat';

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
  const trainingComplete = stats.completedDays >= stats.totalDays && stats.totalDays > 0;
  const day20Validated = stats.getDayProgress('day-20').mentorValidated;

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
      <ViewAsEmployeeBar angajatId={traineeId} angajatName={traineeName} compact />
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

      <div id={actionFocusElementId('validations', traineeId)}>
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
      </div>

      {(trainingComplete || progress.certificate) && (
        <PanelSubsection label="Certificat finalizare">
          {progress.certificate ? (
            <>
              <p className="text-xs text-emerald-700 mb-3">
                Certificat digital emis — angajatul poate descărca PDF-ul din planul de instruire.
              </p>
              <Button type="button" size="sm" variant="secondary" onClick={() => setCertificateOpen(true)}>
                Vizualizează certificat
              </Button>
              <CertificateModal
                certificate={progress.certificate}
                angajatId={traineeId}
                open={certificateOpen}
                onClose={() => setCertificateOpen(false)}
              />
            </>
          ) : (
            <>
              <p className="text-xs text-corporate-muted mb-3">
                Instruirea este finalizată. Emiteți certificatul digital oficial artGRANIT pentru acest angajat.
              </p>
              {!day20Validated && (
                <p className="text-xs text-amber-700 mb-3">
                  Recomandat: validați mai întâi Ziua 20 în secțiunea „Validări instruire”.
                </p>
              )}
              <CertificateIssue
                stagiarName={traineeName}
                mentorName={user?.name ?? 'Mentor'}
                progress={progress}
                onIssue={() => {
                  if (!user) return;
                  mentorIssueCertificate(traineeId, user, {
                    mentorName: user.name,
                    stagiarName: traineeName,
                  });
                  refresh();
                }}
              />
            </>
          )}
        </PanelSubsection>
      )}

      <PanelSubsection label="Rapoarte feedback">
        <p className="text-xs text-corporate-muted mb-4">
          Evaluare mentor Săpt. 2 și Săpt. 4 — salvate în dosarul acestui angajat și folosite la certificat.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div id={actionFocusElementId('feedback', traineeId, '2')}>
          <MentorFeedbackForm
            key={`${traineeId}-s2-${refreshKey}`}
            weekNumber={2}
            existing={feedbackWeek2}
            mentorName={user?.name ?? 'Mentor'}
            formIdPrefix={`${traineeId}-`}
            onSave={handleSaveFeedback}
          />
          </div>
          <div id={actionFocusElementId('feedback', traineeId, '4')}>
          <MentorFeedbackForm
            key={`${traineeId}-s4-${refreshKey}`}
            weekNumber={4}
            existing={feedbackWeek4}
            mentorName={user?.name ?? 'Mentor'}
            formIdPrefix={`${traineeId}-`}
            onSave={handleSaveFeedback}
          />
          </div>
        </div>
      </PanelSubsection>
    </div>
  );
}
