import type { ManagementDashboardMetrics } from '@/lib/managementDashboard';
import { MANAGEMENT_TREND_MONTHS } from '@/lib/managementDashboard';

function formatRoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatMonthLabel(luna: string): string {
  const [year, month] = luna.slice(0, 7).split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildManagementReportHtml(
  metrics: ManagementDashboardMetrics,
  opts: {
    reportRef: string;
    healthScore: number;
    healthLabel: string;
    healthClass: 'ok' | 'warn' | 'alert';
    executiveSummary: string;
    recommendations: string[];
    programVersion?: string;
  },
): string {
  const generated = formatRoDate(new Date().toISOString());

  const kpiCards = [
    { label: 'Angajați activi', value: String(metrics.totalAngajati) },
    {
      label: 'Progres instruire mediu',
      value: `${metrics.progresInstruireMediu}%`,
      sub: `${metrics.angajatiInInstruire} în program`,
    },
    {
      label: 'Finalizare instruire',
      value: `${metrics.rataFinalizareInstruire}%`,
      sub: `${metrics.certificateEmise} certificate`,
    },
    {
      label: 'Evaluări la timp',
      value: `${metrics.rataEvaluariLaTimp}%`,
      sub: `${metrics.evaluariIntarziate} întârziate`,
    },
    { label: 'Erori luna curentă', value: String(metrics.eroriLunaCurenta) },
    { label: 'Planuri acțiune', value: String(metrics.planuriActiuneDeschise) },
    { label: 'Re-instruiri active', value: String(metrics.reInstruiriActive) },
    {
      label: 'Validări mentor',
      value: String(metrics.validariMentorPending),
      sub: 'în așteptare',
    },
  ];

  const gapRows =
    metrics.developmentGaps.length === 0
      ? `<tr><td colspan="3" class="empty">Niciun gap identificat.</td></tr>`
      : metrics.developmentGaps
          .map(
            (g) => `<tr>
        <td>${escapeHtml(g.angajatName)}</td>
        <td class="score">${g.scorMediu}/5</td>
        <td>${escapeHtml(g.motiv)}</td>
      </tr>`,
          )
          .join('');

  const trendRows =
    metrics.trend.length === 0
      ? `<tr><td colspan="4" class="empty">Nu exista date istorice.</td></tr>`
      : metrics.trend
          .map(
            (p) => `<tr>
        <td>${escapeHtml(formatMonthLabel(p.luna))}</td>
        <td>${p.eroriLuna}</td>
        <td>${p.progresMediu}%</td>
        <td>${p.evaluariFinalizate}</td>
      </tr>`,
          )
          .join('');

  const recItems = opts.recommendations
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.45;
    color: #1e293b;
    background: #fff;
    padding: 0;
  }
  .page { padding: 0 4px; }
  .header {
    background: #0c0c0c;
    color: #fff;
    padding: 18px 20px 14px;
    border-bottom: 3px solid #b38f55;
    margin-bottom: 14px;
  }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: 0.02em; }
  .header .sub { font-size: 11px; color: #d4d4d4; margin-top: 4px; }
  .header .meta {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 10px;
    color: #a3a3a3;
  }
  .ref-bar {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 9px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .health {
    border: 1px solid #e2e8f0;
    border-left: 4px solid ${opts.healthClass === 'ok' ? '#16a34a' : opts.healthClass === 'warn' ? '#d97706' : '#dc2626'};
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 14px;
    background: #fcfcfb;
  }
  .health .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .health .row { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
  .health .score { font-size: 26px; font-weight: 700; }
  .health .verdict { font-size: 11px; font-weight: 600; color: ${opts.healthClass === 'ok' ? '#16a34a' : opts.healthClass === 'warn' ? '#d97706' : '#dc2626'}; }
  .summary {
    background: #fafaf9;
    border: 1px solid #b38f55;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
  }
  .summary h2 { font-size: 11px; font-weight: 700; margin-bottom: 6px; }
  .summary p { font-size: 10.5px; color: #475569; text-align: justify; }
  h2.section {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    margin: 16px 0 8px;
    padding-bottom: 4px;
    border-bottom: 2px solid #b38f55;
    width: fit-content;
    min-width: 120px;
  }
  .section-sub { font-size: 9px; color: #64748b; margin: -4px 0 10px; }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px;
    background: #f8fafc;
    min-height: 62px;
  }
  .kpi .lbl { font-size: 8.5px; color: #64748b; line-height: 1.2; }
  .kpi .val { font-size: 18px; font-weight: 700; margin-top: 4px; }
  .kpi .sub { font-size: 8px; color: #64748b; margin-top: 2px; }
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .panel {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .panel h3 { font-size: 10px; font-weight: 700; margin-bottom: 8px; }
  .panel .row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    padding: 5px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .panel .row:last-child { border-bottom: none; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 10px;
  }
  th {
    background: #1e293b;
    color: #fff;
    text-align: left;
    padding: 7px 8px;
    font-weight: 600;
  }
  td {
    padding: 7px 8px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f8fafc; }
  td.score { font-weight: 700; color: #dc2626; white-space: nowrap; }
  td.empty { font-style: italic; color: #94a3b8; text-align: center; }
  .recs { list-style: none; margin-bottom: 14px; }
  .recs li {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 6px;
    font-size: 10px;
    color: #334155;
  }
  .footer-note {
    font-size: 8.5px;
    color: #94a3b8;
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    text-align: justify;
  }
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 20px;
    font-size: 9px;
    color: #64748b;
  }
  .signatures .line { border-top: 1px solid #cbd5e1; margin-top: 28px; padding-top: 4px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>artGRANIT</h1>
    <div class="sub">Raport Management — Instruire și Performanță</div>
    <div class="meta">
      <span>Departament Ingineri Proiectanți</span>
      <span>${escapeHtml(generated)}</span>
    </div>
  </div>

  <div class="ref-bar">
    <span>Referință: ${escapeHtml(opts.reportRef)}</span>
    <span>Confidențial — uz intern</span>
  </div>

  <div class="health">
    <div class="label">Indice sănătate organizațională</div>
    <div class="row">
      <span class="score">${opts.healthScore}<span style="font-size:14px;font-weight:400">/100</span></span>
      <span class="verdict">${escapeHtml(opts.healthLabel)}</span>
    </div>
  </div>

  <div class="summary">
    <h2>Rezumat executiv</h2>
    <p>${escapeHtml(opts.executiveSummary)}</p>
  </div>

  <h2 class="section">Indicatori cheie (KPI)</h2>
  <p class="section-sub">Situație operațională la momentul generării</p>
  <div class="kpi-grid">
    ${kpiCards
      .map(
        (k) => `<div class="kpi">
      <div class="lbl">${escapeHtml(k.label)}</div>
      <div class="val">${escapeHtml(k.value)}</div>
      ${k.sub ? `<div class="sub">${escapeHtml(k.sub)}</div>` : ''}
    </div>`,
      )
      .join('')}
  </div>

  <div class="panels">
    <div class="panel">
      <h3>Sănătate evaluări (90 zile)</h3>
      <div class="row"><span>La timp / în curs</span><strong>${metrics.evaluariLaTimp}</strong></div>
      <div class="row"><span>Întârziate</span><strong>${metrics.evaluariIntarziate}</strong></div>
      <div class="row"><span>În desfășurare</span><strong>${metrics.evaluariInCurs}</strong></div>
      <div class="row"><span>Rată conformitate</span><strong>${metrics.rataEvaluariLaTimp}%</strong></div>
    </div>
    <div class="panel">
      <h3>Operațiuni deschise</h3>
      <div class="row"><span>Re-instruiri active</span><strong>${metrics.reInstruiriActive}</strong></div>
      <div class="row"><span>Validări mentor pending</span><strong>${metrics.validariMentorPending}</strong></div>
      <div class="row"><span>Planuri acțiune</span><strong>${metrics.planuriActiuneDeschise}</strong></div>
      <div class="row"><span>Erori luna curentă</span><strong>${metrics.eroriLunaCurenta}</strong></div>
    </div>
  </div>

  <h2 class="section">Analiză trend</h2>
  <p class="section-sub">Ultimele ${MANAGEMENT_TREND_MONTHS} luni (1 an)</p>
  <table>
    <thead><tr><th>Lună</th><th>Erori</th><th>Progres mediu</th><th>Evaluări finalizate</th></tr></thead>
    <tbody>${trendRows}</tbody>
  </table>

  <h2 class="section">Gap-uri dezvoltare</h2>
  <p class="section-sub">Scor sub 3,5 sau plan de dezvoltare lipsă</p>
  <table>
    <thead><tr><th>Angajat</th><th>Scor</th><th>Motiv</th></tr></thead>
    <tbody>${gapRows}</tbody>
  </table>

  <h2 class="section">Recomandări prioritare</h2>
  <ul class="recs">${recItems}</ul>

  ${opts.programVersion ? `<p style="font-size:9px;color:#64748b;margin-bottom:8px">Versiune program instruire: ${escapeHtml(opts.programVersion)}</p>` : ''}

  <div class="signatures">
    <div><div class="line">Responsabil HR / Instruire</div></div>
    <div><div class="line">Management / Aprobare</div></div>
  </div>

  <p class="footer-note">
    Document generat automat din platforma artGRANIT Instruire Ingineri.
    Datele reflectă starea la momentul generării (${escapeHtml(generated)}).
  </p>
</div>
</body>
</html>`;
}
