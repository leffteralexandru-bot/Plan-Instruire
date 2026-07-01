import type { HrAlert, HrPerformancePayload } from './types';

const EVALUATION_ALERT_DAYS = 7;

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function profileName(payload: HrPerformancePayload, userId: string): string {
  const p = payload.profiles.find((x) => x.userId === userId);
  return p ? `${p.prenume} ${p.nume}`.trim() : userId;
}

/** Calcule alerte HR din payload Supabase (fără progres instruire local) */
export function computeAlertsFromHrPayload(payload: HrPerformancePayload): HrAlert[] {
  const alerts: HrAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const profile of payload.profiles) {
    const name = `${profile.prenume} ${profile.nume}`.trim();
    const active = payload.evaluations
      .filter((e) => e.angajatId === profile.userId && e.status !== 'evaluat')
      .sort((a, b) => a.termenReevaluare.localeCompare(b.termenReevaluare));

    const current = active[0];
    if (!current) continue;

    const days = daysUntil(current.termenReevaluare);
    if (current.status === 'intarziat' || current.termenReevaluare < today) {
      alerts.push({
        id: `eval-overdue-${profile.userId}`,
        severity: 'critical',
        title: `Evaluare întârziată — ${name}`,
        message: `Termen ${current.termenReevaluare}`,
        traineeId: profile.userId,
      });
    } else if (days >= 0 && days <= EVALUATION_ALERT_DAYS) {
      alerts.push({
        id: `eval-due-${profile.userId}`,
        severity: 'warning',
        title: `Evaluare în ${days} zile — ${name}`,
        message: `Termen reevaluare: ${current.termenReevaluare}`,
        traineeId: profile.userId,
      });
    }
  }

  for (const err of payload.errorCases) {
    if (err.planActiune.status === 'inchis') continue;
    if (err.planActiune.termenLimita < today) {
      alerts.push({
        id: `action-overdue-${err.id}`,
        severity: 'warning',
        title: `Plan acțiune depășit — ${profileName(payload, err.angajatId)}`,
        message: err.proiectNume ?? err.descriere.slice(0, 80),
        traineeId: err.angajatId,
      });
    }
  }

  return alerts;
}

export function buildAlertEmailHtml(alerts: HrAlert[]): string {
  const rows = alerts
    .map(
      (a) =>
        `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${a.severity}</td><td style="padding:8px;border:1px solid #e2e8f0;"><strong>${escapeHtml(a.title)}</strong><br/><span style="color:#64748b;font-size:13px;">${escapeHtml(a.message)}</span></td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html><body style="font-family:Segoe UI,sans-serif;color:#1e293b;max-width:640px;margin:0 auto;padding:24px;">
<h1 style="font-size:20px;border-bottom:3px solid #B38F55;padding-bottom:8px;">artGRANIT — Alerte HR</h1>
<p style="color:#64748b;font-size:14px;">${alerts.length} alerte active · ${new Date().toLocaleDateString('ro-RO')}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
<thead><tr style="background:#0c0c0c;color:#fff;"><th style="padding:8px;text-align:left;">Nivel</th><th style="padding:8px;text-align:left;">Detaliu</th></tr></thead>
<tbody>${rows}</tbody></table>
<p style="margin-top:24px;font-size:12px;color:#94a3b8;">Platformă Plan Instruire & Performanță · artGRANIT</p>
</body></html>`;
}

export function buildAlertEmailText(alerts: HrAlert[]): string {
  return [
    'Alerte artGRANIT — Plan Instruire & Performanță',
    '',
    ...alerts.map((a) => `[${a.severity.toUpperCase()}] ${a.title} — ${a.message}`),
    '',
    `Total: ${alerts.length}`,
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
