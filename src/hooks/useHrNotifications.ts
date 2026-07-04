import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAlertsForActor } from '@/lib/hrAlerts';
import { getSupervisedEmployeeIds } from '@/lib/supervisor';

const PUSH_DISMISS_KEY = 'artgranit_push_asked';

/** Notificări browser pentru HR, admin, supervizori și traineri */
export function useHrNotifications() {
  const { user, canAccessAdmin, canAccessMentor } = useAuth();
  const isHrOrAdmin = canAccessAdmin;
  const hasSupervisorDuties =
    !!user &&
    (isHrOrAdmin ||
      canAccessMentor ||
      getSupervisedEmployeeIds(user.id).length > 0);
  const canNotify = hasSupervisorDuties;
  const asked = useRef(false);

  useEffect(() => {
    if (!canNotify || asked.current || !('Notification' in window)) return;
    if (Notification.permission === 'default' && !sessionStorage.getItem(PUSH_DISMISS_KEY)) {
      Notification.requestPermission();
      sessionStorage.setItem(PUSH_DISMISS_KEY, '1');
      asked.current = true;
    }
  }, [canNotify]);

  useEffect(() => {
    if (!canNotify || !user || Notification.permission !== 'granted') return;

    const critical = getAlertsForActor(user.id, isHrOrAdmin).filter((a) => a.severity === 'critical');
    if (!critical.length) return;

    const key = `hr-notif-${critical.map((a) => a.id).join(',')}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    new Notification('artGRANIT — Alertă', {
      body: critical.map((a) => a.title).join(' · '),
      icon: '/icons/icon-192.png',
    });
  }, [canNotify, user, isHrOrAdmin]);
}
