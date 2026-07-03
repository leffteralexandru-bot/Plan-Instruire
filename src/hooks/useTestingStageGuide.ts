import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { resolveTestingStageGuide } from '@/lib/testingStageGuide';

/** Re-calculează la navigare și la schimbări în evaluări (progres instruire se vede la refresh/navigare). */
export function useTestingStageGuide() {
  const { user } = useAuth();
  const { evaluations } = useHrPerformance();
  const location = useLocation();

  void evaluations;
  void location.pathname;

  return resolveTestingStageGuide(user);
}
