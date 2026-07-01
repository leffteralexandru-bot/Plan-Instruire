import { STAGIARI } from '@/data/users';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel, getMentorWorkload } from '@/lib/hrAnalytics';

export type HrAlertSeverity = 'info' | 'warning' | 'critical';

export interface HrAlert {
  id: string;
  severity: HrAlertSeverity;
  title: string;
  message: string;
  traineeId?: string;
}

const ALERT_DISMISS_KEY = 'artgranit_hr_alerts_dismissed';

export function computeHrAlerts(): HrAlert[] {
  const alerts: HrAlert[] = [];
  const getProgress = (id: string) => storage.getProgress(id);

  for (const t of STAGIARI) {
    const row = buildTraineeHrReport(t, getProgress(t.id));
    const status = getTraineeStatus(row);

    if (status === 'behind') {
      alerts.push({
        id: `behind-${t.id}`,
        severity: 'critical',
        title: `${t.name} — întârziat`,
        message: `Progres ${row.progressPercent}% · ${getTraineeStatusLabel(status)}`,
        traineeId: t.id,
      });
    } else if (status === 'at_risk') {
      alerts.push({
        id: `risk-${t.id}`,
        severity: 'warning',
        title: `${t.name} — risc moderat`,
        message: `Progres ${row.progressPercent}% — sub ritmul așteptat al programului`,
        traineeId: t.id,
      });
    }

    if (row.quizPassed === false) {
      alerts.push({
        id: `quiz-${t.id}`,
        severity: 'warning',
        title: `Test teoretic nepromovat — ${t.name}`,
        message: row.quizScoreLabel ?? 'Test Ziua 10 nepromovat',
        traineeId: t.id,
      });
    }
  }

  const workload = getMentorWorkload(STAGIARI, getProgress);
  if (workload.length > 0) {
    const total = workload.reduce((n, w) => n + w.pendingDayNumbers.length, 0);
    alerts.push({
      id: 'mentor-queue',
      severity: 'warning',
      title: 'Validări mentor în așteptare',
      message: `${total} validări pentru ${workload.length} stagiar(i)`,
    });
  }

  return alerts;
}

export function getVisibleHrAlerts(): HrAlert[] {
  const dismissed = new Set<string>(
    JSON.parse(sessionStorage.getItem(ALERT_DISMISS_KEY) ?? '[]') as string[],
  );
  return computeHrAlerts().filter((a) => !dismissed.has(a.id));
}

export function dismissHrAlert(id: string): void {
  const dismissed = new Set<string>(
    JSON.parse(sessionStorage.getItem(ALERT_DISMISS_KEY) ?? '[]') as string[],
  );
  dismissed.add(id);
  sessionStorage.setItem(ALERT_DISMISS_KEY, JSON.stringify([...dismissed]));
}
