import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getDayById } from '@/data/trainingPlan';
import { INGINERI_PLAN_PATH, ingineriPath } from '@/data/departments';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { DayView } from '@/components/day/DayView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { canAccessTrainingPlanDashboard } from '@/lib/roles';

export function DayPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const { user, canAccessMentor, loading: authLoading } = useAuth();
  const { isDayUnlocked, visitDay, progress } = useProgress();

  const day = dayId ? getDayById(dayId) : undefined;

  const isMonitoringOtherTrainee =
    !!user &&
    canAccessMentor &&
    !!progress?.userId &&
    progress.userId !== user.id;

  useEffect(() => {
    if (day && !isMonitoringOtherTrainee) visitDay(day.id);
  }, [day, isMonitoringOtherTrainee, visitDay]);

  if (authLoading || !user) return null;

  if (!canAccessTrainingPlanDashboard(user)) {
    return <Navigate to={ingineriPath('/admin')} replace />;
  }

  if (!day) {
    return (
      <Card className="text-center py-12">
        <p className="text-corporate-muted">Ziua nu a fost găsită.</p>
        <Link to={INGINERI_PLAN_PATH} className="mt-4 inline-block">
          <Button variant="ghost">Înapoi la plan</Button>
        </Link>
      </Card>
    );
  }

  if (!isMonitoringOtherTrainee && !isDayUnlocked(day.id)) {
    return (
      <Card className="text-center py-12">
        <span className="text-4xl mb-4 block" aria-hidden>🔒</span>
        <h2 className="text-lg font-semibold text-corporate-dark">Zi blocată</h2>
        <p className="text-sm text-corporate-muted mt-2">
          Finalizați ziua anterioară pentru a debloca această zi.
        </p>
        <Link to={INGINERI_PLAN_PATH} className="mt-4 inline-block">
          <Button variant="primary">Înapoi la plan</Button>
        </Link>
      </Card>
    );
  }

  return <DayView day={day} readOnly={isMonitoringOtherTrainee} />;
}
