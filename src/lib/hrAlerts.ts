import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel, getMentorWorkload } from '@/lib/hrAnalytics';
import { hrPerformanceStore, EVALUATION_ALERT_DAYS, EVALUATION_STATUS_LABELS } from '@/lib/hrPerformanceStore';

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
  const trainees = userStore.getTraineeProfiles();
  const getProgress = (id: string) => storage.getProgress(id);

  for (const t of trainees) {
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

  const workload = getMentorWorkload(trainees, getProgress);
  if (workload.length > 0) {
    const total = workload.reduce((n, w) => n + w.pendingDayNumbers.length, 0);
    alerts.push({
      id: 'mentor-queue',
      severity: 'warning',
      title: 'Validări mentor în așteptare',
      message: `${total} validări pentru ${workload.length} stagiar(i)`,
    });
  }

  for (const profile of hrPerformanceStore.getProfiles()) {
    const name = `${profile.prenume} ${profile.nume}`.trim();
    const current = hrPerformanceStore.getCurrentEvaluation(profile.userId);
    if (!current || current.status === 'evaluat') continue;

    const days = hrPerformanceStore.daysUntil(current.termenReevaluare);
    if (current.status === 'intarziat') {
      alerts.push({
        id: `eval-overdue-${profile.userId}`,
        severity: 'critical',
        title: `Evaluare întârziată — ${name}`,
        message: `Termen ${current.termenReevaluare} · ${EVALUATION_STATUS_LABELS[current.status]}`,
        traineeId: profile.userId,
      });
    } else if (days >= 0 && days <= EVALUATION_ALERT_DAYS) {
      alerts.push({
        id: `eval-due-${profile.userId}`,
        severity: 'warning',
        title: `Evaluare în ${days} zile — ${name}`,
        message: `Termen reevaluare: ${current.termenReevaluare}`,
        traineeId: profile.userId,
      });
    }
  }

  for (const err of hrPerformanceStore.getErrorCases()) {
    if (err.planActiune.status === 'inchis') continue;
    const days = hrPerformanceStore.daysUntil(err.planActiune.termenLimita);
    if (days < 0) {
      const profile = hrPerformanceStore.getProfile(err.angajatId);
      const name = profile ? `${profile.prenume} ${profile.nume}`.trim() : err.angajatId;
      alerts.push({
        id: `action-overdue-${err.id}`,
        severity: 'warning',
        title: `Plan acțiune depășit — ${name}`,
        message: err.proiectNume ?? err.descriere.slice(0, 80),
        traineeId: err.angajatId,
      });
    }
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
