import { THEORETICAL_TEST } from '@/data/theoreticalTest';
import type { QuizResult } from '@/types';

function formatRoDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function safeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

/** PDF — test teoretic Ziua 10: răspuns corect vs. răspuns angajat */
export async function downloadTheoreticalTestPdf(
  employeeName: string,
  quizResult: QuizResult,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = w - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 22;
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
  doc.text('Test Teoretic — Ziua 10 · Instruire Inginer Proiectant', margin, 16);

  y = 30;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Raport răspunsuri test teoretic', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Angajat: ${employeeName}`, margin, y);
  y += 5;
  doc.text(`Data completării: ${formatRoDateTime(quizResult.completedAt)}`, margin, y);
  y += 5;
  const pct = Math.round((quizResult.score / quizResult.total) * 100);
  doc.text(
    `Scor: ${quizResult.score}/${quizResult.total} (${pct}%) · ${quizResult.passed ? 'PROMOVAT' : 'NEPROMOVAT'} · Încercare ${quizResult.attempts}/${THEORETICAL_TEST.maxAttempts}`,
    margin,
    y,
  );
  y += 5;
  doc.text(`Prag promovare: min. ${THEORETICAL_TEST.passPercent}%`, margin, y);
  y += 8;

  doc.setDrawColor(179, 143, 85);
  doc.setLineWidth(0.6);
  doc.line(margin, y, w - margin, y);
  y += 6;

  const answers = quizResult.answers;
  const hasDetail = answers && Object.keys(answers).length > 0;

  if (!hasDetail) {
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text(
      'Detaliul pe întrebări nu este disponibil (test trimis înainte de înregistrarea răspunsurilor).',
      margin,
      y,
    );
    y += 8;
  }

  THEORETICAL_TEST.questions.forEach((q, idx) => {
    const selected = answers?.[q.id];
    const correct = q.correctIndex;
    const answered = selected !== undefined;
    const isCorrect = answered && selected === correct;

    ensureSpace(28);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const qLines = doc.splitTextToSize(`${idx + 1}. ${q.question}`, contentW);
    doc.text(qLines, margin, y);
    y += qLines.length * 4.5 + 2;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    if (answered) {
      doc.setTextColor(isCorrect ? 5 : 180, isCorrect ? 150 : 83, isCorrect ? 105 : 9);
      doc.text(`Răspuns angajat: ${q.options[selected]}${isCorrect ? ' (corect)' : ' (greșit)'}`, margin, y);
      y += 4.5;
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text('Răspuns angajat: — (nedisponibil)', margin, y);
      y += 4.5;
    }

    doc.setTextColor(5, 120, 85);
    doc.text(`Răspuns corect: ${q.options[correct]}`, margin, y);
    y += 4.5;

    if (answered && !isCorrect && q.explanation) {
      doc.setTextColor(71, 85, 105);
      const expLines = doc.splitTextToSize(`Explicație: ${q.explanation}`, contentW);
      doc.text(expLines, margin, y);
      y += expLines.length * 4;
    }

    y += 4;
  });

  y += 4;
  ensureSpace(12);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generat ${formatRoDateTime(new Date().toISOString())} · artGRANIT Instruire`,
    margin,
    y,
  );

  doc.save(`test-teoretic-z10-${safeFilename(employeeName)}.pdf`);
}
