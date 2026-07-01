import { useEffect, useRef } from 'react';
import { ALL_DAYS } from '@/data/trainingPlan';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';

export function useNotifications() {
  const { isMentor } = useAuth();
  const { getDayProgress, isDayComplete } = useProgress();
  const asked = useRef(false);

  useEffect(() => {
    if (!isMentor || asked.current || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
      asked.current = true;
    }
  }, [isMentor]);

  useEffect(() => {
    if (!isMentor || Notification.permission !== 'granted') return;

    const pending = ALL_DAYS.filter(
      (d) => d.requiresMentorValidation && !getDayProgress(d.id).mentorValidated,
    ).filter((d) => {
      const p = getDayProgress(d.id);
      return d.tasks.every((t) => p.completedTasks.includes(t.id));
    });

    if (pending.length > 0) {
      const key = `notif-${pending.map((d) => d.id).join(',')}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      new Notification('artGRANIT — Validări în așteptare', {
        body: `${pending.length} zi/zile necesită validarea dvs.: ${pending.map((d) => `Ziua ${d.dayNumber}`).join(', ')}`,
        icon: '/icons/icon-192.png',
      });
    }
  }, [isMentor, getDayProgress, isDayComplete]);
}
