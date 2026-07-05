import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import { getBaseTrainingTopics, trainingSystemStore } from '@/lib/trainingSystemStore';
import { todayLocalIso } from '@/lib/errorCaseWorkflow';
import { formatEvaluationShortDate } from '@/lib/evaluationDisplay';
import { userStore } from '@/lib/userStore';
import {
  buildErrorReTrainingGroups,
  type ErrorReTrainingGroup,
} from '@/lib/errorReTrainingDisplay';
import {
  RE_TRAINING_STATUS_LABELS,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import { ingineriPath, reTrainingLessonPath, type DepartmentId } from '@/data/departments';
import type { ErrorCase, User } from '@/types';
import { RE_TRAINING_FLOW_SHELL } from '@/lib/reTrainingTheme';
import { actionFocusElementId, highlightActionElement } from '@/lib/actionFocus';

function resolveUserName(id: string | undefined, users: User[]): string {
  if (!id) return '—';
  return userStore.getUserById(id)?.name ?? users.find((u) => u.id === id)?.name ?? 'Nesetat';
}

function mentorOptionsFor(angajatId: string, proposedTrainerId?: string): User[] {
  const base = userStore.getMentorCandidates(angajatId);
  if (!proposedTrainerId || base.some((u) => u.id === proposedTrainerId)) return base;
  const proposed = userStore.getUserById(proposedTrainerId);
  return proposed ? [proposed, ...base] : base;
}

function GroupCard({
  group,
  profiles,
  users,
  userId,
  userName,
  onRefresh,
  onRefreshUsers,
  downloadDocument,
}: {
  group: ErrorReTrainingGroup;
  profiles: { userId: string; prenume: string; nume: string; departamentId: DepartmentId }[];
  users: User[];
  userId: string;
  userName: string;
  onRefresh: () => void;
  onRefreshUsers: () => void;
  downloadDocument: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overrides, setOverrides] = useState<
    Record<string, { topicDayId: string; topicTitle: string; trainerId: string; plannedStartDate: string }>
  >({});
  const [rejectNote, setRejectNote] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const profile = profiles.find((p) => p.userId === group.angajatId);
  const angajatName = profile
    ? `${profile.prenume} ${profile.nume}`
    : users.find((u) => u.id === group.angajatId)?.name ?? group.angajatId;
  const topics = getBaseTrainingTopics(profile?.departamentId ?? 'ingineri');
  const session = group.session;
  const sessionStatus = session ? normalizeReTrainingStatus(session.status) : undefined;

  useEffect(() => {
    const errorId = new URLSearchParams(window.location.search).get('error');
    if (!errorId || !group.errors.some((e) => e.id === errorId)) return;
    setExpanded(true);
    highlightActionElement(actionFocusElementId('error', errorId));
  }, [group.errors]);

  const getOverride = (err: ErrorCase) => {
    const p = err.reTrainingProposal!;
    const key = `${group.angajatId}-${err.id}`;
    return (
      overrides[key] ?? {
        topicDayId: p.topicDayId,
        topicTitle: p.topicTitle,
        trainerId: p.trainerId,
        plannedStartDate:
          p.plannedStartDate && p.plannedStartDate >= todayLocalIso()
            ? p.plannedStartDate
            : todayLocalIso(),
      }
    );
  };

  const handleApproveGroup = () => {
    const err = group.errors[0];
    if (!err?.reTrainingProposal) return;
    const ov = getOverride(err);
    const block = trainingSystemStore.getApproveErrorBlockReason({
      angajatId: group.angajatId,
      errorCaseIds: group.errors.map((e) => e.id),
      topicDayId: ov.topicDayId,
      topicTitle: ov.topicTitle,
      trainerId: ov.trainerId,
      plannedStartDate: ov.plannedStartDate,
    });
    if (block) {
      setErrorMsg(block);
      return;
    }
    setBusy(true);
    setErrorMsg('');
    try {
      const result = trainingSystemStore.approveErrorSubmissionsByHr({
        angajatId: group.angajatId,
        errorCaseIds: group.errors.map((e) => e.id),
        hrUser: { id: userId, name: userName },
        topicDayId: ov.topicDayId,
        topicTitle: ov.topicTitle,
        trainerId: ov.trainerId,
        plannedStartDate: ov.plannedStartDate,
      });
      if (!result) {
        setErrorMsg('Nu s-a putut confirma. Reîncărcați pagina.');
        return;
      }
      setMsg('Confirmat — angajatul și mentorul pot începe re-instruirea.');
      onRefresh();
      onRefreshUsers();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = (errorId: string) => {
    const result = trainingSystemStore.rejectErrorSubmissionByHr(
      errorId,
      { id: userId, name: userName },
      rejectNote,
    );
    if (result) {
      setMsg('Respinse către supervizor.');
      onRefresh();
      return;
    }
    setErrorMsg('Nu s-a putut respinge.');
  };

  const firstErr = group.errors[0];
  const ov = firstErr ? getOverride(firstErr) : null;
  const trainers = firstErr ? mentorOptionsFor(group.angajatId, firstErr.reTrainingProposal?.trainerId) : [];
  const focusErrorId =
    group.errors.find((e) => e.id === new URLSearchParams(window.location.search).get('error'))?.id ??
    (group.pendingHr ? firstErr?.id : undefined);

  return (
    <div
      className="rounded-xl border border-corporate-border bg-white overflow-hidden"
      id={focusErrorId ? actionFocusElementId('error', focusErrorId) : undefined}
    >
      <button
        type="button"
        className="w-full text-left p-4 hover:bg-corporate-surface/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="font-semibold text-corporate-dark">{group.topicTitle}</p>
            <p className="text-sm text-corporate-muted">
              {angajatName} · {group.errors.length}{' '}
              {group.errors.length === 1 ? 'eroare' : 'erori'} pe aceeași temă
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {group.pendingHr ? (
                <Badge variant="warning">Așteaptă confirmare HR</Badge>
              ) : sessionStatus ? (
                <Badge variant={sessionStatus === 'finalizat' ? 'success' : 'info'}>
                  {RE_TRAINING_STATUS_LABELS[sessionStatus]}
                </Badge>
              ) : null}
              {group.errors.map((e) => (
                <Badge key={e.id} variant="default">
                  {ERROR_MOTIV_LABELS[e.motiv]}
                </Badge>
              ))}
            </div>
          </div>
          <span className="text-xs text-corporate-accent shrink-0">
            {expanded ? 'Ascunde ▲' : 'Detalii ▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-corporate-border/60 pt-3">
          <ul className="space-y-2 text-sm">
            {group.errors.map((err) => (
              <li key={err.id} className="rounded-lg bg-corporate-surface/40 px-3 py-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>
                    {err.data ? formatEvaluationShortDate(err.data) : '—'} · {ERROR_MOTIV_LABELS[err.motiv]}
                  </span>
                  {err.signedDocumentId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void downloadDocument(err.signedDocumentId!)}
                    >
                      Nota de constatare
                    </Button>
                  )}
                </div>
                {err.descriere && (
                  <p className="text-xs text-corporate-muted mt-1">{err.descriere}</p>
                )}
              </li>
            ))}
          </ul>

          {group.pendingHr && firstErr?.reTrainingProposal && ov && (
            <div className="grid gap-2 sm:grid-cols-2 border-t border-corporate-border/50 pt-3">
              <label className="block text-xs text-corporate-muted">
                Lecție
                <select
                  className="mt-1 w-full rounded-lg border border-corporate-border px-2 py-1.5 text-sm"
                  value={ov.topicDayId}
                  onChange={(e) => {
                    const topic = topics.find((t) => t.dayId === e.target.value);
                    const key = `${group.angajatId}-${firstErr.id}`;
                    setOverrides((prev) => ({
                      ...prev,
                      [key]: {
                        ...ov,
                        topicDayId: e.target.value,
                        topicTitle: topic?.title ?? e.target.value,
                      },
                    }));
                  }}
                >
                  {topics.map((t) => (
                    <option key={t.dayId} value={t.dayId}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-corporate-muted">
                Mentor
                <select
                  className="mt-1 w-full rounded-lg border border-corporate-border px-2 py-1.5 text-sm"
                  value={ov.trainerId}
                  onChange={(e) => {
                    const key = `${group.angajatId}-${firstErr.id}`;
                    setOverrides((prev) => ({
                      ...prev,
                      [key]: { ...ov, trainerId: e.target.value },
                    }));
                  }}
                >
                  {trainers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  onClick={handleApproveGroup}
                >
                  {busy ? 'Se confirmă…' : `Confirmă ${group.errors.length > 1 ? 'grupul' : 'eroarea'}`}
                </Button>
                <input
                  className="text-xs flex-1 min-w-[120px] rounded border border-corporate-border px-2 py-1.5"
                  placeholder="Motiv respingere"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleReject(firstErr.id)}
                >
                  Respinge
                </Button>
              </div>
            </div>
          )}

          {session && !group.pendingHr && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-corporate-border/50">
              <Link to={reTrainingLessonPath(session.id)}>
                <Button type="button" variant="secondary" size="sm">
                  Vezi lecția re-instruire
                </Button>
              </Link>
              <Link to={ingineriPath(`/angajat/${group.angajatId}`)}>
                <Button type="button" variant="ghost" size="sm">
                  Dosar angajat →
                </Button>
              </Link>
              {session.trainerId && (
                <span className="text-xs text-corporate-muted self-center">
                  Mentor: {resolveUserName(session.trainerId, users)}
                </span>
              )}
            </div>
          )}

          {msg && <p className="text-xs text-emerald-700">{msg}</p>}
          {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}

export function HrErrorReTrainingPanel() {
  const { user } = useAuth();
  const { profiles, errorCases, refresh, downloadDocument } = useHrPerformance();
  const { users, refresh: refreshUsers } = useUsers();

  const groups = useMemo(() => buildErrorReTrainingGroups(errorCases), [errorCases]);
  const pendingCount = groups.filter((g) => g.pendingHr).length;

  if (groups.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Erori + re-instruirea lor</h2>
        <p className="text-sm text-corporate-muted">
          Nicio eroare în flux de re-instruire. După confirmarea supervizorului, erorile apar aici grupate pe
          temă de instruire.
        </p>
      </Card>
    );
  }

  return (
    <Card className={RE_TRAINING_FLOW_SHELL}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Erori + re-instruirea lor</h2>
          <p className="text-sm text-corporate-muted mt-1">
            Grupate pe temă de instruire · {groups.length}{' '}
            {groups.length === 1 ? 'grup' : 'grupuri'}
            {pendingCount > 0 && ` · ${pendingCount} de confirmat`}
          </p>
        </div>
        {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending HR</Badge>}
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <GroupCard
            key={group.key}
            group={group}
            profiles={profiles}
            users={users}
            userId={user?.id ?? ''}
            userName={user?.name ?? ''}
            onRefresh={refresh}
            onRefreshUsers={refreshUsers}
            downloadDocument={downloadDocument}
          />
        ))}
      </div>
    </Card>
  );
}
