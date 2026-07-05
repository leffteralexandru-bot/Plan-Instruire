import type { ErrorCase, ErrorCaseHrStatus, ErrorReTrainingProposal } from '@/types';

export const ERROR_CASE_HR_STATUS_LABELS: Record<ErrorCaseHrStatus, string> = {
  ciorna: 'Incompletă',
  trimis_hr: 'Trimis la HR',
  aprobat_hr: 'Aprobat HR',
  respins_hr: 'Respins — de corectat',
};

/** Data locală YYYY-MM-DD — azi este permis, trecutul nu. */
export function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function validatePlannedStartDate(date: string | undefined): string | null {
  if (!date) return 'Selectați data de început a instruirii.';
  if (date < todayLocalIso()) {
    return 'Data de start nu poate fi în trecut — alegeți azi sau o dată viitoare.';
  }
  return null;
}

export function normalizeErrorHrStatus(error: ErrorCase): ErrorCaseHrStatus {
  return error.hrStatus ?? 'ciorna';
}

export function canSupervisorCompleteError(error: ErrorCase): boolean {
  const st = normalizeErrorHrStatus(error);
  return st === 'ciorna' || st === 'respins_hr';
}

/** Supervizorul poate șterge doar înainte de confirmarea HR. */
export function canDeleteErrorCase(
  error: ErrorCase,
  options?: { isHr?: boolean },
): string | null {
  const st = normalizeErrorHrStatus(error);
  if (st === 'aprobat_hr' || error.reTrainingSessionId) {
    return 'Înregistrarea a fost confirmată de HR și nu mai poate fi ștearsă.';
  }
  if (st === 'trimis_hr' && !options?.isHr) {
    return 'Înregistrarea a fost trimisă la HR și nu mai poate fi ștearsă.';
  }
  return null;
}

export function canSupervisorSubmitErrorToHr(error: ErrorCase): boolean {
  return canSupervisorCompleteError(error) && isErrorReadyForHrSubmit(error);
}

export function isErrorReadyForHrSubmit(error: ErrorCase): boolean {
  const p = error.reTrainingProposal;
  return !!(
    error.signedDocumentId &&
    p?.topicDayId &&
    p?.trainerId &&
    p?.plannedStartDate &&
    !validatePlannedStartDate(p.plannedStartDate) &&
    ((p.lessonNotes?.trim().length ?? 0) >= 10 || (p.lessonDocumentIds?.length ?? 0) > 0)
  );
}

export function validateErrorSubmission(error: ErrorCase): string | null {
  if (!error.signedDocumentId) return 'Încărcați nota de refacere semnată de angajat.';
  const p = error.reTrainingProposal;
  if (!p?.topicDayId) return 'Selectați tema (lecția) din planul de instruire.';
  if (!p?.trainerId) return 'Selectați mentorul care va instrui.';
  const dateErr = validatePlannedStartDate(p?.plannedStartDate);
  if (dateErr) return dateErr;
  const hasLesson =
    (p.lessonNotes?.trim().length ?? 0) >= 10 || (p.lessonDocumentIds?.length ?? 0) > 0;
  if (!hasLesson) return 'Descrieți lecția (min. 10 caractere) sau încărcați materiale.';
  return null;
}

export function mergeProposal(
  current: ErrorReTrainingProposal | undefined,
  patch: Partial<ErrorReTrainingProposal>,
): ErrorReTrainingProposal {
  return {
    topicDayId: patch.topicDayId ?? current?.topicDayId ?? '',
    topicTitle: patch.topicTitle ?? current?.topicTitle ?? '',
    trainerId: patch.trainerId ?? current?.trainerId ?? '',
    lessonNotes: patch.lessonNotes ?? current?.lessonNotes ?? '',
    lessonDocumentIds: patch.lessonDocumentIds ?? current?.lessonDocumentIds ?? [],
    plannedStartDate: patch.plannedStartDate ?? current?.plannedStartDate,
    submittedAt: patch.submittedAt ?? current?.submittedAt,
    submittedBy: patch.submittedBy ?? current?.submittedBy,
  };
}
