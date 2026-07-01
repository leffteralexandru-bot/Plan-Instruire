import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getHrAlertEmail,
  setHrAlertEmail,
  openHrAlertEmailDraft,
  getAlertableCount,
  sendHrAlertsAutomatically,
  getLastAutoEmailSent,
  isAutoEmailConfigured,
} from '@/lib/emailAlerts';

export function HrEmailSettingsPanel() {
  const [email, setEmail] = useState(getHrAlertEmail());
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [autoResult, setAutoResult] = useState<string | null>(null);
  const alertCount = getAlertableCount();
  const autoConfigured = isAutoEmailConfigured();
  const lastSent = getLastAutoEmailSent();

  async function handleAutoSend(filter: 'all' | 'critical') {
    setSending(true);
    setAutoResult(null);
    const result = await sendHrAlertsAutomatically(filter);
    setAutoResult(result.message);
    setSending(false);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Alerte email</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Draft manual (mailto) sau trimitere automată via Resend după deploy Vercel. Cron zilnic la 08:00
        (ora României) din datele HR sincronizate în Supabase.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 max-w-lg mb-4">
        <Input
          label="Email HR (destinatar alerte)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.vasilescu@artgranit.ro"
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setHrAlertEmail(email);
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }}
          >
            Salvează email HR
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-corporate-muted">
        <p className="font-medium text-corporate-dark mb-1">Trimitere automată (Resend)</p>
        <ul className="list-disc pl-4 space-y-0.5 text-xs">
          <li>
            <code className="bg-white px-1 rounded">RESEND_API_KEY</code>,{' '}
            <code className="bg-white px-1 rounded">RESEND_FROM_EMAIL</code> — Vercel (server)
          </li>
          <li>
            <code className="bg-white px-1 rounded">HR_ALERT_API_SECRET</code> +{' '}
            <code className="bg-white px-1 rounded">VITE_HR_ALERT_API_SECRET</code> — aceeași valoare
          </li>
          <li>
            <code className="bg-white px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> +{' '}
            <code className="bg-white px-1 rounded">CRON_SECRET</code> — cron zilnic
          </li>
        </ul>
        <p className="mt-2 text-xs">
          Status:{' '}
          {autoConfigured ? (
            <span className="text-emerald-600">API secret configurat</span>
          ) : (
            <span className="text-amber-600">Necesită VITE_HR_ALERT_API_SECRET</span>
          )}
          {lastSent && (
            <span className="block mt-1">
              Ultima trimitere manuală: {new Date(lastSent).toLocaleString('ro-RO')}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={alertCount === 0 || sending || !autoConfigured}
          onClick={() => handleAutoSend('all')}
        >
          {sending ? 'Se trimite…' : `Trimite automat (${alertCount})`}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={alertCount === 0 || sending || !autoConfigured}
          onClick={() => handleAutoSend('critical')}
        >
          Auto — doar critice
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={alertCount === 0}
          onClick={() => openHrAlertEmailDraft('all')}
        >
          Draft mailto ({alertCount})
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={alertCount === 0}
          onClick={() => openHrAlertEmailDraft('critical')}
        >
          Draft — critice
        </Button>
      </div>
      {saved && <p className="text-sm text-emerald-600 mt-2">Email HR salvat.</p>}
      {autoResult && (
        <p className={`text-sm mt-2 ${autoResult.includes('trimis') ? 'text-emerald-600' : 'text-amber-700'}`}>
          {autoResult}
        </p>
      )}
    </Card>
  );
}
