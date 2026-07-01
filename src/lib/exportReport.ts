import { COMPETENCIES } from '@/data/competencies';
import type { HrAggregateReport, TraineeHrReport } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import type { AuditLogRow } from '@/lib/hrAnalytics';

function escapeCsv(value: string | number | boolean | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(escapeCsv).join(';');
}

export function buildHrCsv(report: HrAggregateReport): string {
  const header = row([
    'Stagiar',
    'Email',
    'Start program',
    'Zile completate',
    'Progres %',
    'Validări mentor în așteptare',
    'Test teoretic (Ziua 10)',
    'Test promovat',
    'Certificat emis',
    'Data certificat',
    'Acte constatare',
    'Poze șantier',
    ...COMPETENCIES.map((c) => c.label),
    'Ultima activitate',
    'Status HR',
  ]);

  const lines = report.trainees.map((t) => row(traineeToCsvRow(t)));
  return `\uFEFF${header}\n${lines.join('\n')}`;
}

function traineeToCsvRow(t: TraineeHrReport): (string | number | boolean | null | undefined)[] {
  return [
    t.name,
    t.email,
    t.programStart,
    `${t.completedDays}/${t.totalDays}`,
    t.progressPercent,
    t.pendingMentorValidations.length
      ? t.pendingMentorValidations.map((d) => `Ziua ${d}`).join(', ')
      : '—',
    t.quizScoreLabel ?? '—',
    t.quizPassed == null ? '—' : t.quizPassed ? 'Da' : 'Nu',
    t.certificateIssued ? 'Da' : 'Nu',
    t.certificateDate ? formatRoDate(t.certificateDate) : '—',
    t.acteConstatareCount,
    t.photosCount,
    ...COMPETENCIES.map((c) => t.competencyScores[c.id] ?? 0),
    t.lastActivityAt ? formatRoDate(t.lastActivityAt) : '—',
    getTraineeStatusLabel(getTraineeStatus(t)),
  ];
}

function formatRoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function downloadCsv(report: HrAggregateReport): void {
  const csv = buildHrCsv(report);
  downloadBlob(csv, `artgranit-raport-hr-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
}

export async function downloadXlsx(report: HrAggregateReport): Promise<void> {
  const XLSX = await import('xlsx');
  const headers = [
    'Stagiar',
    'Email',
    'Start program',
    'Zile completate',
    'Progres %',
    'Validări mentor',
    'Test Z10',
    'Test promovat',
    'Certificat',
    'Data certificat',
    'Acte',
    'Poze',
    ...COMPETENCIES.map((c) => c.label),
    'Ultima activitate',
    'Status HR',
  ];
  const rows = report.trainees.map((t) => traineeToCsvRow(t));
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Progres stagiari');

  const summaryData = [
    ['artGRANIT — Raport HR'],
    ['Program', report.programVersion],
    ['Generat', formatRoDate(report.generatedAt)],
    [],
    ['Stagiari', report.summary.totalTrainees],
    ['Finalizați', report.summary.fullyCompleted],
    ['Certificate', report.summary.certificatesIssued],
    ['Validări în așteptare', report.summary.pendingValidationsTotal],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Rezumat');

  XLSX.writeFile(wb, `artgranit-raport-hr-${dateStamp()}.xlsx`);
}

export function downloadAuditCsv(entries: AuditLogRow[]): void {
  const header = row(['Data', 'Stagiar', 'Acțiune', 'Actor', 'Zi', 'Detalii']);
  const lines = entries.map((e) =>
    row([
      new Date(e.createdAt).toLocaleString('ro-RO'),
      e.traineeName,
      e.action,
      e.actorName,
      e.targetDayId ?? '—',
      e.details ?? '—',
    ]),
  );
  downloadBlob(`\uFEFF${header}\n${lines.join('\n')}`, `artgranit-audit-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHrReport(report: HrAggregateReport): void {
  const w = window.open('', '_blank');
  if (!w) return;

  const rows = report.trainees
    .map(
      (t) => `
    <tr>
      <td>${escapeHtml(t.name)}</td>
      <td>${t.completedDays}/${t.totalDays} (${t.progressPercent}%)</td>
      <td>${t.pendingMentorValidations.length ? t.pendingMentorValidations.map((d) => `Z${d}`).join(', ') : '—'}</td>
      <td>${t.quizScoreLabel ?? '—'}${t.quizPassed != null ? (t.quizPassed ? ' ✓' : ' ✗') : ''}</td>
      <td>${t.certificateIssued ? formatRoDate(t.certificateDate!) : '—'}</td>
      <td>${t.acteConstatareCount}</td>
    </tr>`,
    )
    .join('');

  w.document.write(`<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8"/>
  <title>Raport HR artGRANIT</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px; color: #1e293b; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; border-bottom: 3px solid #B38F55; padding-bottom: 10px; margin-bottom: 4px; }
    .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 28px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
    .stat strong { display: block; font-size: 20px; color: #1e293b; }
    .stat span { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #0c0c0c; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>artGRANIT — Raport HR Instruire Inginer Proiectant</h1>
  <p class="sub">Program v${escapeHtml(report.programVersion)} · Generat ${formatRoDate(report.generatedAt)}</p>
  <div class="summary">
    <div class="stat"><span>Stagiari</span><strong>${report.summary.totalTrainees}</strong></div>
    <div class="stat"><span>Program finalizat</span><strong>${report.summary.fullyCompleted}</strong></div>
    <div class="stat"><span>Certificate emise</span><strong>${report.summary.certificatesIssued}</strong></div>
    <div class="stat"><span>Validări în așteptare</span><strong>${report.summary.pendingValidationsTotal}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Stagiar</th>
        <th>Progres</th>
        <th>Validări mentor</th>
        <th>Test Z10</th>
        <th>Certificat</th>
        <th>Acte</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">artGRANIT © ${new Date().getFullYear()} — Document generat din aplicația Plan Instruire. Date locale browser; pentru raport multi-device activați Supabase.</p>
</body>
</html>`);
  w.document.close();
  w.print();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
