import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MentorPanel } from '@/components/mentor/MentorPanel';
import { ingineriPath } from '@/data/departments';

export function MentorPage() {
  const { isMentor, isAdmin } = useAuth();

  if (!isMentor && !isAdmin) return <Navigate to={ingineriPath()} replace />;

  return <MentorPanel />;
}
