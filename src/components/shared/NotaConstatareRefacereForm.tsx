import { useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { ERROR_MOTIV_LABELS, hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { getBaseTrainingTopics } from '@/lib/trainingSystemStore';
import { userStore } from '@/lib/userStore';
import { validatePlannedStartDate, todayLocalIso } from '@/lib/errorCaseWorkflow';
import { NotaConstatareDocumentActions } from '@/components/shared/NotaConstatareDocumentActions';
import type { EmployeeProfile, ErrorMotiv } from '@/types';

export interface RegisterErrorFormState {
  deLa: string;
  dataNota: string;
  motiv: ErrorMotiv;
  mentorRecomandatId: string;
  dataInceputInstruire: string;
  topicDayId: string;
  topicTitle: string;
  lessonNotes: string;
}

interface NotaConstatareRefacereFormProps {
  profiles: EmployeeProfile[];
  angajatId: string;
  onAngajatIdChange: (id: string) => void;
  state: RegisterErrorFormState;
  onChange: (state: RegisterErrorFormState) => void;
  signedNotaInputId: string;
  lessonFilesInputId: string;
  signedDocumentId?: string;
  onViewSigned?: () => void;
}

function todayIso(): string {
  return todayLocalIso();
}

export function buildInitialNotaState(supervisorName: string): RegisterErrorFormState {
  const today = todayIso();
  return {
    deLa: supervisorName,
    dataNota: today,
    motiv: 'neatentie',
    mentorRecomandatId: '',
    dataInceputInstruire: today,
    topicDayId: '',
    topicTitle: '',
    lessonNotes: '',
  };
}

export function validateNotaConstatareState(
  state: RegisterErrorFormState,
  angajatId: string,
): string | null {
  if (!angajatId) return 'Selectați angajatul.';
  if (!state.deLa.trim()) return 'Completați câmpul „De la”.';
  if (!state.dataNota) return 'Selectați data notei.';
  if (!state.mentorRecomandatId) return 'Selectați mentorul recomandat.';
  const dateErr = validatePlannedStartDate(state.dataInceputInstruire);
  if (dateErr) return dateErr;
  if (!state.topicDayId) return 'Selectați lecția din planul de instruire.';
  const hasLesson =
    state.lessonNotes.trim().length >= 10;
  if (!hasLesson) return 'Descrieți lecția (min. 10 caractere) sau încărcați materiale.';
  return null;
}

/** Validare completă înainte de trimitere la HR (include nota semnată). */
export function validateRegisterErrorSubmission(
  state: RegisterErrorFormState,
  angajatId: string,
  hasSignedFile: boolean,
  hasLessonFiles: boolean,
): string | null {
  const base = validateNotaConstatareState(state, angajatId);
  if (base) return base;
  if (!hasSignedFile) return 'Încărcați nota de constatare completată și semnată.';
  if (state.lessonNotes.trim().length < 10 && !hasLessonFiles) {
    return 'Descrieți lecția (min. 10 caractere) sau încărcați materiale.';
  }
  return null;
}

export function NotaConstatareRefacereForm({
  profiles,
  angajatId,
  onAngajatIdChange,
  state,
  onChange,
  signedNotaInputId,
  lessonFilesInputId,
  signedDocumentId,
  onViewSigned,
}: NotaConstatareRefacereFormProps) {
  const mentorCandidates = useMemo(() => {
    if (!angajatId) return userStore.getMentorCandidates();
    return userStore.getMentorCandidates(angajatId);
  }, [angajatId]);

  const profile = useMemo(
    () => hrPerformanceStore.getProfile(angajatId),
    [angajatId],
  );

  const topics = useMemo(
    () => getBaseTrainingTopics(profile?.departamentId ?? 'ingineri'),
    [profile?.departamentId],
  );

  const fieldClass = 'mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm';
  const labelClass = 'block text-sm';
  const muted = 'text-corporate-muted';

  const patch = (partial: Partial<RegisterErrorFormState>) => {
    onChange({ ...state, ...partial });
  };

  return (
    <div className="space-y-4 sm:col-span-2">
      <NotaConstatareDocumentActions
        signedInputId={signedNotaInputId}
        signedDocumentId={signedDocumentId}
        onViewSigned={onViewSigned}
      />

      <label className={labelClass}>
        <span className={muted}>1. Angajat (persoană responsabilă) *</span>
        <select
          className={fieldClass}
          value={angajatId}
          onChange={(e) => onAngajatIdChange(e.target.value)}
          required
        >
          <option value="">Selectează…</option>
          {profiles.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.prenume} {p.nume} — {p.functie}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="2. De la (supervizor)"
          value={state.deLa}
          onChange={(e) => patch({ deLa: e.target.value })}
          required
        />
        <Input
          label="Data notă"
          type="date"
          value={state.dataNota}
          onChange={(e) => patch({ dataNota: e.target.value })}
          required
        />
      </div>

      <label className={labelClass}>
        <span className={muted}>3. Clasificare eroare (motiv) *</span>
        <select
          className={fieldClass}
          value={state.motiv}
          onChange={(e) => patch({ motiv: e.target.value as ErrorMotiv })}
          required
        >
          {Object.entries(ERROR_MOTIV_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={muted}>4. Mentor recomandat *</span>
          <select
            className={fieldClass}
            value={state.mentorRecomandatId}
            onChange={(e) => patch({ mentorRecomandatId: e.target.value })}
            required
            disabled={!angajatId}
          >
            <option value="">{angajatId ? 'Selectați mentorul…' : 'Selectați mai întâi angajatul'}</option>
            {mentorCandidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="5. Data început instruire *"
          type="date"
          min={todayLocalIso()}
          value={state.dataInceputInstruire}
          onChange={(e) => patch({ dataInceputInstruire: e.target.value })}
          required
        />
      </div>

      <div className="space-y-3 border-t border-corporate-border/60 pt-3">
        <p className="text-xs font-semibold text-corporate-dark uppercase tracking-wide">
          6. Lecție de parcurs (re-instruire)
        </p>
        <label className={labelClass}>
          <span className={muted}>Temă din planul de instruire *</span>
          <select
            className={fieldClass}
            value={state.topicDayId}
            disabled={!angajatId}
            onChange={(e) => {
              const topic = topics.find((t) => t.dayId === e.target.value);
              patch({
                topicDayId: e.target.value,
                topicTitle: topic?.title ?? e.target.value,
              });
            }}
            required
          >
            <option value="">{angajatId ? 'Selectați lecția…' : 'Selectați mai întâi angajatul'}</option>
            {topics.map((t) => (
              <option key={t.dayId} value={t.dayId}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={muted}>Detalii lecție (ce se exersează) *</span>
          <textarea
            className={`${fieldClass} min-h-[56px]`}
            value={state.lessonNotes}
            placeholder="Ex.: refacere procedură tăiere, verificare măsurători…"
            onChange={(e) => patch({ lessonNotes: e.target.value })}
            required
          />
        </label>
        <label className={labelClass}>
          <span className={muted}>Materiale lecție (opțional, dacă descrierea e scurtă)</span>
          <input
            id={lessonFilesInputId}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="mt-1 block w-full text-sm"
          />
        </label>
      </div>
    </div>
  );
}
