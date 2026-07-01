import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { computeAlertsFromHrPayload } from './_lib/computeAlerts';
import { sendHrAlertEmail } from './_lib/sendEmail';
import type { HrPerformancePayload } from './_lib/types';

const HR_ROW_ID = 'artgranit-org';

function authorizeCron(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authorizeCron(req)) {
    return res.status(401).json({ error: 'Cron neautorizat' });
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const to = process.env.HR_ALERT_EMAIL ?? process.env.VITE_HR_ALERT_EMAIL;

  if (!url || !serviceKey) {
    return res.status(503).json({ error: 'Supabase service role neconfigurat.' });
  }
  if (!to?.includes('@')) {
    return res.status(503).json({ error: 'HR_ALERT_EMAIL neconfigurat.' });
  }

  const sb = createClient(url, serviceKey);
  const { data, error } = await sb
    .from('hr_performance')
    .select('data')
    .eq('id', HR_ROW_ID)
    .maybeSingle();

  if (error) {
    return res.status(502).json({ error: error.message });
  }

  if (!data?.data) {
    return res.status(200).json({ ok: true, sent: 0, message: 'Nicio dată HR în cloud — sync mai întâi.' });
  }

  const payload = data.data as HrPerformancePayload;
  const alerts = computeAlertsFromHrPayload(payload);

  if (!alerts.length) {
    return res.status(200).json({ ok: true, sent: 0, message: 'Nicio alertă activă.' });
  }

  const result = await sendHrAlertEmail(to, alerts);
  if (!result.ok) {
    return res.status(502).json({ error: result.error });
  }

  return res.status(200).json({ ok: true, sent: alerts.length, messageId: result.id });
}
