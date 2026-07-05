import { Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { ReTrainingLessonView } from '@/components/retraining/ReTrainingLessonView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ingineriPath, INGINERI_ANGAJAT_PANEL_PATH } from '@/data/departments';
import { canViewReTrainingLesson, isReTrainingLessonReadOnly } from '@/lib/reTrainingAccess';
import { isSupervisorOf } from '@/lib/supervisor';
import { canManageUsers } from '@/lib/roles';

export function ReTrainingLessonPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();

  if (!user || !sessionId) return null;

  const session = trainingSystemStore.getSessionById(sessionId);
  if (!session) {
    return (
      <Card className="text-center py-12">
        <p className="text-corporate-muted">Sesiunea de re-instruire nu a fost găsită.</p>
        <Link to={INGINERI_ANGAJAT_PANEL_PATH} className="mt-4 inline-block">
          <Button variant="ghost">Înapoi</Button>
        </Link>
      </Card>
    );
  }

  if (!canViewReTrainingLesson(session, user)) {
    return <Navigate to={ingineriPath('/panou-angajat')} replace />;
  }

  const isSupervisor =
    session.supervisorId === user.id || isSupervisorOf(user.id, session.angajatId);
  const isHr = canManageUsers(user);

  const backLink = isHr
    ? ingineriPath('/admin') + '?tab=erori'
    : isSupervisor
      ? ingineriPath('/panou-supervizor')
      : INGINERI_ANGAJAT_PANEL_PATH;
  const backLabel = isHr
    ? '← Înapoi la validare erori'
    : isSupervisor
      ? '← Înapoi la panou supervizor'
      : '← Înapoi la panou angajat';

  return (
    <ReTrainingLessonView
      session={session}
      readOnly={isReTrainingLessonReadOnly(session, user)}
      backLink={backLink}
      backLabel={backLabel}
    />
  );
}
