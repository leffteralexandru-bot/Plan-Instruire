import { useState } from 'react';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { ResumeCard } from './ResumeCard';
import { TrainingPlanTree } from '@/components/training/TrainingPlanTree';
import { TrainingCompleteCard } from '@/components/training/TrainingCompleteCard';
import { CompletedTrainingPlanSection } from '@/components/training/CompletedTrainingPlanSection';
import { WeekProgressOverview } from './ProgressBar';
import { CertificateModal } from '@/components/certificate/CertificateModal';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import type { TestingZoneId } from '@/lib/testingStageGuide';

interface DashboardViewProps {
  title?: string;
  zoneId?: TestingZoneId;
}

export function DashboardView({
  title = 'Plan de Instruire',
  zoneId = 'zone-plan-dashboard',
}: DashboardViewProps = {}) {
  const plan = useTrainingPlan();
  const { user } = useAuth();
  const { stats, isDayComplete, isDayUnlocked, getDayProgress, getResumeDay, progress } = useProgress();
  const resumeDay = getResumeDay();
  const trainingFinished = stats.completedDays >= stats.totalDays && stats.totalDays > 0;
  const certificate = progress?.certificate;
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(false);

  return (
    <TestingHighlightZone zoneId={zoneId}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark tracking-tight">
            {title}
          </h1>
          <p className="text-corporate-muted mt-1">
            {stats.completedDays} din {stats.totalDays} zile finalizate · {stats.completedTasks} activități
            bifate
          </p>
        </div>

        {trainingFinished && certificate ? (
          <div className="space-y-4">
            <TrainingCompleteCard
              totalDays={stats.totalDays}
              certificateIssued
              showPlanLink={false}
              onOpenCertificate={() => setCertificateOpen(true)}
            />
            <CompletedTrainingPlanSection
              weekProgress={stats.weekProgress}
              overallPercent={stats.overallPercent}
              totalDays={stats.totalDays}
              plan={plan}
              isDayComplete={isDayComplete}
              isDayUnlocked={isDayUnlocked}
              expanded={planExpanded}
              onExpandedChange={setPlanExpanded}
            />
          </div>
        ) : trainingFinished ? (
          <TrainingCompleteCard
            totalDays={stats.totalDays}
            certificateIssued={!!certificate}
            showPlanLink={false}
            onOpenCertificate={certificate ? () => setCertificateOpen(true) : undefined}
          />
        ) : (
          resumeDay && (
            <ResumeCard
              day={resumeDay}
              completedTasks={getDayProgress(resumeDay.id).completedTasks.length}
              totalTasks={resumeDay.tasks.length}
            />
          )
        )}

        {!(trainingFinished && certificate) && (
          <>
            <WeekProgressOverview weekProgress={stats.weekProgress} overallPercent={stats.overallPercent} />

            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-corporate-dark">
                Structură modulară — săptămâni & zile
              </h2>
              <TrainingPlanTree
                plan={plan}
                isDayComplete={isDayComplete}
                isDayUnlocked={isDayUnlocked}
              />
            </div>
          </>
        )}

        {certificate && user && (
          <CertificateModal
            certificate={certificate}
            angajatId={progress?.userId ?? user.id}
            open={certificateOpen}
            onClose={() => setCertificateOpen(false)}
          />
        )}
      </div>
    </TestingHighlightZone>
  );
}
