import { ALL_DAYS } from '@/data/trainingPlan';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useNotifications } from '@/hooks/useNotifications';
import { ValidationList } from './ValidationList';
import { MentorFeedbackForm } from './FeedbackForm';
import { TraineeSelector } from './TraineeSelector';
import { MentorCohortDashboard } from './MentorCohortDashboard';
import { useStagiarSelection } from '@/context/StagiarContext';
import { WeekProgressOverview } from '@/components/dashboard/ProgressBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function MentorPanel() {
  const { user } = useAuth();
  const {
    getDayProgress,
    setMentorValidation,
    setMentorUnlock,
    saveFeedback,
    stats,
    progress,
    isDayUnlocked,
  } = useProgress();

  useNotifications();

  const { setSelectedStagiarId } = useStagiarSelection();
  const feedbackWeek2 = progress?.feedbacks.find((f) => f.weekNumber === 2);
  const feedbackWeek4 = progress?.feedbacks.find((f) => f.weekNumber === 4);

  const pendingValidations = ALL_DAYS.filter(
    (d) => d.requiresMentorValidation && !getDayProgress(d.id).mentorValidated,
  ).length;

  const lockedDays = ALL_DAYS.filter((d) => !isDayUnlocked(d.id) && d.dayNumber > 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Panou Mentor</h1>
        <p className="text-corporate-muted mt-1">Monitorizare progres · Validări · Feedback</p>
      </div>

      <TraineeSelector />

      <MentorCohortDashboard onSelectTrainee={setSelectedStagiarId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Progres general" value={`${stats.overallPercent}%`} />
        <StatCard label="Zile finalizate" value={`${stats.completedDays}/${stats.totalDays}`} />
        <StatCard label="Validări pending" value={String(pendingValidations)} highlight={pendingValidations > 0} />
      </div>

      <WeekProgressOverview weekProgress={stats.weekProgress} overallPercent={stats.overallPercent} />

      {lockedDays.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-corporate-dark mb-3">Deblocări manuale</h2>
          <p className="text-sm text-corporate-muted mb-3">Override pentru zile blocate (absență, reprogramare)</p>
          <div className="flex flex-wrap gap-2">
            {lockedDays.slice(0, 5).map((d) => (
              <Button key={d.id} size="sm" variant="ghost" onClick={() => setMentorUnlock(d.id, true)}>
                Deblochează Ziua {d.dayNumber}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-corporate-dark">Validări Zile Cheie</h2>
          {pendingValidations > 0 && <Badge variant="warning">{pendingValidations} pending</Badge>}
        </div>
        <ValidationList days={ALL_DAYS} getDayProgress={getDayProgress} onValidate={setMentorValidation} />
      </section>

      {progress && progress.auditLog.length > 0 && (
        <Card padding="sm">
          <h2 className="font-semibold text-corporate-dark mb-2">Audit trail (recent)</h2>
          <ul className="text-xs text-corporate-muted space-y-1 max-h-32 overflow-y-auto">
            {[...progress.auditLog].reverse().slice(0, 8).map((a) => (
              <li key={a.id}>
                {new Date(a.createdAt).toLocaleString('ro-RO')} — {a.action} — {a.actorName}
                {a.details ? `: ${a.details}` : ''}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-corporate-dark">Rapoarte Feedback</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <MentorFeedbackForm weekNumber={2} existing={feedbackWeek2} mentorName={user?.name ?? 'Mentor'} onSave={saveFeedback} />
          <MentorFeedbackForm weekNumber={4} existing={feedbackWeek4} mentorName={user?.name ?? 'Mentor'} onSave={saveFeedback} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card padding="sm">
      <p className="text-xs font-medium text-corporate-muted uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-amber-600' : 'text-corporate-dark'}`}>{value}</p>
    </Card>
  );
}
