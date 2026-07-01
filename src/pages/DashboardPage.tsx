import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarName } from '@/hooks/useStagiarId';
import { useCanSelectStagiar } from '@/context/StagiarContext';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { DepartmentPlanBanner } from '@/components/departments/DepartmentPlanBanner';
import { ingineriPath } from '@/data/departments';

export function DashboardPage() {
  const { isMentor, isAdmin, loading, user } = useAuth();
  const stagiarName = useStagiarName();
  const canSelect = useCanSelectStagiar();

  if (loading || !user) return null;

  return (
    <div>
      <DepartmentPlanBanner />
      {canSelect && <TraineeSelector />}
      {(isMentor || isAdmin) && (
        <div className="mb-6 rounded-xl border border-corporate-gold/30 bg-corporate-gold-light/50 px-4 py-3 text-sm text-corporate-stone">
          Vizualizați progresul stagiarului <strong>{stagiarName}</strong>. Accesați{' '}
          <Link to={ingineriPath('/mentor')} className="font-medium underline">Panoul Mentor</Link> pentru validări.
        </div>
      )}
      <DashboardView />
    </div>
  );
}
