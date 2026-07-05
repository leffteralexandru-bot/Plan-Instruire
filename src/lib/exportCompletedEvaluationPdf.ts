import { getEvaluationCriteria } from '@/lib/evaluationSettings';
import {
  evaluationOrdinalLabel,
  formatEvaluationRoDate,
} from '@/lib/evaluationDisplay';
import { computeCompetencyOutcome, formatCoeficientSalarial, isCompetencyScoresComplete } from '@/lib/competencyScoring';
import type { EmployeeSelfAssessment, EvaluationCycle } from '@/types';

function safeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

interface DownloadCompletedEvaluationPdfOptions {
  employeeName: string;
  evaluatorName?: string;
  ordinal: number;
  cycle: EvaluationCycle;
  showSalaryCoefficient: boolean;
}

export async function downloadCompletedEvaluationPdf({
  employeeName,
  evaluatorName,
  ordinal,
  cycle,
  showSalaryCoefficient,
}: DownloadCompletedEvaluationPdfOptions): Promise<void> {
  const result = cycle.competencyResult;
  if (!result) throw new Error('Evaluarea nu are rezultat final validat.');

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = w - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > 282) {
      doc.addPage();
      y = 22;
    }
  };

  const writeln = (text: string, indent = 0) => {
    const lines = doc.splitTextToSize(text, contentW - indent);
    ensureSpace(lines.length * 4.5 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 4.5 + 1;
  };

  const section = (title: string) => {
    ensureSpace(12);
    y += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
  };

  const writeAssessment = (label: string, assessment?: EmployeeSelfAssessment) => {
    section(label);
    if (!assessment?.completedAt) {
      writeln('Necompletat.');
      return;
    }
    writeln(`Realizări: ${assessment.realizari}`);
    writeln(`Dificultăți: ${assessment.dificultati}`);
    writeln(`Obiective: ${assessment.obiectiveViitoare}`);
  };

  const writeMatrix = (title: string, scores?: EvaluationCycle['competencySelfScores']) => {
    section(title);
    if (!scores || !isCompetencyScoresComplete(scores)) {
      writeln('Matrice competențe necompletată.');
      return;
    }
    const outcome = computeCompetencyOutcome(scores);
    writeln(`${outcome.nivelLabel} ${outcome.incadrare} · Total ${outcome.total}/40`);
    for (const c of getEvaluationCriteria()) {
      writeln(`• ${c.label}: Nivel ${scores[c.id]}`);
    }
  };

  doc.setFillColor(12, 12, 12);
  doc.rect(0, 0, w, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('artGRANIT', margin, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Evaluare tri-lunară finalizată — Inginer proiectant', margin, 16);

  y = 30;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(evaluationOrdinalLabel(ordinal), margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  writeln(`Angajat: ${employeeName}`);
  if (cycle.dataEvaluare) {
    writeln(`Data evaluării: ${formatEvaluationRoDate(cycle.dataEvaluare)}`);
  }
  if (evaluatorName) {
    writeln(`Supervizor: ${evaluatorName}`);
  }
  writeln(`Perioadă: ${cycle.perioadaStart} — ${cycle.perioadaEnd}`);
  y += 2;

  doc.setDrawColor(179, 143, 85);
  doc.setLineWidth(0.6);
  doc.line(margin, y, w - margin, y);
  y += 6;

  section('Rezultat final validat de HR');
  writeln(`${result.nivelLabel} ${result.incadrare} · Total ${result.total}/40`);
  if (showSalaryCoefficient) {
    writeln(`Coeficient salarial: ${formatCoeficientSalarial(result.coeficientSalarialPercent)}`);
  }
  if (cycle.concluzii) writeln(`Concluzii HR: ${cycle.concluzii}`);
  if (cycle.planDezvoltare) writeln(`Plan dezvoltare: ${cycle.planDezvoltare}`);

  writeAssessment('Auto-evaluare angajat — răspunsuri text', cycle.employeeSelfAssessment);
  writeMatrix('Auto-evaluare angajat — matrice competențe', cycle.competencySelfScores);

  writeAssessment('Evaluare supervizor — răspunsuri text', cycle.supervisorAssessment);
  writeMatrix('Evaluare supervizor — matrice competențe', cycle.competencySupervisorScores);

  const selfOutcome =
    cycle.competencySelfScores && isCompetencyScoresComplete(cycle.competencySelfScores)
      ? computeCompetencyOutcome(cycle.competencySelfScores)
      : undefined;
  const supervisorOutcome =
    cycle.competencySupervisorScores && isCompetencyScoresComplete(cycle.competencySupervisorScores)
      ? computeCompetencyOutcome(cycle.competencySupervisorScores)
      : undefined;
  if (selfOutcome && supervisorOutcome && selfOutcome.total !== supervisorOutcome.total) {
    section('Comparație totaluri');
    writeln(
      `Angajat ${selfOutcome.total}/40 · Supervizor ${supervisorOutcome.total}/40 · HR validat ${result.total}/40`,
    );
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  ensureSpace(8);
  doc.text(
    `Generat ${formatEvaluationRoDate(new Date().toISOString())} · artGRANIT © ${new Date().getFullYear()}`,
    margin,
    287,
  );

  const dateSlug = cycle.dataEvaluare ?? cycle.updatedAt.slice(0, 10);
  doc.save(`evaluare-${safeFilename(employeeName)}-${dateSlug}.pdf`);
}
