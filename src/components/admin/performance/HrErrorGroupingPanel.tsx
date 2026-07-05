import { useMemo, useState } from 'react';
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
import type { ErrorCase, User } from '@/types';

function groupByAngajat(cases: ErrorCase[]): Map<string, ErrorCase[]> {
  const map = new Map<string, ErrorCase[]>();
  for (const c of cases) {
    const list = map.get(c.angajatId) ?? [];
    list.push(c);
    map.set(c.angajatId, list);
  }
  return map;
}

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] text-sm">
      <dt className="text-corporate-muted">{label}</dt>
      <dd className="text-corporate-dark">{value || '—'}</dd>
    </div>
  );
}

export function HrErrorGroupingPanel() {
  const { user } = useAuth();
  const { profiles, errorCases, refresh, downloadDocument } = useHrPerformance();
  const { users, refresh: refreshUsers } = useUsers();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [overrides, setOverrides] = useState<
    Record<string, { topicDayId: string; topicTitle: string; trainerId: string; plannedStartDate: string }>
  >({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(
    () => errorCases.filter((c) => (c.hrStatus ?? 'ciorna') === 'trimis_hr'),
    [errorCases],
  );
  const byAngajat = useMemo(() => groupByAngajat(pending), [pending]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getOverride = (angajatId: string, err: ErrorCase) => {
    const p = err.reTrainingProposal!;
    const key = `${angajatId}-${err.id}`;
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

  const handleApprove = (angajatId: string, err: ErrorCase) => {
    if (!user) return;
    const ov = getOverride(angajatId, err);
    const block = trainingSystemStore.getApproveErrorBlockReason({
      angajatId,
      errorCaseIds: [err.id],
      topicDayId: ov.topicDayId,
      topicTitle: ov.topicTitle,
      trainerId: ov.trainerId,
      plannedStartDate: ov.plannedStartDate,
    });
    if (block) {
      setErrorMsg(block);
      setMsg('');
      return;
    }

    setBusyId(err.id);
    setErrorMsg('');
    setMsg('');
    try {
      const session = trainingSystemStore.approveErrorSubmissionsByHr({
        angajatId,
        errorCaseIds: [err.id],
        hrUser: { id: user.id, name: user.name },
        topicDayId: ov.topicDayId,
        topicTitle: ov.topicTitle,
        trainerId: ov.trainerId,
        plannedStartDate: ov.plannedStartDate,
      });
      if (!session) {
        setErrorMsg('Nu s-a putut confirma. Reîncărcați pagina și încercați din nou.');
        return;
      }
      setMsg('Eroare confirmată — angajatul poate deschide lecția; mentorul a fost activat și vede sesiunea în panoul Mentor.');
      refresh();
      refreshUsers();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = (errorId: string) => {
    if (!user) return;
    const note = rejectNote[errorId] ?? '';
    const result = trainingSystemStore.rejectErrorSubmissionByHr(
      errorId,
      { id: user.id, name: user.name },
      note,
    );
    if (result) {
      setMsg('Respinse către supervizor pentru corectare.');
      setErrorMsg('');
      refresh();
      return;
    }
    setErrorMsg(
      'Nu s-a putut respinge. Eroarea trebuie să fie în status „Trimis la HR”. Reîncărcați pagina.',
    );
    setMsg('');
  };

  if (byAngajat.size === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Confirmare erori — HR</h2>
        <p className="text-sm text-corporate-muted">
          Nicio eroare în așteptare. Aici apar înregistrările după ce supervizorul apasă{' '}
          <strong>„Confirmă înregistrarea și trimite la HR”</strong>.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-400/70 bg-amber-50/30 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-corporate-dark">Confirmare erori — HR</h2>
          <p className="text-sm text-corporate-muted mt-1">
            <strong>{pending.length}</strong> în așteptare · deschideți fiecare eroare pentru motiv și mentor
          </p>
        </div>
        <Badge variant="warning">{pending.length} de confirmat</Badge>
      </div>

      <div className="space-y-4">
        {[...byAngajat.entries()].map(([angajatId, errors]) => {
          const profile = profiles.find((p) => p.userId === angajatId);
          const name = profile
            ? `${profile.prenume} ${profile.nume}`
            : users.find((u) => u.id === angajatId)?.name ?? angajatId;
          const topics = getBaseTrainingTopics(profile?.departamentId ?? 'ingineri');

          return (
            <div key={angajatId} className="rounded-xl border border-corporate-border bg-white p-4 space-y-3">
              <p className="font-medium text-corporate-dark">{name}</p>

              <ul className="space-y-3">
                {errors.map((err) => {
                  const p = err.reTrainingProposal;
                  const ov = getOverride(angajatId, err);
                  const busy = busyId === err.id;
                  const expanded = expandedIds.has(err.id);
                  const trainers = mentorOptionsFor(angajatId, p?.trainerId);
                  const mentorName = resolveUserName(p?.trainerId ?? ov.trainerId, users);
                  const trimisLa =
                    p?.submittedAt && p.submittedAt.length >= 10
                      ? formatEvaluationShortDate(p.submittedAt.slice(0, 10))
                      : '—';

                  return (
                    <li
                      key={err.id}
                      className="rounded-lg border border-corporate-border/60 bg-corporate-surface/30 overflow-hidden text-sm"
                    >
                      <button
                        type="button"
                        className="w-full text-left p-3 hover:bg-corporate-surface/50 transition-colors"
                        onClick={() => toggleExpanded(err.id)}
                        aria-expanded={expanded}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-corporate-dark">
                                {err.data ? formatEvaluationShortDate(err.data) : '—'}
                              </span>
                              <Badge variant="info">{ERROR_MOTIV_LABELS[err.motiv]}</Badge>
                            </div>
                            <p className="text-xs text-corporate-muted">
                              Mentor recomandat:{' '}
                              <strong className="text-corporate-dark">{mentorName}</strong>
                              {p?.topicTitle ? ` · ${p.topicTitle}` : ''}
                            </p>
                            <p className="text-xs text-corporate-muted">Trimis la HR: {trimisLa}</p>
                          </div>
                          <span className="text-xs font-medium text-corporate-accent shrink-0">
                            {expanded ? 'Ascunde detalii ▲' : 'Vezi detalii ▼'}
                          </span>
                        </div>
                      </button>

                      {expanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-corporate-border/50 pt-3">
                          <dl className="space-y-2 rounded-lg bg-white/80 border border-corporate-border/40 p-3">
                            <DetailRow
                              label="Înregistrat de"
                              value={err.raportatDeNume || resolveUserName(err.raportatDe, users)}
                            />
                            <DetailRow
                              label="Data notă"
                              value={err.data ? formatEvaluationShortDate(err.data) : '—'}
                            />
                            <DetailRow label="Motiv" value={ERROR_MOTIV_LABELS[err.motiv]} />
                            <DetailRow label="Mentor recomandat" value={mentorName} />
                            <DetailRow label="Lecție propusă" value={p?.topicTitle ?? '—'} />
                            <DetailRow
                              label="Data început"
                              value={
                                p?.plannedStartDate
                                  ? formatEvaluationShortDate(p.plannedStartDate)
                                  : '—'
                              }
                            />
                            {err.descriere ? (
                              <DetailRow label="Descriere" value={err.descriere} />
                            ) : null}
                            {p?.lessonNotes ? (
                              <DetailRow label="Detalii lecție" value={p.lessonNotes} />
                            ) : null}
                          </dl>

                          {err.signedDocumentId && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => void downloadDocument(err.signedDocumentId!)}
                            >
                              Deschide nota de constatare
                            </Button>
                          )}

                          {p ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              <label className="block text-xs text-corporate-muted">
                                Lecție (HR poate modifica)
                                <select
                                  className="mt-1 w-full rounded-lg border border-corporate-border px-2 py-1.5 text-sm"
                                  value={ov.topicDayId}
                                  onChange={(e) => {
                                    const topic = topics.find((t) => t.dayId === e.target.value);
                                    setOverrides((prev) => ({
                                      ...prev,
                                      [`${angajatId}-${err.id}`]: {
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
                                Mentor (HR poate modifica)
                                <select
                                  className="mt-1 w-full rounded-lg border border-corporate-border px-2 py-1.5 text-sm"
                                  value={ov.trainerId || ''}
                                  onChange={(e) =>
                                    setOverrides((prev) => ({
                                      ...prev,
                                      [`${angajatId}-${err.id}`]: { ...ov, trainerId: e.target.value },
                                    }))
                                  }
                                >
                                  {!ov.trainerId && (
                                    <option value="">— Alege mentor —</option>
                                  )}
                                  {trainers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block text-xs text-corporate-muted sm:col-span-2">
                                Data început instruire
                                <input
                                  type="date"
                                  min={todayLocalIso()}
                                  className="mt-1 w-full rounded-lg border border-corporate-border px-2 py-1.5 text-sm sm:max-w-xs"
                                  value={ov.plannedStartDate}
                                  onChange={(e) =>
                                    setOverrides((prev) => ({
                                      ...prev,
                                      [`${angajatId}-${err.id}`]: {
                                        ...ov,
                                        plannedStartDate: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Lipsește planul de re-instruire — supervizorul trebuie să re-trimită formularul
                              complet.
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 items-end pt-1 border-t border-corporate-border/50">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={busy || !p}
                              onClick={() => handleApprove(angajatId, err)}
                            >
                              {busy ? 'Se confirmă…' : 'Confirmă eroarea'}
                            </Button>
                            <input
                              className="text-xs flex-1 min-w-[120px] rounded border border-corporate-border px-2 py-1.5"
                              placeholder="Motiv respingere (opțional)"
                              value={rejectNote[err.id] ?? ''}
                              onChange={(e) =>
                                setRejectNote((prev) => ({ ...prev, [err.id]: e.target.value }))
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleReject(err.id)}
                            >
                              Respinge
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {msg && <p className="text-sm text-emerald-700 mt-3">{msg}</p>}
      {errorMsg && <p className="text-sm text-red-600 mt-3">{errorMsg}</p>}
    </Card>
  );
}
