import type { TimelineEvent } from '@/types';
import { hrPerformanceStore, EVALUATION_STATUS_LABELS, ERROR_MOTIV_LABELS, QUICK_NOTE_TYPE_LABELS } from '@/lib/hrPerformanceStore';
import { storage } from '@/store/storage';
import { userStore } from '@/lib/userStore';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getDepartmentById } from '@/data/departments';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { RE_TRAINING_STATUS_LABELS, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';

export function buildEmployeeTimeline(angajatId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const ev of hrPerformanceStore.getEvaluations(angajatId)) {
    events.push({
      id: `tl-eval-${ev.id}`,
      type: 'evaluare',
      title: `Evaluare — ${EVALUATION_STATUS_LABELS[ev.status]}`,
      subtitle: ev.dataEvaluare
        ? `Finalizată ${ev.dataEvaluare}${ev.concluzii ? ` · ${ev.concluzii.slice(0, 120)}` : ''}`
        : `${getEvaluationWorkflowLabel(ev)} · termen ${ev.termenReevaluare}`,
      severity: ev.status === 'intarziat' ? 'critical' : ev.status === 'evaluat' ? 'success' : 'info',
      createdAt: ev.dataEvaluare ?? ev.updatedAt,
    });

    if (ev.employeeSelfAssessment?.completedAt) {
      events.push({
        id: `tl-self-${ev.id}`,
        type: 'evaluare',
        title: 'Auto-evaluare completată',
        subtitle: ev.employeeSelfAssessment.realizari.slice(0, 140),
        severity: 'success',
        createdAt: ev.employeeSelfAssessment.completedAt,
      });
    }

    for (const stage of ev.stages ?? []) {
      if (stage.status !== 'completat' || !stage.completedAt) continue;
      events.push({
        id: `tl-stage-${ev.id}-${stage.id}`,
        type: 'evaluare',
        title: stage.label,
        subtitle: stage.completedByName
          ? `Completat de ${stage.completedByName}`
          : undefined,
        severity: 'success',
        createdAt: stage.completedAt,
      });
    }
  }

  for (const session of trainingSystemStore.getReTrainingSessions({ angajatId })) {
    const st = normalizeReTrainingStatus(session.status);
    events.push({
      id: `tl-retrain-${session.id}`,
      type: 're_instruire',
      title: `Re-instruire — ${RE_TRAINING_STATUS_LABELS[st]}`,
      subtitle: session.topicTitle ?? session.titlu,
      severity: st === 'finalizat' ? 'success' : st === 'alerta_supervizor' ? 'critical' : 'warning',
      createdAt: session.finalizatLa ?? session.createdAt,
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

  if (progress.certificate) {
    events.push({
      id: `tl-cert-${angajatId}`,
      type: 'instruire',
      title: 'Certificat instruire emis',
      subtitle: `${progress.certificate.stagiarName} · ${progress.certificate.mentorName}`,
      severity: 'success',
      createdAt: progress.certificate.issuedAt,
    });
  }

  for (const fb of progress.feedbacks) {
    if (!fb.completedAt) continue;
    events.push({
      id: `tl-fb-${angajatId}-w${fb.weekNumber}`,
      type: 'instruire',
      title: `Feedback Săptămâna ${fb.weekNumber === 2 ? 'II' : 'IV'}`,
      subtitle: fb.mentorName ? `Mentor: ${fb.mentorName}` : undefined,
      severity: 'info',
      createdAt: fb.completedAt,
    });
  }

  for (const entry of progress.auditLog.slice(-30)) {
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
