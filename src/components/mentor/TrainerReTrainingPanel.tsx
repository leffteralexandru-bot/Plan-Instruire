import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import {
  RE_TRAINING_STATUS_LABELS,
  canTrainerSubmitReport,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';

export function TrainerReTrainingPanel() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { uploadDocument, refresh } = useHrPerformance();
  const [, bump] = useState(0);

  const sessions = useMemo(() => {
    if (!user) return [];
    return trainingSystemStore
      .getReTrainingSessions()
      .filter((s) => (s.trainerId ?? s.mentorId) === user.id && canTrainerSubmitReport(s));
  }, [user, refresh]);

  if (!user || sessions.length === 0) return null;

  const onRefresh = () => {
    refresh();
    bump((n) => n + 1);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Re-instruire atribuită</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Sesiuni în care sunteți desemnat trainer — trimiteți raportul către supervizor.
      </p>
      <div className="space-y-4">
        {sessions.map((session) => (
          <TrainerSessionForm
            key={session.id}
            session={session}
            users={users}
            currentUserId={user.id}
            uploadDocument={uploadDocument}
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
  uploadDocument,
  onDone,
}: {
  session: ReturnType<typeof trainingSystemStore.getReTrainingSessions>[number];
  users: { id: string; name: string }[];
  currentUserId: string;
  uploadDocument: ReturnType<typeof useHrPerformance>['uploadDocument'];
  onDone: () => void;
}) {
  const profile = hrPerformanceStore.getProfile(session.angajatId);
  const angajatName = profile ? `${profile.prenume} ${profile.nume}` : session.angajatId;
  const status = normalizeReTrainingStatus(session.status);
  const [reportText, setReportText] = useState(session.trainerReport?.text ?? '');
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (reportText.trim().length < 20) {
      setMsg('Raportul necesită min. 20 caractere.');
      return;
    }
    const fileInput = document.getElementById(`mentor-report-${session.id}`) as HTMLInputElement;
    const file = fileInput?.files?.[0];
    let documentId: string | undefined;
    if (file) {
      const doc = await uploadDocument({
        file,
        tip: 're_instruire',
        angajatId: session.angajatId,
        uploadedBy: currentUserId,
        uploadedByNume: users.find((u) => u.id === currentUserId)?.name ?? '',
        reTrainingSessionId: session.id,
        folder: 'istoric_instruire',
      });
      documentId = doc.id;
    }
    const result = trainingSystemStore.submitTrainerReport(session.id, {
      text: reportText.trim(),
      submittedAt: new Date().toISOString(),
      submittedBy: currentUserId,
      submittedByName: users.find((u) => u.id === currentUserId)?.name ?? '',
      documentId,
    });
    if (result) {
      setMsg('Raport trimis supervizorului.');
      onDone();
    }
  };

  return (
    <div className="rounded-lg border border-corporate-border p-3 space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-medium text-corporate-dark">{angajatName}</p>
          <p className="text-xs text-corporate-muted">{session.topicTitle ?? session.titlu}</p>
        </div>
        <Badge variant="warning">{RE_TRAINING_STATUS_LABELS[status]}</Badge>
      </div>
      <p className="text-xs text-corporate-muted">
        Supervizor: {users.find((u) => u.id === session.supervisorId)?.name ?? '—'}
      </p>
      <textarea
        className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[72px]"
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        placeholder="Descrieți ce s-a instruit, progresul angajatului…"
      />
      <input
        type="file"
        id={`mentor-report-${session.id}`}
        className="text-xs block"
        accept=".pdf,.doc,.docx,.jpg,.png"
      />
      <Button type="button" variant="primary" size="sm" onClick={() => void handleSubmit()}>
        Trimite raport supervizorului
      </Button>
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </div>
  );
}
