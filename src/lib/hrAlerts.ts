import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';
import { buildTraineeHrReport, isTrainingPlanComplete } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel, getMentorWorkload } from '@/lib/hrAnalytics';
import { hrPerformanceStore, EVALUATION_ALERT_DAYS } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { normalizeReTrainingStatus, RE_TRAINING_STATUS_LABELS } from '@/lib/reTrainingWorkflow';

export type HrAlertSeverity = 'info' | 'warning' | 'critical';

export interface HrAlert {
  id: string;
  severity: HrAlertSeverity;
  title: string;
  message: string;
  traineeId?: string;
  supervisorId?: string;
  trainerId?: string;
  hrOnly?: boolean;
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
        hrOnly: true,
      });
    } else if (status === 'at_risk') {
      alerts.push({
        id: `risk-${t.id}`,
        severity: 'warning',
        title: `${t.name} — risc moderat`,
        message: `Progres ${row.progressPercent}% — sub ritmul așteptat al programului`,
        traineeId: t.id,
        hrOnly: true,
      });
    }

    if (row.quizPassed === false && !isTrainingPlanComplete(row)) {
      alerts.push({
        id: `quiz-${t.id}`,
        severity: 'warning',
        title: `Test teoretic nepromovat — ${t.name}`,
        message: row.quizScoreLabel ?? 'Test Ziua 10 nepromovat',
        traineeId: t.id,
        hrOnly: true,
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
      hrOnly: true,
    });
  }

  for (const profile of hrPerformanceStore.getProfiles()) {
    const name = `${profile.prenume} ${profile.nume}`.trim();
    const supervisorId = profile.supervisorId ?? profile.managerId;
    const current = hrPerformanceStore.getCurrentEvaluation(profile.userId);
    if (!current || current.status === 'evaluat') continue;

    const days = hrPerformanceStore.daysUntil(current.termenReevaluare);
    const evalAlert = {
      traineeId: profile.userId,
      supervisorId,
    };
    if (current.status === 'intarziat') {
      alerts.push({
        id: `eval-overdue-${profile.userId}`,
        severity: 'critical',
        title: `Evaluare întârziată — ${name}`,
        message: `Supervizor: notificare automată · termen ${current.termenReevaluare}`,
        ...evalAlert,
      });
    } else if (days >= 0 && days <= EVALUATION_ALERT_DAYS) {
      alerts.push({
        id: `eval-due-${profile.userId}`,
        severity: 'warning',
        title: `Evaluare în ${days} zile — ${name}`,
        message: `Supervizorul evaluează la 90 zile · termen ${current.termenReevaluare}`,
        ...evalAlert,
      });
    }
  }

  for (const session of trainingSystemStore.getReTrainingSessions()) {
    const st = normalizeReTrainingStatus(session.status);
    if (st === 'finalizat') continue;
    const profile = hrPerformanceStore.getProfile(session.angajatId);
    const name = profile ? `${profile.prenume} ${profile.nume}`.trim() : session.angajatId;
    if (st === 'alerta_supervizor') {
      alerts.push({
        id: `retrain-alert-${session.id}`,
        severity: 'critical',
        title: `Re-instruire necesară — ${name}`,
        message: `Supervizor notificat automat · ${session.titlu}`,
        traineeId: session.angajatId,
        supervisorId: session.supervisorId,
      });
    } else if (st === 'raport_trainer') {
      alerts.push({
        id: `retrain-confirm-${session.id}`,
        severity: 'warning',
        title: `Confirmă instruirea — ${name}`,
        message: `Raport trainer primit · ${session.topicTitle ?? session.titlu}`,
        traineeId: session.angajatId,
        supervisorId: session.supervisorId,
      });
    } else if (st === 'confirmat_supervizor') {
      alerts.push({
        id: `retrain-hr-${session.id}`,
        severity: 'warning',
        title: `Confirmare HR — ${name}`,
        message: `Supervizorul a validat instruirea · ${RE_TRAINING_STATUS_LABELS[st]}`,
        traineeId: session.angajatId,
        hrOnly: true,
      });
    } else if ((st === 'planificat' || st === 'in_curs') && session.trainerId) {
      alerts.push({
        id: `retrain-trainer-${session.id}`,
        severity: 'warning',
        title: `Raport instruire — ${name}`,
        message: `Temă: ${session.topicTitle ?? session.titlu}`,
        traineeId: session.angajatId,
        trainerId: session.trainerId,
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
        hrOnly: true,
      });
    }
  }

  return alerts;
}

/** Alerte relevante pentru actor (HR vede tot; supervizor/trainer doar cele atribuite) */
export function getAlertsForActor(userId: string | undefined, isHrOrAdmin: boolean): HrAlert[] {
  const all = computeHrAlerts();
  if (!userId) return [];
  if (isHrOrAdmin) return all;
  return all.filter((a) => {
    if (a.hrOnly) return false;
    if (a.supervisorId === userId) return true;
    if (a.trainerId === userId) return true;
    return false;
  });
}

export function getVisibleHrAlerts(userId?: string, isHrOrAdmin = true): HrAlert[] {
  const dismissed = new Set<string>(
    JSON.parse(sessionStorage.getItem(ALERT_DISMISS_KEY) ?? '[]') as string[],
  );
  const source = userId !== undefined ? getAlertsForActor(userId, isHrOrAdmin) : computeHrAlerts();
  return source.filter((a) => !dismissed.has(a.id));
}

export function dismissHrAlert(id: string): void {
  const dismissed = new Set<string>(
    JSON.parse(sessionStorage.getItem(ALERT_DISMISS_KEY) ?? '[]') as string[],
  );
  dismissed.add(id);
  sessionStorage.setItem(ALERT_DISMISS_KEY, JSON.stringify([...dismissed]));
}
