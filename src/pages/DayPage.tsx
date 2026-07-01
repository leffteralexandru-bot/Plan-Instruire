import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDayById } from '@/data/trainingPlan';
import { ingineriPath } from '@/data/departments';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { DayView } from '@/components/day/DayView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function DayPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const { user, isMentor, isAdmin, loading: authLoading } = useAuth();
  const { isDayUnlocked, visitDay } = useProgress();
  const canViewAny = isMentor || isAdmin;

  const day = dayId ? getDayById(dayId) : undefined;

  useEffect(() => {
    if (day && !canViewAny) visitDay(day.id);
  }, [day, canViewAny, visitDay]);

  if (authLoading || !user) return null;

  if (!day) {
    return (
      <Card className="text-center py-12">
        <p className="text-corporate-muted">Ziua nu a fost găsită.</p>
        <Link to={ingineriPath()} className="mt-4 inline-block">
          <Button variant="ghost">Înapoi la Dashboard</Button>
        </Link>
      </Card>
    );
  }

  if (!canViewAny && !isDayUnlocked(day.id)) {
    return (
      <Card className="text-center py-12">
        <span className="text-4xl mb-4 block" aria-hidden>🔒</span>
        <h2 className="text-lg font-semibold text-corporate-dark">Zi blocată</h2>
        <p className="text-sm text-corporate-muted mt-2">
          Finalizați ziua anterioară pentru a debloca această zi.
        </p>
        <Link to={ingineriPath()} className="mt-4 inline-block">
          <Button variant="primary">Înapoi la Dashboard</Button>
        </Link>
      </Card>
    );
  }

  return <DayView day={day} readOnly={canViewAny} />;
}
