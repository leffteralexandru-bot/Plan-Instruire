import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendHrAlertEmail } from './_lib/sendEmail';
import type { HrAlert } from './_lib/types';

function authorize(req: VercelRequest): boolean {
  const secret = process.env.HR_ALERT_API_SECRET;
  if (!secret) return false;
  const header = req.headers['x-hr-alert-secret'];
  return typeof header === 'string' && header === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authorize(req)) {
    return res.status(401).json({ error: 'Neautorizat — verificați HR_ALERT_API_SECRET.' });
  }

  const body = req.body as { to?: string; alerts?: HrAlert[]; filter?: 'all' | 'critical' };
  const to = body.to ?? process.env.HR_ALERT_EMAIL;
  if (!to?.includes('@')) {
    return res.status(400).json({ error: 'Destinatar email invalid.' });
  }

  let alerts = body.alerts ?? [];
  if (body.filter === 'critical') {
    alerts = alerts.filter((a) => a.severity === 'critical');
  }

  if (!alerts.length) {
    return res.status(400).json({ error: 'Nicio alertă de trimis.' });
  }

  const result = await sendHrAlertEmail(to, alerts);
  if (!result.ok) {
    return res.status(502).json({ error: result.error ?? 'Eroare trimitere email' });
  }

  return res.status(200).json({ ok: true, sent: alerts.length, messageId: result.id });
}
