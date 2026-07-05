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
  canHrApprovePlan,
  canSupervisorConfirm,
  canSupervisorPlan,
  errorCasesHaveSignedNota,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import { SupervisorCompletedReTrainingPanel } from '@/components/supervisor/SupervisorCompletedReTrainingPanel';
import { isSupervisorOf } from '@/lib/supervisor';
import { getSupervisorActiveReTrainingSessions } from '@/lib/supervisorReTraining';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { canManageUsers } from '@/lib/roles';
import { userStore } from '@/lib/userStore';
import { SupervisorErrorRegistrationPanel } from '@/components/shared/SupervisorErrorRegistrationPanel';
import { ErrorCaseSignedNotaUpload } from '@/components/shared/ErrorCaseSignedNotaUpload';
import { RE_TRAINING_FLOW_SHELL } from '@/lib/reTrainingTheme';
import { useActionFocusEffect } from '@/hooks/useActionFocus';
import { actionFocusElementId, highlightActionElement } from '@/lib/actionFocus';
import type { ReTrainingSession } from '@/types';

function SessionCard({
  session,
  users,
  currentUserId,
  onRefresh,
}: {
  session: ReTrainingSession;
  users: { id: string; name: string }[];
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { uploadDocument } = useHrPerformance();
  const { user } = useAuth();
  const isHr = !!user && canManageUsers(user);
  const profile = hrPerformanceStore.getProfile(session.angajatId);
  const angajatName = profile ? `${profile.prenume} ${profile.nume}` : session.angajatId;
  const status = normalizeReTrainingStatus(session.status);
  const errors = hrPerformanceStore
    .getErrorCases({ angajatId: session.angajatId })
    .filter((e) => session.errorCaseIds.includes(e.id));

  const [topicDayId, setTopicDayId] = useState(session.topicDayId ?? '');
  const [trainerId, setTrainerId] = useState(session.trainerId ?? '');
  const [supplementaryNote, setSupplementaryNote] = useState('');
  const [reportText, setReportText] = useState(session.trainerReport?.text ?? '');
  const [msg, setMsg] = useState('');

  const topics = getBaseTrainingTopics(profile?.departamentId ?? 'ingineri');
  const isSupervisor = isSupervisorOf(currentUserId, session.angajatId) || isHr;
  const isTrainer = (session.trainerId ?? session.mentorId) === currentUserId;
  const signedNotasOk = errorCasesHaveSignedNota(errors);

  const trainerCandidates = useMemo(() => {
    const base = userStore.getMentorCandidates(session.angajatId);
    const supervisor = users.find((u) => u.id === session.supervisorId);
    if (supervisor && !base.some((u) => u.id === supervisor.id)) {
      return [userStore.getUserById(supervisor.id)!, ...base].filter(Boolean);
    }
    return base;
  }, [session.angajatId, session.supervisorId, users]);

  const handlePlan = async () => {
    if (!topicDayId || !trainerId) {
      setMsg('Selectați tema din planul de bază și mentorul/trainerul.');
      return;
    }
    if (!signedNotasOk) {
      setMsg('Încărcați notele semnate pentru toate erorile legate înainte de trimitere.');
      return;
    }
    const topic = topics.find((t) => t.dayId === topicDayId);
    const fileInput = document.getElementById(`supp-${session.id}`) as HTMLInputElement;
    const files = fileInput?.files;
    const supplementaryDocumentIds: string[] = [];
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const doc = await uploadDocument({
          file,
          tip: 're_instruire',
          angajatId: session.angajatId,
          uploadedBy: currentUserId,
          uploadedByNume: users.find((u) => u.id === currentUserId)?.name ?? '',
          reTrainingSessionId: session.id,
          folder: 'istoric_instruire',
          dayId: topicDayId,
        });
        supplementaryDocumentIds.push(doc.id);
      }
    }
    const result = trainingSystemStore.planReTrainingBySupervisor(session.id, {
      topicDayId,
      topicTitle: topic?.title ?? topicDayId,
      trainerId,
      supervisorId: session.supervisorId,
      supplementaryDocumentIds,
      supplementaryNote: supplementaryNote.trim() || undefined,
    });
    if (result) {
      setMsg('Re-instruire trimisă la HR pentru aprobare. Mentorul și angajatul vor fi notificați după OK HR.');
      onRefresh();
    } else {
      setMsg('Nu s-a putut trimite. Verificați notele semnate și câmpurile obligatorii.');
    }
  };

  const handleHrApprove = () => {
    const user = users.find((u) => u.id === currentUserId);
    if (!user) return;
    const result = trainingSystemStore.approveReTrainingPlanByHr(session.id, {
      id: user.id,
      name: user.name,
    });
    if (result) {
      setMsg('Plan aprobat. Mentorul și angajatul pot începe re-instruirea.');
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
      comprehension: 'inteles',
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
      setMsg('Re-instruire finalizată și arhivată.');
      onRefresh();
    }
  };

  return (
    <Card padding="sm" className="space-y-3" id={actionFocusElementId('retrain', session.id)}>
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
        {session.hrGroupedByName && (
          <p>
            Grupată de HR: {session.hrGroupedByName}
            {session.errorCaseIds.length > 1 ? ` · ${session.errorCaseIds.length} erori` : ''}
          </p>
        )}
        <p>
          Supervizor: {users.find((u) => u.id === session.supervisorId)?.name ?? '—'}
          {session.trainerId && (
            <> · Trainer: {users.find((u) => u.id === session.trainerId)?.name}</>
          )}
        </p>
        <p>Motiv: {ERROR_MOTIV_LABELS[session.errorMotiv]} · Termen: {session.termenLimita}</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs space-y-2">
          <p className="font-medium text-amber-900">
            Erori legate ({errors.length}) — încărcați nota semnată pentru fiecare
          </p>
          {errors.map((e) => (
            <ErrorCaseSignedNotaUpload
              key={e.id}
              errorCase={e}
              angajatName={angajatName}
              compact
              onUploaded={onRefresh}
            />
          ))}
        </div>
      )}

      {canSupervisorPlan(session) && isSupervisor && (
        <div className="grid gap-2 sm:grid-cols-2 border-t border-corporate-border pt-3">
          {!signedNotasOk && (
            <p className="sm:col-span-2 text-xs text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5">
              Pas obligatoriu: încărcați scanul notei semnate cu angajatul înainte de trimiterea la HR.
            </p>
          )}
          <label className="block text-sm">
            <span className="text-corporate-muted text-xs">Temă din instruirea de bază *</span>
            <select
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
              value={topicDayId}
              onChange={(e) => setTopicDayId(e.target.value)}
            >
              <option value="">Selectați ziua / tema…</option>
              {topics.map((t) => (
                <option key={t.dayId} value={t.dayId}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-corporate-muted text-xs">Mentor / trainer *</span>
            <select
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">Selectați mentor…</option>
              {trainerCandidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {trainerCandidates.length === 0 && (
              <p className="text-xs text-amber-700 mt-1">
                Nu există colegi disponibili. Cereți HR să confirme profilele angajaților activi.
              </p>
            )}
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-corporate-muted text-xs">
              Informații suplimentare (dacă tema din plan nu acoperă situația)
            </span>
            <textarea
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[56px]"
              value={supplementaryNote}
              onChange={(e) => setSupplementaryNote(e.target.value)}
              placeholder="Ex.: accent pe procedura X, material suplimentar…"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-corporate-muted text-xs">Materiale adiționale (PDF, imagini)</span>
            <input
              type="file"
              id={`supp-${session.id}`}
              className="mt-1 block text-xs"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="button" variant="primary" size="sm" onClick={() => void handlePlan()}>
              Înregistrează re-instruire & trimite la HR
            </Button>
          </div>
        </div>
      )}

      {status === 'asteapta_hr' && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Așteaptă aprobare HR. Mentorul și angajatul vor vedea sesiunea după confirmare.
        </p>
      )}

      {canHrApprovePlan(session) && isHr && (
        <Button type="button" variant="primary" size="sm" onClick={handleHrApprove}>
          OK HR — aprobă re-instruirea (notifică mentor + angajat)
        </Button>
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
          Confirmă finalizarea re-instruirii
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
  const { users } = useUsers();
  const { refresh } = useHrPerformance();
  const trainingVersion = useTrainingSystemVersion();
  const isHr = !!user && canManageUsers(user);

  const sessions = useMemo(() => {
    if (!user) return [];
    if (isHr) {
      return trainingSystemStore
        .getReTrainingSessions()
        .filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
    }
    return getSupervisorActiveReTrainingSessions(user.id);
  }, [user, isHr, refresh, trainingVersion]);

  const pendingHr = useMemo(
    () =>
      isHr
        ? trainingSystemStore
            .getReTrainingSessions()
            .filter((s) => normalizeReTrainingStatus(s.status) === 'asteapta_hr')
        : [],
    [isHr, refresh],
  );

  useActionFocusEffect(
    {
      retrain: () => {
        const sessionId = new URLSearchParams(window.location.search).get('session');
        if (!sessionId) return;
        highlightActionElement(actionFocusElementId('retrain', sessionId));
      },
    },
    [sessions.length, pendingHr.length],
  );

  if (!user) return null;

  return (
    <div className="space-y-4">
      {!hideErrorRegistration && <SupervisorErrorRegistrationPanel allowAllEmployees={isHr} />}

      <Card className={RE_TRAINING_FLOW_SHELL}>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Flux Supervizor — Re-instruire</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Sesiuni active — dispar de aici când mentorul confirmă finalizarea. Arhiva este mai jos.
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
                currentUserId={user.id}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </Card>

      <SupervisorCompletedReTrainingPanel />

      {isHr && pendingHr.length > 0 && (
        <Card className="border-corporate-gold/30 bg-corporate-gold-light/20">
          <h3 className="font-semibold text-corporate-dark mb-2">
            Re-instruiri de aprobat ({pendingHr.length})
          </h3>
          <div className="space-y-3">
            {pendingHr.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                users={users}
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
