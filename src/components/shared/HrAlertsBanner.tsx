import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dismissHrAlert, getAlertsForActor, type HrAlert } from '@/lib/hrAlerts';
import { openHrAlertEmailDraft } from '@/lib/emailAlerts';
import { Button } from '@/components/ui/Button';

export function HrAlertsBanner() {
  const { user, canAccessAdmin, canAccessMentor } = useAuth();
  const isHrOrAdmin = canAccessAdmin;
  const showAlerts = isHrOrAdmin || canAccessMentor;
  const [alerts, setAlerts] = useState<HrAlert[]>([]);

  useEffect(() => {
    if (!showAlerts || !user) return;
    setAlerts(getAlertsForActor(user.id, isHrOrAdmin).slice(0, 3));
  }, [showAlerts, user, isHrOrAdmin]);

  if (!showAlerts) return null;
  if (!alerts.length) return null;

  const severityStyle: Record<HrAlert['severity'], string> = {
    info: 'bg-corporate-gold-light border-corporate-gold/30 text-corporate-stone',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className="space-y-2 mb-4">
      <div className="flex flex-wrap justify-end gap-2 mb-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => openHrAlertEmailDraft('all')}>
          Draft email alerte
        </Button>
      </div>
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm ${severityStyle[a.severity]}`}
        >
          <div>
            <strong>{a.title}</strong>
            <span className="ml-2 opacity-80">{a.message}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              dismissHrAlert(a.id);
              setAlerts((prev) => prev.filter((x) => x.id !== a.id));
            }}
          >
            OK
          </Button>
        </div>
      ))}
    </div>
  );
}
