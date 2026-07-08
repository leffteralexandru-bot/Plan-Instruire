import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { ResumeCard } from './ResumeCard';
import { TrainingPlanTree } from '@/components/training/TrainingPlanTree';
import { ReTrainingPlanSection } from '@/components/training/ReTrainingPlanSection';
import { RE_TRAINING_FLOW_SHELL } from '@/lib/reTrainingTheme';
import { WeekProgressOverview } from './ProgressBar';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import { INGINERI_ANGAJAT_PANEL_PATH } from '@/data/departments';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import type { TestingZoneId } from '@/lib/testingStageGuide';
import { DesktopPageHeader } from '@/components/layout/DesktopPageHeader';
import { DesktopPageIntro } from '@/components/layout/DesktopPageIntro';

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
  const [searchParams] = useSearchParams();
  const viewAsParam = searchParams.get('viewAs');
  const angajatId = viewAsParam ?? progress?.userId ?? user?.id;
  const resumeDay = getResumeDay();
  const trainingFinished = stats.completedDays >= stats.totalDays && stats.totalDays > 0;

  const hasActiveRetraining = useMemo(() => {
    if (!angajatId) return false;
    return trainingSystemStore
      .getReTrainingSessions({ angajatId })
      .some((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
  }, [angajatId]);

  const showActiveInitialPlan = !trainingFinished;
  const showEmptyState = trainingFinished && !hasActiveRetraining;

  return (
    <TestingHighlightZone zoneId={zoneId}>
      <div className="space-y-6">
        <div>
          <DesktopPageHeader>
            <h1 className="text-2xl font-bold tracking-tight text-corporate-dark @md:text-3xl">
              {title}
            </h1>
          </DesktopPageHeader>
          {showActiveInitialPlan ? (
            <DesktopPageIntro>
              {stats.completedDays} din {stats.totalDays} zile finalizate · {stats.completedTasks}{' '}
              activități bifate
            </DesktopPageIntro>
          ) : (
            <DesktopPageIntro>
              Doar instruirile în curs — parcursul finalizat este în Panou Angajat.
            </DesktopPageIntro>
          )}
        </div>

        {showEmptyState && (
          <div className="rounded-xl border border-dashed border-corporate-border bg-corporate-surface/40 px-4 py-5 text-sm text-corporate-muted leading-relaxed">
            Nu aveți instruiri active în acest moment. Instruirea inițială finalizată, certificatele
            și arhiva le găsiți în{' '}
            <Link to={INGINERI_ANGAJAT_PANEL_PATH} className="text-corporate-gold font-medium hover:underline">
              Panou Angajat
            </Link>
            .
          </div>
        )}

        {showActiveInitialPlan && resumeDay && (
          <ResumeCard
            day={resumeDay}
            completedTasks={getDayProgress(resumeDay.id).completedTasks.length}
            totalTasks={resumeDay.tasks.length}
          />
        )}

        {showActiveInitialPlan && (
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

        {angajatId && hasActiveRetraining && (
          <div className={`rounded-xl border p-3 ${RE_TRAINING_FLOW_SHELL}`}>
            <ReTrainingPlanSection angajatId={angajatId} activeOnly />
          </div>
        )}
      </div>
    </TestingHighlightZone>
  );
}
