import { MANAGEMENT_TREND_MONTHS, type ManagementDashboardMetrics } from '@/lib/managementDashboard';
import {
  PDF_BRAND,
  createPdfLayout,
  drawBrandedReportHeader,
  drawDataTable,
  drawExecutiveSummaryBox,
  drawHealthScoreCard,
  drawKpiCard,
  drawMetricRow,
  drawRecommendationsList,
  drawSectionTitle,
  drawSignatureBlock,
  drawTwoColumnPanels,
  generateReportReference,
  loadBrandLogoWhitePng,
  stampFootersOnAllPages,
  type PdfAccent,
} from '@/lib/pdfBrandKit';
import { registerPdfUnicodeFonts } from '@/lib/pdfUnicodeFont';

export interface ManagementReportOptions {
  programVersion?: string;
}

function formatMonthLabel(luna: string): string {
  const [year, month] = luna.slice(0, 7).split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
}

function computeOrganizationalHealth(m: ManagementDashboardMetrics): {
  score: number;
  label: string;
  accent: PdfAccent;
} {
  let score = 100;
  if (m.evaluariIntarziate > 0) score -= Math.min(25, m.evaluariIntarziate * 8);
  if (m.rataFinalizareInstruire < 50) score -= 15;
  else if (m.rataFinalizareInstruire < 75) score -= 8;
  if (m.progresInstruireMediu < 50) score -= 12;
  else if (m.progresInstruireMediu < 70) score -= 5;
  if (m.eroriLunaCurenta > 3) score -= 12;
  else if (m.eroriLunaCurenta > 0) score -= 4;
  if (m.planuriActiuneDeschise > 5) score -= 10;
  else if (m.planuriActiuneDeschise > 0) score -= 3;
  if (m.developmentGaps.length > 3) score -= 10;
  else if (m.developmentGaps.length > 0) score -= 4;
  if (m.validariMentorPending > 10) score -= 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 80) return { score, label: 'Situație bună — monitorizare de rutină', accent: 'ok' };
  if (score >= 60) return { score, label: 'Atenție moderată — acțiuni recomandate', accent: 'warn' };
  return { score, label: 'Risc operațional — intervenție prioritară', accent: 'alert' };
}

function buildExecutiveSummary(m: ManagementDashboardMetrics, health: number): string {
  const parts: string[] = [];
  parts.push(
    `La data raportului, organizația înregistrează un indice de sănătate de ${health}/100, cu ${m.totalAngajati} angajați activi și ${m.angajatiInInstruire} participanți la programul de instruire.`,
  );
  parts.push(
    `Progresul mediu al instruirii este ${m.progresInstruireMediu}%, cu o rată de finalizare de ${m.rataFinalizareInstruire}% (${m.certificateEmise} certificate emise).`,
  );
  parts.push(
    `În ciclul de evaluare curent: ${m.rataEvaluariLaTimp}% la timp, ${m.evaluariIntarziate} întârziate și ${m.evaluariInCurs} în desfășurare.`,
  );
  if (m.eroriLunaCurenta || m.reInstruiriActive || m.developmentGaps.length) {
    parts.push(
      `Puncte de atenție: ${m.eroriLunaCurenta} erori în luna curentă, ${m.reInstruiriActive} re-instruiri active, ${m.developmentGaps.length} gap-uri de dezvoltare.`,
    );
  }
  return parts.join(' ');
}

function buildExpertRecommendations(m: ManagementDashboardMetrics): string[] {
  const recs: string[] = [];
  if (m.evaluariIntarziate > 0) {
    recs.push(
      `P1 — Evaluări: ${m.evaluariIntarziate} cicluri întârziate. Planificați evaluările în următoarele 7 zile lucrătoare.`,
    );
  }
  if (m.validariMentorPending > 0) {
    recs.push(
      `P2 — Instruire: ${m.validariMentorPending} validări mentor în așteptare. Alocați timp mentorilor pentru deblocarea progresului.`,
    );
  }
  if (m.rataFinalizareInstruire < 60) {
    recs.push(
      `P3 — Retenție program: rata de finalizare ${m.rataFinalizareInstruire}% este sub ținta de 60%.`,
    );
  }
  if (m.eroriLunaCurenta > 0) {
    recs.push(`P4 — Calitate: ${m.eroriLunaCurenta} erori înregistrate luna curentă.`);
  }
  if (m.developmentGaps.length > 0) {
    recs.push(
      `P5 — Dezvoltare: ${m.developmentGaps.length} angajați cu scor sub prag sau fără plan de dezvoltare.`,
    );
  }
  if (recs.length === 0) {
    recs.push('Situație stabilă: indicatorii sunt în parametri normali. Mențineți raportul lunar.');
  }
  return recs.slice(0, 5);
}

function drawKpiGrid(ctx: ReturnType<typeof createPdfLayout>, metrics: ManagementDashboardMetrics) {
  drawSectionTitle(ctx, 'Indicatori cheie (KPI)', 'Situație operațională la momentul generării');

  const kpis: Array<{
    label: string;
    value: string;
    sub?: string;
    accent?: PdfAccent;
  }> = [
    { label: 'Angajați activi', value: String(metrics.totalAngajati) },
    {
      label: 'Progres instruire mediu',
      value: `${metrics.progresInstruireMediu}%`,
      sub: `${metrics.angajatiInInstruire} în program`,
      accent: metrics.progresInstruireMediu >= 60 ? 'ok' : 'warn',
    },
    {
      label: 'Finalizare instruire',
      value: `${metrics.rataFinalizareInstruire}%`,
      sub: `${metrics.certificateEmise} certificate`,
      accent: metrics.rataFinalizareInstruire >= 60 ? 'ok' : 'alert',
    },
    {
      label: 'Evaluări la timp',
      value: `${metrics.rataEvaluariLaTimp}%`,
      sub: `${metrics.evaluariIntarziate} întârziate`,
      accent: metrics.evaluariIntarziate === 0 ? 'ok' : 'warn',
    },
    {
      label: 'Erori luna curentă',
      value: String(metrics.eroriLunaCurenta),
      accent: metrics.eroriLunaCurenta === 0 ? 'ok' : 'warn',
    },
    {
      label: 'Planuri acțiune',
      value: String(metrics.planuriActiuneDeschise),
      accent: metrics.planuriActiuneDeschise === 0 ? 'ok' : 'warn',
    },
    { label: 'Re-instruiri active', value: String(metrics.reInstruiriActive) },
    {
      label: 'Validări mentor',
      value: String(metrics.validariMentorPending),
      sub: 'în așteptare',
      accent: metrics.validariMentorPending === 0 ? 'ok' : 'warn',
    },
  ];

  const cardW = (ctx.contentW - 4) / 2;
  const cardH = 20;
  let rowY = ctx.y;

  for (let i = 0; i < kpis.length; i += 2) {
    const left = kpis[i];
    const right = kpis[i + 1];
    drawKpiCard(ctx, ctx.margin, rowY, cardW, cardH, left.label, left.value, left.sub, left.accent);
    if (right) {
      drawKpiCard(
        ctx,
        ctx.margin + cardW + 4,
        rowY,
        cardW,
        cardH,
        right.label,
        right.value,
        right.sub,
        right.accent,
      );
    }
    rowY += cardH + 4;
  }
  ctx.y = rowY + 4;
}

/** Raport PDF vectorial — text clar, diacritice românești (DejaVu Sans) */
async function buildManagementDashboardPdfDoc(
  metrics: ManagementDashboardMetrics,
  options?: ManagementReportOptions,
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  await registerPdfUnicodeFonts(doc);

  const ctx = createPdfLayout(doc);
  const health = computeOrganizationalHealth(metrics);
  const reportRef = generateReportReference('MGT');
  const logoPng = await loadBrandLogoWhitePng();

  await drawBrandedReportHeader(ctx, {
    title: 'Raport Management',
    subtitle: 'Instruire · Evaluări · Calitate · Dezvoltare',
    department: 'Departament Ingineri',
    reportRef,
    logoPng,
  });

  drawHealthScoreCard(ctx, health.score, health.label, health.accent);
  drawExecutiveSummaryBox(ctx, 'Rezumat executiv', buildExecutiveSummary(metrics, health.score));
  drawKpiGrid(ctx, metrics);

  drawTwoColumnPanels(
    ctx,
    'Sănătate evaluări (90 zile)',
    'Operațiuni deschise',
    (left) => {
      drawMetricRow(left, 'La timp / în curs', String(metrics.evaluariLaTimp), 'ok');
      drawMetricRow(
        left,
        'Întârziate',
        String(metrics.evaluariIntarziate),
        metrics.evaluariIntarziate ? 'warn' : 'ok',
      );
      drawMetricRow(left, 'În desfășurare', String(metrics.evaluariInCurs));
      drawMetricRow(left, 'Rată conformitate', `${metrics.rataEvaluariLaTimp}%`);
    },
    (right) => {
      drawMetricRow(right, 'Re-instruiri active', String(metrics.reInstruiriActive));
      drawMetricRow(right, 'Validări mentor', String(metrics.validariMentorPending));
      drawMetricRow(right, 'Planuri acțiune', String(metrics.planuriActiuneDeschise));
      drawMetricRow(right, 'Erori luna curentă', String(metrics.eroriLunaCurenta));
    },
  );

  if (metrics.trend.length > 0) {
    drawSectionTitle(
      ctx,
      'Trend lunar',
      `Ultimele ${MANAGEMENT_TREND_MONTHS} luni (1 an)`,
    );
    drawDataTable(
      ctx,
      [
        { label: 'Lună', width: 40 },
        { label: 'Erori', width: 22 },
        { label: 'Progres %', width: 28 },
        { label: 'Evaluări finalizate', width: ctx.contentW - 90 },
      ],
      metrics.trend.map((p) => [
        formatMonthLabel(p.luna),
        String(p.eroriLuna),
        `${p.progresMediu}%`,
        String(p.evaluariFinalizate),
      ]),
      'Nu există date istorice.',
    );
  }

  drawSectionTitle(ctx, 'Gap-uri dezvoltare', 'Scor sub 3,5 sau plan de dezvoltare lipsă');
  drawDataTable(
    ctx,
    [
      { label: 'Angajat', width: 55 },
      { label: 'Scor', width: 18 },
      { label: 'Motiv', width: ctx.contentW - 73 },
    ],
    metrics.developmentGaps.map((g) => [g.angajatName, `${g.scorMediu}/5`, g.motiv]),
    'Niciun gap identificat.',
  );

  drawRecommendationsList(ctx, buildExpertRecommendations(metrics));

  if (options?.programVersion) {
    const { doc: pdf, margin } = ctx;
    pdf.setFontSize(7);
    pdf.setTextColor(...PDF_BRAND.slate500);
    pdf.text(`Versiune program instruire: ${options.programVersion}`, margin, ctx.y);
    ctx.y += 5;
  }

  drawSignatureBlock(ctx);
  stampFootersOnAllPages(doc, 'Raport Management');

  return doc;
}

function pdfFileName(): string {
  return `raport-management-artgranit-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export async function openManagementDashboardPdf(
  metrics: ManagementDashboardMetrics,
  options?: ManagementReportOptions,
): Promise<void> {
  const doc = await buildManagementDashboardPdfDoc(metrics, options);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    doc.save(pdfFileName());
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export async function downloadManagementDashboardPdf(
  metrics: ManagementDashboardMetrics,
  options?: ManagementReportOptions,
): Promise<void> {
  const doc = await buildManagementDashboardPdfDoc(metrics, options);
  doc.save(pdfFileName());
}

export { computeOrganizationalHealth, buildExpertRecommendations, MANAGEMENT_TREND_MONTHS };
