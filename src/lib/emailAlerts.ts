import type { HrAlert } from '@/lib/hrAlerts';
import { computeHrAlerts } from '@/lib/hrAlerts';
import { userStore } from '@/lib/userStore';

const HR_EMAIL_KEY = 'artgranit_hr_alert_email';

export function getHrAlertEmail(): string {
  const fromEnv = import.meta.env.VITE_HR_ALERT_EMAIL as string | undefined;
  if (fromEnv?.includes('@')) return fromEnv;
  try {
    return localStorage.getItem(HR_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setHrAlertEmail(email: string): void {
  localStorage.setItem(HR_EMAIL_KEY, email.trim());
}

export function buildAlertEmailBody(alerts: HrAlert[]): string {
  const lines = [
    'Bună ziua,',
    '',
    'Alerte artGRANIT — Plan Instruire & Performanță:',
    '',
    ...alerts.map((a) => `• [${a.severity.toUpperCase()}] ${a.title} — ${a.message}`),
    '',
    `Total alerte: ${alerts.length}`,
    '',
    '—',
    'Mesaj generat automat din platforma artGRANIT.',
  ];
  return lines.join('\n');
}

export function buildAlertMailtoUrl(alerts: HrAlert[], toEmail?: string): string {
  const to = toEmail || getHrAlertEmail() || 'e.vasilescu@artgranit.ro';
  const subject = encodeURIComponent(`artGRANIT — ${alerts.length} alerte HR (${new Date().toLocaleDateString('ro-RO')})`);
  const body = encodeURIComponent(buildAlertEmailBody(alerts));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

/** Deschide clientul de email cu alertele curente */
export function openHrAlertEmailDraft(filter?: 'critical' | 'all'): void {
  let alerts = computeHrAlerts();
  if (filter === 'critical') alerts = alerts.filter((a) => a.severity === 'critical');

  if (!alerts.length) return;

  window.location.href = buildAlertMailtoUrl(alerts);
}

/** Email către angajat pentru termen evaluare */
export function openEvaluationReminderEmail(angajatUserId: string): void {
  const profile = userStore.getUserById(angajatUserId);
  const hrEmail = getHrAlertEmail();
  if (!profile) return;

  const subject = encodeURIComponent(`Reminder evaluare — ${profile.name}`);
  const body = encodeURIComponent(
    `Bună ziua,\n\nVă reamintim că termenul de evaluare tri-lunară pentru ${profile.name} se apropie.\n\nVerificați panoul HR artGRANIT.\n\n— artGRANIT HR`,
  );
  const cc = hrEmail ? `&cc=${encodeURIComponent(hrEmail)}` : '';
  window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}${cc}`;
}

export function getAlertableCount(): number {
  return computeHrAlerts().length;
}

export interface AutoSendResult {
  ok: boolean;
  message: string;
  sent?: number;
}

const LAST_AUTO_SEND_KEY = 'artgranit_hr_last_auto_email';

export function getLastAutoEmailSent(): string | null {
  try {
    return localStorage.getItem(LAST_AUTO_SEND_KEY);
  } catch {
    return null;
  }
}

export function isAutoEmailConfigured(): boolean {
  const secret = import.meta.env.VITE_HR_ALERT_API_SECRET as string | undefined;
  return Boolean(secret?.length);
}

/** Trimite alerte via API Vercel + Resend (necesită deploy + variabile server) */
export async function sendHrAlertsAutomatically(
  filter: 'critical' | 'all' = 'all',
): Promise<AutoSendResult> {
  const secret = import.meta.env.VITE_HR_ALERT_API_SECRET as string | undefined;
  if (!secret) {
    return {
      ok: false,
      message: 'Trimiterea automată necesită VITE_HR_ALERT_API_SECRET în .env.local (deploy Vercel).',
    };
  }

  let alerts = computeHrAlerts();
  if (filter === 'critical') alerts = alerts.filter((a) => a.severity === 'critical');
  if (!alerts.length) {
    return { ok: false, message: 'Nicio alertă de trimis.' };
  }

  const to = getHrAlertEmail();
  if (!to.includes('@')) {
    return { ok: false, message: 'Configurați emailul HR (destinatar) mai întâi.' };
  }

  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  const url = `${base}/api/send-hr-alerts`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hr-alert-secret': secret,
      },
      body: JSON.stringify({ to, alerts, filter }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string; sent?: number };

    if (!res.ok) {
      return { ok: false, message: data.error ?? `Eroare HTTP ${res.status}` };
    }

    localStorage.setItem(LAST_AUTO_SEND_KEY, new Date().toISOString());
    return {
      ok: true,
      message: `Email trimis cu ${data.sent ?? alerts.length} alerte.`,
      sent: data.sent ?? alerts.length,
    };
  } catch {
    return {
      ok: false,
      message: 'API indisponibil — funcționează doar după deploy Vercel (sau vercel dev).',
    };
  }
}
