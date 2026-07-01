import type { EmployeeProfile } from '@/types';
import { buildEmployeeTimeline } from '@/lib/timelineBuilder';
import {
  EVALUATION_STATUS_LABELS,
  ERROR_MOTIV_LABELS,
  QUICK_NOTE_TYPE_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { getDepartmentById } from '@/data/departments';
import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';

function formatRoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function safeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

/** Dosar angajat PDF — artGRANIT branded */
export async function downloadEmployeeDossierPdf(profile: EmployeeProfile): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 0;

  const fullName = `${profile.prenume} ${profile.nume}`.trim();
  const manager = profile.managerId ? userStore.getUserById(profile.managerId)?.name : undefined;
  const evaluations = hrPerformanceStore.getEvaluations(profile.userId);
  const errors = hrPerformanceStore.getErrorCases({ angajatId: profile.userId });
  const notes = hrPerformanceStore.getQuickNotes(profile.userId);
  const docs = hrPerformanceStore.getDocuments({ angajatId: profile.userId });
  const timeline = buildEmployeeTimeline(profile.userId).slice(0, 12);

  const trainee = userStore.getTraineeProfiles().find((t) => t.id === profile.userId);
  const training = trainee ? buildTraineeHrReport(trainee, storage.getProgress(profile.userId)) : null;

  doc.setFillColor(12, 12, 12);
  doc.rect(0, 0, w, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('artGRANIT', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Dosar angajat — Performanță & Instruire', margin, 18);

  y = 34;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const meta = [
    `Funcție: ${profile.functie}`,
    `Departament: ${getDepartmentById(profile.departamentId)?.label ?? profile.departamentId}`,
    `Angajare: ${profile.dataAngajarii}`,
    `Evaluator: ${manager ?? '—'}`,
    training ? `Instruire: ${training.progressPercent}% (${training.completedDays}/${training.totalDays} zile)` : null,
  ].filter(Boolean) as string[];

  for (const line of meta) {
    doc.text(line, margin, y);
    y += 5;
  }

  y += 4;
  doc.setDrawColor(179, 143, 85);
  doc.setLineWidth(0.8);
  doc.line(margin, y, w - margin, y);
  y += 8;

  const section = (title: string) => {
    if (y > 260) {
      doc.addPage();
      y = 24;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
  };

  section('Evaluări tri-lunale');
  const current = hrPerformanceStore.getCurrentEvaluation(profile.userId);
  if (current) {
    doc.text(
      `Status curent: ${EVALUATION_STATUS_LABELS[current.status]} · Termen: ${current.termenReevaluare}`,
      margin,
      y,
    );
    y += 5;
  }
  for (const ev of evaluations.slice(0, 4)) {
    doc.text(
      `• ${ev.perioadaStart} — ${EVALUATION_STATUS_LABELS[ev.status]}${ev.concluzii ? `: ${ev.concluzii.slice(0, 60)}…` : ''}`,
      margin,
      y,
    );
    y += 5;
  }
  if (!evaluations.length) {
    doc.text('Nicio evaluare înregistrată.', margin, y);
    y += 5;
  }
  y += 4;

  section('Erori & planuri acțiune');
  for (const err of errors.slice(0, 4)) {
    doc.text(`• ${err.data} — ${ERROR_MOTIV_LABELS[err.motiv]} (${err.planActiune.status})`, margin, y);
    y += 4;
    const lines = doc.splitTextToSize(err.planActiune.pasi, w - margin * 2);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4 + 2;
  }
  if (!errors.length) {
    doc.text('Nicio eroare înregistrată.', margin, y);
    y += 5;
  }
  y += 4;

  section('Observații rapide');
  for (const n of notes.slice(0, 5)) {
    doc.text(`• [${QUICK_NOTE_TYPE_LABELS[n.tip]}] ${n.autorNume}: ${n.text.slice(0, 80)}`, margin, y);
    y += 5;
  }
  if (!notes.length) {
    doc.text('Nicio observație.', margin, y);
    y += 5;
  }
  y += 4;

  section('Documente arhivă');
  doc.text(`${docs.length} document(e) asociate`, margin, y);
  y += 8;

  section('Timeline recent');
  for (const ev of timeline) {
    if (y > 275) break;
    doc.text(`• ${formatRoDate(ev.createdAt)} — ${ev.title}`, margin, y);
    y += 5;
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generat ${formatRoDate(new Date().toISOString())} · artGRANIT © ${new Date().getFullYear()}`,
    margin,
    287,
  );

  doc.save(`dosar-artgranit-${safeFilename(fullName)}.pdf`);
}

/** Deschide fereastra print pentru dosar (alternativă fără jsPDF) */
export function printEmployeeDossier(profile: EmployeeProfile): void {
  void downloadEmployeeDossierPdf(profile);
}
