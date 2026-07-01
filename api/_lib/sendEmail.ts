import { buildAlertEmailHtml, buildAlertEmailText } from './computeAlerts';
import type { HrAlert } from './types';

interface SendResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function sendHrAlertEmail(to: string, alerts: HrAlert[]): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY lipsește din variabilele Vercel.' };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'artGRANIT HR <onboarding@resend.dev>';
  const subject = `artGRANIT — ${alerts.length} alerte HR (${new Date().toLocaleDateString('ro-RO')})`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: buildAlertEmailText(alerts),
      html: buildAlertEmailHtml(alerts),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err || `Resend HTTP ${res.status}` };
  }

  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}
