import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { getBaseTrainingTopics } from '@/lib/trainingSystemStore';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { userStore } from '@/lib/userStore';
import {
  ERROR_CASE_HR_STATUS_LABELS,
  canSupervisorCompleteError,
  mergeProposal,
  normalizeErrorHrStatus,
  validateErrorSubmission,
  todayLocalIso,
} from '@/lib/errorCaseWorkflow';
import { getErrorCaseDeleteBlockReason } from '@/lib/accessControl';
import { NotaConstatareDocumentActions } from '@/components/shared/NotaConstatareDocumentActions';
import type { ErrorCase, ErrorReTrainingProposal } from '@/types';

interface ErrorCaseCompletionPanelProps {
  errorCase: ErrorCase;
  angajatName: string;
  defaultExpanded?: boolean;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export function ErrorCaseCompletionPanel({
  errorCase,
  angajatName,
  defaultExpanded,
  onUpdated,
  onDeleted,
}: ErrorCaseCompletionPanelProps) {
  const { user } = useAuth();
  const { uploadDocument, updateErrorCase, deleteErrorCase, downloadDocument } = useHrPerformance();
  const { users } = useUsers();
  const hrStatus = normalizeErrorHrStatus(errorCase);
  const [expanded, setExpanded] = useState(
    defaultExpanded ?? (hrStatus === 'respins_hr' || hrStatus === 'ciorna'),
  );
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const editable = canSupervisorCompleteError(errorCase);
  const deleteBlockReason = getErrorCaseDeleteBlockReason(user, errorCase);
  const profile = hrPerformanceStore.getProfile(errorCase.angajatId);
  const topics = getBaseTrainingTopics(profile?.departamentId ?? 'ingineri');

  const proposal = errorCase.reTrainingProposal ?? {
    topicDayId: '',
    topicTitle: '',
    trainerId: '',
    lessonNotes: '',
    lessonDocumentIds: [],
    plannedStartDate: '',
  };

  const mentorName =
    users.find((u) => u.id === proposal.trainerId)?.name ?? '—';

  const trainerCandidates = useMemo(() => {
    const base = userStore.getMentorCandidates(errorCase.angajatId);
    const supervisorId = profile?.supervisorId ?? profile?.managerId;
    const supervisor = users.find((u) => u.id === supervisorId);
    if (supervisor && !base.some((u) => u.id === supervisor.id)) {
      const full = userStore.getUserById(supervisor.id);
      return full ? [full, ...base] : base;
    }
    return base;
  }, [errorCase.angajatId, profile, users]);

  const patchProposal = (patch: Partial<ErrorReTrainingProposal>) => {
    if (!editable) return;
    updateErrorCase(errorCase.id, {
      reTrainingProposal: mergeProposal(errorCase.reTrainingProposal, patch),
    });
    onUpdated?.();
  };

  const handleSignedUpload = async () => {
    if (!user || !editable) return;
    const input = document.getElementById(`signed-${errorCase.id}`) as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setMsg('Selectați scanul notei semnate de angajat.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const doc = await uploadDocument({
        file,
        tip: 'nota_constatare',
        angajatId: errorCase.angajatId,
        uploadedBy: user.id,
        uploadedByNume: user.name,
        errorCaseId: errorCase.id,
      });
      updateErrorCase(errorCase.id, { signedDocumentId: doc.id });
      if (input) input.value = '';
      setMsg('Pas 2 complet — notă semnată încărcată.');
      onUpdated?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Eroare la încărcare.');
    } finally {
      setBusy(false);
    }
  };

  const handleLessonUpload = async () => {
    if (!user || !editable) return;
    const input = document.getElementById(`lesson-${errorCase.id}`) as HTMLInputElement;
    const files = input?.files;
    if (!files?.length) {
      setMsg('Selectați fișierele pentru lecție.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const ids = [...proposal.lessonDocumentIds];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const doc = await uploadDocument({
          file,
          tip: 're_instruire',
          angajatId: errorCase.angajatId,
          uploadedBy: user.id,
          uploadedByNume: user.name,
          errorCaseId: errorCase.id,
          folder: 'istoric_instruire',
          dayId: proposal.topicDayId || undefined,
        });
        ids.push(doc.id);
      }
      patchProposal({ lessonDocumentIds: [...new Set(ids)] });
      if (input) input.value = '';
      setMsg('Materiale lecție încărcate.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Eroare la încărcare.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitToHr = () => {
    if (!user || !editable) return;
    const validation = validateErrorSubmission({
      ...errorCase,
      reTrainingProposal: proposal,
    });
    if (validation) {
      setMsg(validation);
      return;
    }
    updateErrorCase(errorCase.id, {
      hrStatus: 'trimis_hr',
      reTrainingProposal: {
        ...proposal,
        submittedAt: new Date().toISOString(),
        submittedBy: user.id,
      },
    });
    setMsg('Trimis la HR. Așteptați confirmarea sau modificările.');
    onUpdated?.();
  };

  const handleDelete = () => {
    if (!user || deleteBlockReason) return;
    if (
      !window.confirm(
        'Ștergeți definitiv această înregistrare de eroare și documentele atașate?',
      )
    ) {
      return;
    }
    if (deleteErrorCase(errorCase.id)) {
      onDeleted?.();
      onUpdated?.();
    } else {
      setMsg('Nu s-a putut șterge înregistrarea.');
    }
  };

  const statusVariant =
    hrStatus === 'aprobat_hr' ? 'success' : hrStatus === 'respins_hr' ? 'warning' : 'default';

  return (
    <div className="rounded-lg border border-indigo-100 bg-white/90 p-3 space-y-3">
      <button
        type="button"
        className="w-full flex flex-wrap items-center justify-between gap-2 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="text-sm font-semibold text-corporate-dark">Înregistrare erori — {angajatName}</p>
          <p className="text-xs text-corporate-muted">{errorCase.data}</p>
        </div>
        <Badge variant={statusVariant}>{ERROR_CASE_HR_STATUS_LABELS[hrStatus]}</Badge>
      </button>

      {!deleteBlockReason && (
        <div className="flex justify-end border-t border-corporate-border/40 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete}>
            Șterge înregistrarea
          </Button>
        </div>
      )}

      {deleteBlockReason && (
        <p className="text-xs text-corporate-muted border-t border-corporate-border/40 pt-2">
          {deleteBlockReason}
        </p>
      )}

      {expanded && (
        <div className="space-y-4 border-t border-corporate-border/60 pt-3 text-sm">
          <ol className="space-y-4 list-none">
            <li>
              <NotaConstatareDocumentActions
                signedInputId={`signed-${errorCase.id}`}
                signedDocumentId={errorCase.signedDocumentId}
                onViewSigned={
                  errorCase.signedDocumentId
                    ? () => void downloadDocument(errorCase.signedDocumentId!)
                    : undefined
                }
                disabled={!editable && !!errorCase.signedDocumentId}
              />
              {editable && !errorCase.signedDocumentId && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  disabled={busy}
                  onClick={() => void handleSignedUpload()}
                >
                  Confirmă încărcarea notei
                </Button>
              )}
            </li>

            <li className="space-y-2 rounded-lg border border-corporate-border/50 bg-corporate-surface/40 p-3">
              <p className="font-medium text-corporate-dark">Plan re-instruire propus</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-corporate-muted">
                  Mentor recomandat *
                  <select
                    className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                    value={proposal.trainerId}
                    disabled={!editable}
                    onChange={(e) => patchProposal({ trainerId: e.target.value })}
                  >
                    <option value="">Selectați mentor…</option>
                    {trainerCandidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-corporate-muted">
                  Data început instruire *
                  <input
                    type="date"
                    min={todayLocalIso()}
                    className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                    value={proposal.plannedStartDate ?? ''}
                    disabled={!editable}
                    onChange={(e) => patchProposal({ plannedStartDate: e.target.value })}
                  />
                </label>
              </div>
              {!editable && (
                <p className="text-xs text-corporate-muted">
                  {mentorName} · start {proposal.plannedStartDate || '—'}
                </p>
              )}
            </li>

            <li className="space-y-2">
              <p className="font-medium text-corporate-dark">
                Lecția de parcurs (tema din plan) *
              </p>
              <label className="block text-xs text-corporate-muted">
                Temă din instruirea de bază *
                <select
                  className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                  value={proposal.topicDayId}
                  disabled={!editable}
                  onChange={(e) => {
                    const topic = topics.find((t) => t.dayId === e.target.value);
                    patchProposal({
                      topicDayId: e.target.value,
                      topicTitle: topic?.title ?? e.target.value,
                    });
                  }}
                >
                  <option value="">Selectați lecția…</option>
                  {topics.map((t) => (
                    <option key={t.dayId} value={t.dayId}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-corporate-muted">
                Detalii lecție (ce se exersează) *
                <textarea
                  className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[56px]"
                  value={proposal.lessonNotes}
                  disabled={!editable}
                  placeholder="Ex.: refacere procedură tăiere, verificare măsurători…"
                  onChange={(e) => patchProposal({ lessonNotes: e.target.value })}
                />
              </label>
              {editable && (
                <div className="flex flex-wrap gap-2 items-end">
                  <input
                    id={`lesson-${errorCase.id}`}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void handleLessonUpload()}
                  >
                    Încarcă materiale lecție
                  </Button>
                </div>
              )}
              {proposal.lessonDocumentIds.length > 0 && (
                <p className="text-xs text-emerald-700">
                  {proposal.lessonDocumentIds.length} fișier(e) atașat(e)
                </p>
              )}
            </li>
          </ol>

          {hrStatus === 'respins_hr' && errorCase.hrReviewNote && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
              <strong>HR:</strong> {errorCase.hrReviewNote}
            </p>
          )}

          {hrStatus === 'trimis_hr' && (
            <p className="text-sm text-indigo-800 bg-indigo-50 rounded-lg px-3 py-2">
              În așteptarea confirmării HR. Puteți modifica doar după respingere.
            </p>
          )}

          {hrStatus === 'aprobat_hr' && (
            <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
              Aprobat de HR. Re-instruirea a început — mentorul și angajatul au fost notificați.
            </p>
          )}

          {editable && (
            <Button type="button" variant="primary" size="sm" onClick={handleSubmitToHr}>
              {hrStatus === 'respins_hr' ? 'Retrimite la HR' : 'Trimite la HR'}
            </Button>
          )}

          {msg && <p className="text-xs text-emerald-700">{msg}</p>}
        </div>
      )}
    </div>
  );
}
