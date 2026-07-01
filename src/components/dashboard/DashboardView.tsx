import { TRAINING_PLAN } from '@/data/trainingPlan';
import { useProgress } from '@/hooks/useProgress';
import { WeekProgressOverview } from './ProgressBar';
import { WeekCard } from './WeekCard';
import { ResumeCard } from './ResumeCard';

export function DashboardView() {
  const { stats, isDayComplete, isDayUnlocked, getDayProgress, getResumeDay } = useProgress();
  const resumeDay = getResumeDay();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark tracking-tight">
          Plan de Instruire
        </h1>
        <p className="text-corporate-muted mt-1">
          {stats.completedDays} din {stats.totalDays} zile finalizate · {stats.completedTasks} activități bifate
        </p>
      </div>

      {resumeDay && (
        <ResumeCard
          day={resumeDay}
          completedTasks={getDayProgress(resumeDay.id).completedTasks.length}
          totalTasks={resumeDay.tasks.length}
        />
      )}

      <WeekProgressOverview weekProgress={stats.weekProgress} overallPercent={stats.overallPercent} />

      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-corporate-dark">Module pe Săptămâni</h2>
        {TRAINING_PLAN.map((week) => (
          <WeekCard
            key={week.id}
            week={week}
            isDayComplete={isDayComplete}
            isDayUnlocked={isDayUnlocked}
            getDayProgress={getDayProgress}
          />
        ))}
      </div>
    </div>
  );
}
