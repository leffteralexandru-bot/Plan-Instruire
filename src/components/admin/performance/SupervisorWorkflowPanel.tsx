import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { trainingSystemStore, getBaseTrainingTopics } from '@/lib/trainingSystemStore';
import { hrPerformanceStore, ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import {
  RE_TRAINING_STATUS_LABELS,
  canHrConfirm,
  canSupervisorConfirm,
  canSupervisorPlan,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import { getSupervisedEmployeeIds, isSupervisorOf } from '@/lib/supervisor';
import { canManageUsers } from '@/lib/roles';
import { SupervisorErrorRegistrationPanel } from '@/components/shared/SupervisorErrorRegistrationPanel';
import type { ReTrainingSession } from '@/types';

function SessionCard({
  session,
  users,
  mentors,
  isHr,
  currentUserId,
  onRefresh,
}: {
  session: ReTrainingSession;
  users: { id: string; name: string }[];
  mentors: { id: string; name: string }[];
  isHr: boolean;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { uploadDocument } = useHrPerformance();
  const profile = hrPerformanceStore.getProfile(session.angajatId);
  const angajatName = profile ? `${profile.prenume} ${profile.nume}` : session.angajatId;
  const status = normalizeReTrainingStatus(session.status);
  const errors = hrPerformanceStore
    .getErrorCases({ angajatId: session.angajatId })
    .filter((e) => session.errorCaseIds.includes(e.id));

  const [topicDayId, setTopicDayId] = useState(session.topicDayId ?? '');
  const [trainerId, setTrainerId] = useState(session.trainerId ?? '');
  const [reportText, setReportText] = useState(session.trainerReport?.text ?? '');
  const [msg, setMsg] = useState('');

  const topics = getBaseTrainingTopics(profile?.departamentId ?? 'ingineri');
  const isSupervisor = isSupervisorOf(currentUserId, session.angajatId) || isHr;
  const isTrainer = (session.trainerId ?? session.mentorId) === currentUserId;

  const handlePlan = () => {
    if (!topicDayId || !trainerId) {
      setMsg('Selectați tema și trainerul.');
      return;
    }
    const topic = topics.find((t) => t.dayId === topicDayId);
    const result = trainingSystemStore.planReTrainingBySupervisor(session.id, {
      topicDayId,
      topicTitle: topic?.title ?? topicDayId,
      trainerId,
      supervisorId: session.supervisorId,
    });
    if (result) {
      setMsg('Planificare salvată. Trainerul a fost notificat.');
      onRefresh();
    }
  };

  const handleTrainerReport = async () => {
    if (reportText.trim().length < 20) {
      setMsg('Raportul necesită min. 20 caractere.');
      return;
    }
    const fileInput = document.getElementById(`report-${session.id}`) as HTMLInputElement;
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
      onRefresh();
    }
  };

  const handleSupervisorConfirm = () => {
    const result = trainingSystemStore.confirmBySupervisor(session.id, session.supervisorId);
    if (result) {
      setMsg('Confirmat. HR va primi notificare pentru validare finală.');
      onRefresh();
    }
  };

  const handleHrConfirm = () => {
    const user = users.find((u) => u.id === currentUserId);
    if (!user) return;
    const result = trainingSystemStore.confirmByHr(session.id, { id: user.id, name: user.name });
    if (result) {
      setMsg('Instruire confirmată. Angajatul revine la status normal.');
      onRefresh();
    }
  };

  return (
    <Card padding="sm" className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-semibold text-corporate-dark">{angajatName}</p>
          <p className="text-xs text-corporate-muted">{session.titlu}</p>
        </div>
        <Badge variant={status === 'finalizat' ? 'success' : 'warning'}>
          {RE_TRAINING_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="text-xs text-corporate-muted space-y-1">
        <p>
          Supervizor: {users.find((u) => u.id === session.supervisorId)?.name ?? '—'}
          {session.trainerId && (
            <> · Trainer: {users.find((u) => u.id === session.trainerId)?.name}</>
          )}
        </p>
        <p>Motiv: {ERROR_MOTIV_LABELS[session.errorMotiv]} · Termen: {session.termenLimita}</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs">
          <p className="font-medium text-amber-900 mb-1">Erori relevante ({errors.length})</p>
          {errors.slice(0, 3).map((e) => (
            <p key={e.id} className="text-amber-800">
              {e.data}: {e.descriere.slice(0, 100)}
            </p>
          ))}
        </div>
      )}

      {canSupervisorPlan(session) && isSupervisor && (
        <div className="grid gap-2 sm:grid-cols-2 border-t border-corporate-border pt-3">
          <label className="block text-sm">
            <span className="text-corporate-muted text-xs">Temă din planul de bază</span>
            <select
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
              value={topicDayId}
              onChange={(e) => setTopicDayId(e.target.value)}
            >
              <option value="">Selectați…</option>
              {topics.map((t) => (
                <option key={t.dayId} value={t.dayId}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-corporate-muted text-xs">Cine instruiește</span>
            <select
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">Selectați trainer…</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="button" variant="primary" size="sm" onClick={handlePlan}>
              Planifică re-instruirea
            </Button>
          </div>
        </div>
      )}

      {isTrainer && (status === 'planificat' || status === 'in_curs') && (
        <div className="border-t border-corporate-border pt-3 space-y-2">
          <p className="text-sm font-medium text-corporate-dark">Raport instruire (trainer)</p>
          {session.topicTitle && (
            <p className="text-xs text-corporate-muted">Temă: {session.topicTitle}</p>
          )}
          <textarea
            className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[72px]"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Descrieți ce s-a instruit, progresul angajatului…"
          />
          <input type="file" id={`report-${session.id}`} className="text-xs" accept=".pdf,.doc,.docx,.jpg,.png" />
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleTrainerReport()}>
            Trimite raport supervizorului
          </Button>
        </div>
      )}

      {session.trainerReport && (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <p className="font-medium text-corporate-dark">Raport trainer</p>
          <p className="text-corporate-muted mt-1">{session.trainerReport.text}</p>
          <p className="text-xs text-corporate-muted mt-1">
            {session.trainerReport.submittedByName} ·{' '}
            {new Date(session.trainerReport.submittedAt).toLocaleString('ro-RO')}
          </p>
        </div>
      )}

      {canSupervisorConfirm(session) && isSupervisor && (
        <Button type="button" variant="primary" size="sm" onClick={handleSupervisorConfirm}>
          Confirmă instruirea (supervizor)
        </Button>
      )}

      {canHrConfirm(session) && isHr && (
        <Button type="button" variant="primary" size="sm" onClick={handleHrConfirm}>
          OK HR — angajat instruit, revine la normal
        </Button>
      )}

      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </Card>
  );
}

interface SupervisorWorkflowPanelProps {
  /** Ascunde înregistrarea erorilor când e afișată deja în altă secțiune */
  hideErrorRegistration?: boolean;
}

export function SupervisorWorkflowPanel({ hideErrorRegistration }: SupervisorWorkflowPanelProps = {}) {
  const { user } = useAuth();
  const { mentors, users } = useUsers();
  const { refresh } = useHrPerformance();
  const isHr = !!user && canManageUsers(user);

  const sessions = useMemo(() => {
    const all = trainingSystemStore.getReTrainingSessions();
    if (!user) return [];
    if (isHr) return all.filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
    const supervised = getSupervisedEmployeeIds(user.id);
    const asTrainer = all.filter((s) => (s.trainerId ?? s.mentorId) === user.id);
    const asSupervisor = all.filter(
      (s) => supervised.includes(s.angajatId) || s.supervisorId === user.id,
    );
    const merged = [...asSupervisor, ...asTrainer];
    const seen = new Set<string>();
    return merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return normalizeReTrainingStatus(s.status) !== 'finalizat';
    });
  }, [user, isHr, refresh]);

  const pendingHr = useMemo(
    () =>
      isHr
        ? trainingSystemStore
            .getReTrainingSessions()
            .filter((s) => normalizeReTrainingStatus(s.status) === 'confirmat_supervizor')
        : [],
    [isHr, refresh],
  );

  if (!user) return null;

  return (
    <div className="space-y-4">
      {!hideErrorRegistration && <SupervisorErrorRegistrationPanel allowAllEmployees={isHr} />}

      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Flux Supervizor — Re-instruire</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Eroare repetată → alertă supervizor → planificare temă + trainer → raport → confirmare
          supervizor → OK HR → istoric angajat.
        </p>

        {sessions.length === 0 ? (
          <p className="text-sm text-corporate-muted">Nicio sesiune activă de re-instruire.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                users={users}
                mentors={mentors}
                isHr={isHr}
                currentUserId={user.id}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </Card>

      {isHr && pendingHr.length > 0 && (
        <Card className="border-corporate-gold/30 bg-corporate-gold-light/20">
          <h3 className="font-semibold text-corporate-dark mb-2">
            Așteaptă confirmare HR ({pendingHr.length})
          </h3>
          <div className="space-y-3">
            {pendingHr.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                users={users}
                mentors={mentors}
                isHr
                currentUserId={user.id}
                onRefresh={refresh}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
