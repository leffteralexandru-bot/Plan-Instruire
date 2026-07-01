import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MentorPanel } from '@/components/mentor/MentorPanel';
import { ingineriPath } from '@/data/departments';
import { useAccessControl } from '@/hooks/useAccessControl';

export function MentorPage() {
  const { loading } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  if (loading) return null;
  if (!canOpenMentorPanel) return <Navigate to={ingineriPath()} replace />;

  return <MentorPanel />;
}
