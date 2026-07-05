import { Link } from 'react-router-dom';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { reTrainingLessonPath, reTrainingPlanPath } from '@/data/departments';
import {
  COMPREHENSION_LABELS,
  normalizeReTrainingStatus,
  RE_TRAINING_STATUS_LABELS,
  isReTrainingVisibleToTrainee,
} from '@/lib/reTrainingWorkflow';
import { getErrorsForSession } from '@/lib/errorReTrainingDisplay';
import { userStore } from '@/lib/userStore';
import type { ReTrainingSession } from '@/types';
import { formatEvaluationShortDate } from '@/lib/evaluationDisplay';

interface EmployeeReTrainingCardProps {
  session: ReTrainingSession;
  mentorName?: string;
  onOpenNota?: (documentId: string) => void;
  compact?: boolean;
  /** Panou angajat — același format ca instruirea inițială (100%, footer) */
  summaryLayout?: boolean;
  /** Navigare la plan fără expand automat */
  onOpenInPlan?: (sessionId: string) => void;
  /** Angajat: deschide în planul de instruire; HR/supervizor: lecție dedicată */
  detailInPlan?: boolean;
  /** Supervizor/HR: planul subordonatului (viewAs) */
  planViewAsAngajatId?: string;
}

export function EmployeeReTrainingCard({
  session,
  mentorName,
  onOpenNota,
  compact,
  summaryLayout,
  onOpenInPlan,
  detailInPlan = true,
  planViewAsAngajatId,
}: EmployeeReTrainingCardProps) {
  const status = normalizeReTrainingStatus(session.status);
  const isFinalized = status === 'finalizat';
  const isActive = isReTrainingVisibleToTrainee(session) || (status === 'in_curs' && !isFinalized);
  const linkedErrors = getErrorsForSession(session);
  const notaDocId =
    linkedErrors.map((e) => e.signedDocumentId).find(Boolean) ??
    linkedErrors.map((e) => e.documentId).find(Boolean);

  const trainer =
    mentorName ??
    userStore.getUserById(session.trainerId ?? session.mentorId)?.name ??
    '—';

  const title = session.topicTitle ?? session.titlu;
  const finalizedDate = session.finalizatLa
    ? formatEvaluationShortDate(session.finalizatLa.slice(0, 10))
    : undefined;

  const detailPath = detailInPlan
    ? reTrainingPlanPath(session.id, planViewAsAngajatId)
    : reTrainingLessonPath(session.id);

  const retrainSuccessButton = isFinalized ? (
    onOpenInPlan ? (
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="bg-orange-600 hover:bg-orange-700 border-orange-600"
        onClick={() => onOpenInPlan(session.id)}
      >
        Re-instruire de succes
      </Button>
    ) : (
      <Link to={detailPath}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 border-orange-600"
        >
          Re-instruire de succes
        </Button>
      </Link>
    )
  ) : null;

  const successButton = isFinalized ? (
    onOpenInPlan ? (
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="bg-orange-600 hover:bg-orange-700 border-orange-600"
        onClick={() => onOpenInPlan(session.id)}
      >
        Instruire de succes ✓
      </Button>
    ) : (
      <Link to={detailPath}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 border-orange-600"
        >
          Instruire de succes ✓
        </Button>
      </Link>
    )
  ) : (
    <Link to={detailPath}>
      <Button type="button" variant="secondary" size="sm">
        {session.traineeCompletedAt ? 'Vezi lecția' : 'Deschide lecția →'}
      </Button>
    </Link>
  );

  if (isFinalized && summaryLayout) {
    return (
      <ProfessionalPanel
        variant="retraining-success"
        icon="certificate"
        eyebrow="Re-instruire finalizată"
        title={title}
        subtitle={`Finalizată${finalizedDate ? ` · ${finalizedDate}` : ''} · Mentor: ${trainer}`}
        headerAction={retrainSuccessButton}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
          <div>
            <p className="text-3xl font-bold text-orange-900">100%</p>
            <p className="text-xs text-orange-900/85 mt-1">
              Lecție remediată cu succes — deschideți planul pentru a vedea detaliile acestei re-instruiri.
            </p>
          </div>
          {notaDocId && onOpenNota && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 whitespace-nowrap self-start pt-1"
              onClick={() => onOpenNota(notaDocId)}
            >
              Nota de constatare
            </Button>
          )}
        </div>
      </ProfessionalPanel>
    );
  }

  return (
    <ProfessionalPanel
      variant={isFinalized ? 'retraining-success' : 'retraining'}
      icon={isFinalized ? 'certificate' : 'retraining'}
      eyebrow={isFinalized ? 'Re-instruire finalizată' : 'Remediere competențe'}
      title={title}
      subtitle={
        isFinalized
          ? `Finalizată${finalizedDate ? ` · ${finalizedDate}` : ''} · Mentor: ${trainer}`
          : `Mentor: ${trainer}`
      }
      badge={
        <Badge variant={isFinalized ? 'success' : 'warning'}>
          {RE_TRAINING_STATUS_LABELS[status]}
        </Badge>
      }
      headerAction={
        <div className="flex flex-wrap gap-2">
          {notaDocId && onOpenNota && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenNota(notaDocId)}>
              Nota de constatare
            </Button>
          )}
          {successButton}
        </div>
      }
      className={compact ? '' : undefined}
    >
      {!compact && (
        <div className="space-y-2 text-sm">
          {linkedErrors.length > 0 && (
            <p className="text-xs text-corporate-muted">
              {linkedErrors.length} {linkedErrors.length === 1 ? 'eroare legată' : 'erori legate'}
            </p>
          )}
          {session.traineeCompletedAt && !isFinalized && (
            <p className="text-xs text-emerald-700">
              Lecție parcursă — așteptați confirmarea mentorului.
            </p>
          )}
          {session.trainerReport && (
            <div className="rounded-lg bg-white/70 border border-emerald-100 px-3 py-2 text-xs">
              <p className="font-medium text-corporate-dark">
                {COMPREHENSION_LABELS[session.trainerReport.comprehension ?? 'inteles']}
              </p>
              <p className="text-corporate-muted mt-1 whitespace-pre-wrap">{session.trainerReport.text}</p>
            </div>
          )}
          {isActive && !session.traineeCompletedAt && (
            <p className="text-xs text-amber-800">
              Parcurgeți lecția aleasă (ca la instruirea inițială, dar doar această temă).
            </p>
          )}
        </div>
      )}
    </ProfessionalPanel>
  );
}
