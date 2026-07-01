import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { computeHrAlerts } from '@/lib/hrAlerts';

const PUSH_DISMISS_KEY = 'artgranit_push_asked';

/** Notificări browser pentru mentor și admin HR */
export function useHrNotifications() {
  const { isMentor, isAdmin } = useAuth();
  const asked = useRef(false);

  useEffect(() => {
    if ((!isMentor && !isAdmin) || asked.current || !('Notification' in window)) return;
    if (Notification.permission === 'default' && !sessionStorage.getItem(PUSH_DISMISS_KEY)) {
      Notification.requestPermission();
      sessionStorage.setItem(PUSH_DISMISS_KEY, '1');
      asked.current = true;
    }
  }, [isMentor, isAdmin]);

  useEffect(() => {
    if ((!isMentor && !isAdmin) || Notification.permission !== 'granted') return;

    const critical = computeHrAlerts().filter((a) => a.severity === 'critical');
    if (!critical.length) return;

    const key = `hr-notif-${critical.map((a) => a.id).join(',')}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    new Notification('artGRANIT — Alertă HR', {
      body: critical.map((a) => a.title).join(' · '),
      icon: '/icons/icon-192.png',
    });
  }, [isMentor, isAdmin]);
}
