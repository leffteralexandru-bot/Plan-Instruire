import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { reTrainingLessonPath } from '@/data/departments';
import {
  RE_TRAINING_STATUS_LABELS,
  canMentorViewAssignedSession,
  canTrainerSubmitReport,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import { RE_TRAINING_FLOW_SHELL } from '@/lib/reTrainingTheme';
import { useActionFocusEffect } from '@/hooks/useActionFocus';
import { actionFocusElementId, highlightActionElement } from '@/lib/actionFocus';
import type { TrainerReport } from '@/types';

export function TrainerReTrainingPanel() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { refresh } = useHrPerformance();
  const [, bump] = useState(0);

  const sessions = useMemo(() => {
    if (!user) return [];
    return trainingSystemStore
      .getReTrainingSessions()
      .filter((s) => canMentorViewAssignedSession(s, user.id));
  }, [user, refresh]);

  useActionFocusEffect(
    {
      retrain: () => {
        const sessionId = new URLSearchParams(window.location.search).get('session');
        if (!sessionId) return;
        highlightActionElement(actionFocusElementId('retrain', sessionId));
      },
    },
    [sessions.length],
  );

  if (!user || sessions.length === 0) return null;

  const onRefresh = () => {
    refresh();
    bump((n) => n + 1);
  };

  return (
    <Card className={RE_TRAINING_FLOW_SHELL}>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Re-instruire atribuită</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Lecțiile aprobate de HR pentru colegii pe care îi instruiți. După ce angajatul finalizează lecția,
        confirmați dacă a înțeles și scrieți explicația.
      </p>
      <div className="space-y-4">
        {sessions.map((session) => (
          <TrainerSessionForm
            key={session.id}
            session={session}
            users={users}
            currentUserId={user.id}
            onDone={onRefresh}
          />
        ))}
      </div>
    </Card>
  );
}

function TrainerSessionForm({
  session,
  users,
  currentUserId,
  onDone,
}: {
  session: ReturnType<typeof trainingSystemStore.getReTrainingSessions>[number];
  users: { id: string; name: string }[];
  currentUserId: string;
  onDone: () => void;
}) {
  const { uploadDocument } = useHrPerformance();
  const live = trainingSystemStore.getSessionById(session.id) ?? session;
  const profile = hrPerformanceStore.getProfile(live.angajatId);
  const angajatName = profile ? `${profile.prenume} ${profile.nume}` : live.angajatId;
  const status = normalizeReTrainingStatus(live.status);
  const awaitingMentor = canTrainerSubmitReport(live);
  const [comprehension, setComprehension] = useState<TrainerReport['comprehension']>('inteles');
  const [reportText, setReportText] = useState(live.trainerReport?.text ?? '');
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (!comprehension) {
      setMsg('Selectați dacă angajatul a înțeles lecția.');
      return;
    }
    if (reportText.trim().length < 20) {
      setMsg('Explicația necesită min. 20 caractere.');
      return;
    }
    const fileInput = document.getElementById(`mentor-report-${live.id}`) as HTMLInputElement;
    const file = fileInput?.files?.[0];
    let documentId: string | undefined;
    if (file) {
      const doc = await uploadDocument({
        file,
        tip: 're_instruire',
        angajatId: live.angajatId,
        uploadedBy: currentUserId,
        uploadedByNume: users.find((u) => u.id === currentUserId)?.name ?? '',
        reTrainingSessionId: live.id,
        folder: 'istoric_instruire',
        dayId: live.topicDayId,
      });
      documentId = doc.id;
    }
    const result = trainingSystemStore.submitTrainerReport(live.id, {
      text: reportText.trim(),
      comprehension,
      submittedAt: new Date().toISOString(),
      submittedBy: currentUserId,
      submittedByName: users.find((u) => u.id === currentUserId)?.name ?? '',
      documentId,
    });
    if (result) {
      setMsg('Confirmare salvată — re-instruire finalizată.');
      onDone();
    } else {
      setMsg('Nu s-a putut salva. Verificați că angajatul a finalizat lecția.');
    }
  };

  return (
    <div
      className="rounded-lg border border-corporate-border p-3 space-y-3"
      id={actionFocusElementId('retrain', live.id)}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-medium text-corporate-dark">{angajatName}</p>
          <p className="text-xs text-corporate-muted">{live.topicTitle ?? live.titlu}</p>
        </div>
        <Badge variant="warning">{RE_TRAINING_STATUS_LABELS[status]}</Badge>
      </div>

      <Link
        to={reTrainingLessonPath(live.id)}
        className="text-xs font-medium text-corporate-accent hover:underline inline-block"
      >
        Vezi lecția atribuită →
      </Link>

      {!live.traineeCompletedAt ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Așteptați ca <strong>{angajatName}</strong> să parcurgă lecția și să apese „Am finalizat
          re-instruirea”.
        </p>
      ) : awaitingMentor ? (
        <div className="space-y-3 border-t border-corporate-border/60 pt-3">
          <p className="text-xs text-emerald-800">
            Angajatul a finalizat lecția la{' '}
            {live.traineeCompletedAt
              ? new Date(live.traineeCompletedAt).toLocaleString('ro-RO')
              : '—'}
            . Confirmați înțelegerea:
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`comp-${live.id}`}
                checked={comprehension === 'inteles'}
                onChange={() => setComprehension('inteles')}
              />
              A înțeles lecția
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`comp-${live.id}`}
                checked={comprehension === 'neinteles'}
                onChange={() => setComprehension('neinteles')}
              />
              Nu a înțeles — necesită follow-up
            </label>
          </div>
          <textarea
            className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[80px]"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Explicație: ce a reținut, ce mai trebuie exersat, recomandări…"
          />
          <input
            type="file"
            id={`mentor-report-${live.id}`}
            className="text-xs block"
            accept=".pdf,.doc,.docx,.jpg,.png"
          />
          <Button type="button" variant="primary" size="sm" onClick={() => void handleSubmit()}>
            Confirmă și finalizează re-instruirea
          </Button>
        </div>
      ) : status === 'finalizat' ? (
        <p className="text-xs text-emerald-700">Re-instruire finalizată și arhivată.</p>
      ) : null}

      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </div>
  );
}
