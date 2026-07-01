import type { TimelineEvent } from '@/types';
import { hrPerformanceStore, EVALUATION_STATUS_LABELS, ERROR_MOTIV_LABELS, QUICK_NOTE_TYPE_LABELS } from '@/lib/hrPerformanceStore';
import { storage } from '@/store/storage';
import { userStore } from '@/lib/userStore';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getDepartmentById } from '@/data/departments';

export function buildEmployeeTimeline(angajatId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const ev of hrPerformanceStore.getEvaluations(angajatId)) {
    events.push({
      id: `tl-eval-${ev.id}`,
      type: 'evaluare',
      title: `Evaluare — ${EVALUATION_STATUS_LABELS[ev.status]}`,
      subtitle: ev.dataEvaluare
        ? `Finalizată ${ev.dataEvaluare}`
        : `Termen: ${ev.termenReevaluare}`,
      severity: ev.status === 'intarziat' ? 'critical' : ev.status === 'evaluat' ? 'success' : 'info',
      createdAt: ev.dataEvaluare ?? ev.updatedAt,
    });
  }

  for (const note of hrPerformanceStore.getQuickNotes(angajatId)) {
    events.push({
      id: `tl-note-${note.id}`,
      type: 'nota',
      title: `${QUICK_NOTE_TYPE_LABELS[note.tip]} — ${note.autorNume}`,
      subtitle: note.text,
      severity: note.tip === 'atentionare' ? 'warning' : note.tip === 'apreciere' ? 'success' : 'info',
      createdAt: note.createdAt,
    });
  }

  for (const err of hrPerformanceStore.getErrorCases({ angajatId })) {
    events.push({
      id: `tl-err-${err.id}`,
      type: 'eroare',
      title: `Eroare — ${ERROR_MOTIV_LABELS[err.motiv]}`,
      subtitle: err.proiectNume ? `${err.proiectNume}: ${err.descriere}` : err.descriere,
      severity: err.planActiune.status === 'inchis' ? 'info' : 'warning',
      createdAt: err.createdAt,
    });
  }

  for (const doc of hrPerformanceStore.getDocuments({ angajatId })) {
    events.push({
      id: `tl-doc-${doc.id}`,
      type: 'document',
      title: `Document — ${doc.nume}`,
      subtitle: `Încărcat de ${doc.uploadedByNume}`,
      severity: 'info',
      createdAt: doc.createdAt,
    });
  }

  const enr = userStore.getActiveEnrollmentForAngajat(angajatId);
  if (enr) {
    const trainee = userStore.getTraineeProfiles().find((t) => t.id === angajatId);
    if (trainee) {
      const row = buildTraineeHrReport(trainee, storage.getProgress(angajatId));
      events.push({
        id: `tl-training-${angajatId}`,
        type: 'instruire',
        title: `Instruire ${getDepartmentById(enr.departmentId)?.label ?? enr.departmentId}`,
        subtitle: `Progres ${row.progressPercent}% · ${row.completedDays}/${row.totalDays} zile`,
        severity: row.progressPercent >= 80 ? 'success' : row.progressPercent >= 40 ? 'info' : 'warning',
        createdAt: row.lastActivityAt ?? enr.createdAt,
      });
    }
  }

  const progress = storage.getProgress(angajatId);
  for (const entry of progress.auditLog.slice(-20)) {
    events.push({
      id: `tl-audit-${entry.id}`,
      type: 'audit',
      title: entry.action,
      subtitle: entry.details,
      severity: 'info',
      createdAt: entry.createdAt,
      meta: { actor: entry.actorName },
    });
  }

  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
