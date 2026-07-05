import { Link } from 'react-router-dom';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ingineriPath } from '@/data/departments';
import { EVALUATION_STATUS_LABELS, hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { useAuth } from '@/hooks/useAuth';
import { EVALUATION_WEEK_LABELS } from '@/lib/evaluationWeekMentors';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { profileLinkedToMentor } from '@/lib/employeeMentorAssignments';
import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';

export function MentorSubordinatesPanel() {
  const { user } = useAuth();
  const { profiles } = useHrPerformance();
  const { filterProfiles } = useAccessControl();
  if (!user) return null;

  const rows = filterProfiles(profiles).filter((p) => profileLinkedToMentor(p, user.id));

  if (!rows.length) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Echipa mea — evaluări & dosare</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Angajații pe care i-ați instruit sau îi urmăriți — dosar, evaluări tri-lunale, istoric instruire.
      </p>
      <ul className="space-y-2">
        {rows.map((p) => {
          const ev = hrPerformanceStore.getCurrentEvaluation(p.userId);
          const weekTags = (p.weeklyEvalMentors ?? [])
            .filter((w) => w.mentorId === user.id)
            .map((w) => `S${w.weekNumber}`);
          const activeEnrollment = userStore.getActiveEnrollmentForAngajat(p.userId);
          const instructedByMe = activeEnrollment?.mentorId === user.id;
          const trainingFinished =
            storage.getProgress(p.userId).certificate ||
            userStore
              .getEnrollments()
              .some(
                (e) =>
                  e.angajatId === p.userId &&
                  e.mentorId === user.id &&
                  e.status === 'completed',
              );
          return (
            <li
              key={p.userId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-corporate-border px-3 py-2 text-sm"
            >
              <div>
                <strong className="text-corporate-dark">
                  {p.prenume} {p.nume}
                </strong>
                <span className="text-corporate-muted ml-2">{p.functie}</span>
                {weekTags.length > 0 && (
                  <p className="text-xs text-corporate-muted mt-1">
                    Mentor planificat: {weekTags.join(', ')} ({EVALUATION_WEEK_LABELS.length} săpt. totale)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {instructedByMe && !trainingFinished && (
                  <Badge variant="info">În instruire</Badge>
                )}
                {trainingFinished && instructedByMe && (
                  <Badge variant="success">Instruire finalizată</Badge>
                )}
                {ev && (
                  <>
                    <Badge variant={ev.status === 'intarziat' ? 'warning' : 'default'}>
                      {EVALUATION_STATUS_LABELS[ev.status]}
                    </Badge>
                    <span className="text-xs text-corporate-muted">{getEvaluationWorkflowLabel(ev)}</span>
                  </>
                )}
                <Link
                  to={ingineriPath(`/angajat/${p.userId}`)}
                  className="text-corporate-gold text-xs font-medium hover:underline"
                >
                  Deschide fișa →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
