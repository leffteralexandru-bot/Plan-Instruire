import { ingineriPath, INGINERI_ANGAJAT_PANEL_PATH, INGINERI_PLAN_PATH, INGINERI_SUPERVISOR_PANEL_PATH } from '@/data/departments';
import { adminPath } from '@/lib/adminRoutes';
import { getPendingMentorValidations, buildTraineeHrReport } from '@/lib/hrReport';
import {
  canEmployeeSubmitSelfAssessment,
  getActiveStage,
  getEvaluationWorkflowLabel,
  isSelfAssessmentComplete,
} from '@/lib/evaluationStages';
import { isSupervisorOf } from '@/lib/supervisor';
import {
  hrPerformanceStore,
  EVALUATION_ALERT_DAYS,
  EVALUATION_REMINDER_START_DAYS,
  SELF_ASSESSMENT_HR_ESCALATION_DAYS,
  SELF_ASSESSMENT_SUPERVISOR_ESCALATION_DAYS,
} from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { normalizeReTrainingStatus, RE_TRAINING_STATUS_LABELS } from '@/lib/reTrainingWorkflow';
import { userStore } from '@/lib/userStore';
import { storage } from '@/store/storage';

export type ActionInboxRole = 'hr' | 'mentor' | 'supervisor' | 'employee';

export type ActionInboxCategory =
  | 'validation'
  | 'evaluation'
  | 'retraining'
  | 'config'
  | 'self_assessment'
  | 'training';

export interface ActionInboxItem {
  id: string;
  severity: 'urgent' | 'normal';
  title: string;
  message: string;
  actionLabel: string;
  link: string;
  category: ActionInboxCategory;
  angajatId?: string;
  /** Doar excepții — afișate în inbox HR (nu operațiuni zilnice) */
  hrException?: boolean;
}

function daysSince(isoDate: string): number {
  const start = new Date(isoDate.slice(0, 10));
  if (Number.isNaN(start.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (86400000));
}

function profileName(userId: string): string {
  const p = hrPerformanceStore.getProfile(userId);
  if (p) return `${p.prenume} ${p.nume}`.trim();
  return userStore.getUserById(userId)?.name ?? userId;
}

function pushEvaluationSupervisorItems(userId: string, items: ActionInboxItem[]): void {
  for (const profile of hrPerformanceStore.getProfiles()) {
    if (!isSupervisorOf(userId, profile.userId)) continue;
    const ev = hrPerformanceStore.getCurrentEvaluation(profile.userId);
    if (!ev || ev.status === 'evaluat' || ev.status === 'planificat') continue;

    const name = profileName(profile.userId);
    const active = getActiveStage(ev);

    if (active?.id === 'evaluare_mentor') {
      items.push({
        id: `sup-eval-${ev.id}`,
        severity: ev.status === 'intarziat' ? 'urgent' : 'normal',
        title: `Evaluare supervizor — ${name}`,
        message: getEvaluationWorkflowLabel(ev),
        actionLabel: 'Deschide evaluarea',
        link: ingineriPath('/evaluari'),
        category: 'evaluation',
        angajatId: profile.userId,
      });
    }

    if (
      (ev.status === 'in_curs' || ev.status === 'intarziat') &&
      active?.id === 'auto_evaluare' &&
      !isSelfAssessmentComplete(ev.employeeSelfAssessment)
    ) {
      const elapsed = daysSince(ev.perioadaStart);
      if (elapsed >= SELF_ASSESSMENT_SUPERVISOR_ESCALATION_DAYS) {
        items.push({
          id: `sup-self-missing-${ev.id}`,
          severity: elapsed >= SELF_ASSESSMENT_HR_ESCALATION_DAYS ? 'urgent' : 'normal',
          title: `Auto-evaluare lipsă — ${name}`,
          message: `${elapsed} zile de la start · termen ${ev.termenReevaluare}`,
          actionLabel: 'Urmărește angajatul',
          link: ingineriPath(`/angajat/${profile.userId}`),
          category: 'evaluation',
          angajatId: profile.userId,
        });
      }
    }
  }
}

function pushReTrainingSupervisorItems(userId: string, items: ActionInboxItem[]): void {
  for (const session of trainingSystemStore.getReTrainingSessions()) {
    const st = normalizeReTrainingStatus(session.status);
    if (st === 'finalizat') continue;
    const isSup = session.supervisorId === userId || isSupervisorOf(userId, session.angajatId);
    if (!isSup) continue;

    const name = profileName(session.angajatId);
    if (st === 'alerta_supervizor') {
      items.push({
        id: `sup-retrain-plan-${session.id}`,
        severity: 'urgent',
        title: `Planifică re-instruire — ${name}`,
        message: session.titlu,
        actionLabel: 'Panou supervizor',
        link: INGINERI_SUPERVISOR_PANEL_PATH,
        category: 'retraining',
        angajatId: session.angajatId,
      });
    } else if (st === 'raport_trainer') {
      items.push({
        id: `sup-retrain-confirm-${session.id}`,
        severity: 'normal',
        title: `Confirmă instruirea — ${name}`,
        message: `Raport trainer · ${session.topicTitle ?? session.titlu}`,
        actionLabel: 'Confirmă',
        link: INGINERI_SUPERVISOR_PANEL_PATH,
        category: 'retraining',
        angajatId: session.angajatId,
      });
    }
  }
}

function pushMentorValidationItems(userId: string, items: ActionInboxItem[]): void {
  const trainees = userStore.getTraineeProfiles({ mentorId: userId });
  for (const t of trainees) {
    const pending = getPendingMentorValidations(storage.getProgress(t.id));
    if (!pending.length) continue;
    items.push({
      id: `mentor-val-${t.id}`,
      severity: pending.length >= 2 ? 'urgent' : 'normal',
      title: `Validări pending — ${t.name}`,
      message: `Ziua ${pending.join(', Ziua ')}`,
      actionLabel: 'Panou mentor',
      link: ingineriPath('/mentor'),
      category: 'validation',
      angajatId: t.id,
    });

    const progress = storage.getProgress(t.id);
    const report = buildTraineeHrReport(t, progress);
    for (const week of [2, 4] as const) {
      const hasFeedback = progress.feedbacks.some((f) => f.weekNumber === week);
      if (!hasFeedback && report.completedDays >= week * 5 - 2) {
        items.push({
          id: `mentor-fb-w${week}-${t.id}`,
          severity: 'normal',
          title: `Feedback Săpt. ${week === 2 ? 'II' : 'IV'} — ${t.name}`,
          message: 'Formular necompletat în Panou Mentor',
          actionLabel: 'Completează',
          link: ingineriPath('/mentor'),
          category: 'validation',
          angajatId: t.id,
        });
      }
    }
  }
}

function pushHrExceptionItems(items: ActionInboxItem[]): void {
  for (const profile of hrPerformanceStore.getProfiles()) {
    const name = profileName(profile.userId);
    const supervisorId = profile.supervisorId ?? profile.managerId;
    if (!supervisorId) {
      items.push({
        id: `hr-no-sup-${profile.userId}`,
        severity: 'urgent',
        title: `Fără supervizor — ${name}`,
        message: 'Setați supervizorul în Setări → planificare angajat',
        actionLabel: 'Setări',
        link: adminPath('setari'),
        category: 'config',
        angajatId: profile.userId,
        hrException: true,
      });
    }

    const enr = userStore.getActiveEnrollmentForAngajat(profile.userId);
    if (profile.tipAngajat === 'incepator' && enr && !enr.mentorId) {
      items.push({
        id: `hr-no-mentor-${profile.userId}`,
        severity: 'urgent',
        title: `Fără mentor instruire — ${name}`,
        message: 'Asignați mentor principal în Setări',
        actionLabel: 'Setări',
        link: adminPath('setari'),
        category: 'config',
        angajatId: profile.userId,
        hrException: true,
      });
    }

    const ev = hrPerformanceStore.getCurrentEvaluation(profile.userId);
    if (!ev || ev.status === 'evaluat') continue;

    if (ev.status === 'intarziat') {
      items.push({
        id: `hr-eval-late-${ev.id}`,
        severity: 'urgent',
        title: `Evaluare întârziată — ${name}`,
        message: `Termen depășit · ${getEvaluationWorkflowLabel(ev)}`,
        actionLabel: 'Evaluări',
        link: adminPath('evaluari'),
        category: 'evaluation',
        angajatId: profile.userId,
        hrException: true,
      });
    }

    const active = getActiveStage(ev);
    if (active?.id === 'validare_hr' && active.status === 'in_curs') {
      items.push({
        id: `hr-valid-${ev.id}`,
        severity: 'normal',
        title: `Validare HR — ${name}`,
        message: 'Supervizorul a completat evaluarea',
        actionLabel: 'Finalizează',
        link: adminPath('evaluari'),
        category: 'evaluation',
        angajatId: profile.userId,
        hrException: true,
      });
    }

    if (
      (ev.status === 'in_curs' || ev.status === 'intarziat') &&
      active?.id === 'auto_evaluare' &&
      !isSelfAssessmentComplete(ev.employeeSelfAssessment) &&
      daysSince(ev.perioadaStart) >= SELF_ASSESSMENT_HR_ESCALATION_DAYS
    ) {
      items.push({
        id: `hr-self-escalate-${ev.id}`,
        severity: 'urgent',
        title: `Auto-evaluare necompletată — ${name}`,
        message: `${daysSince(ev.perioadaStart)} zile · escalare HR (supervizor notificat)`,
        actionLabel: 'Vezi fișa',
        link: ingineriPath(`/angajat/${profile.userId}`),
        category: 'evaluation',
        angajatId: profile.userId,
        hrException: true,
      });
    }
  }

  for (const session of trainingSystemStore.getReTrainingSessions()) {
    const st = normalizeReTrainingStatus(session.status);
    if (st !== 'confirmat_supervizor') continue;
    const name = profileName(session.angajatId);
    items.push({
      id: `hr-retrain-ok-${session.id}`,
      severity: 'normal',
      title: `OK HR re-instruire — ${name}`,
      message: RE_TRAINING_STATUS_LABELS[st],
      actionLabel: 'Supervizor',
      link: adminPath('supervizor'),
      category: 'retraining',
      angajatId: session.angajatId,
      hrException: true,
    });
  }
}

function pushEmployeeItems(userId: string, items: ActionInboxItem[]): void {
  const enr = userStore.getActiveEnrollmentForAngajat(userId);
  if (enr) {
    const trainee = userStore.getTraineeProfiles().find((t) => t.id === userId);
    if (trainee) {
      const report = buildTraineeHrReport(trainee, storage.getProgress(userId));
      if (report.completedDays < report.totalDays) {
        items.push({
          id: `emp-training-${userId}`,
          severity: 'normal',
          title: 'Continuă planul de instruire',
          message: `${report.progressPercent}% · ${report.completedDays}/${report.totalDays} zile`,
          actionLabel: 'Deschide planul',
          link: INGINERI_PLAN_PATH,
          category: 'training',
          angajatId: userId,
        });
      }
    }
  }

  const ev = hrPerformanceStore.getCurrentEvaluation(userId);
  if (!ev || ev.status === 'evaluat') return;

  const daysLeft = hrPerformanceStore.daysUntil(ev.termenReevaluare);

  if (canEmployeeSubmitSelfAssessment(ev)) {
    items.push({
      id: `emp-self-${ev.id}`,
      severity: daysLeft <= EVALUATION_ALERT_DAYS || ev.status === 'intarziat' ? 'urgent' : 'normal',
      title: 'Completează auto-evaluarea',
      message:
        daysLeft >= 0 && daysLeft <= EVALUATION_REMINDER_START_DAYS
          ? `Termen evaluare în ${daysLeft} zile · ${ev.termenReevaluare}`
          : `Etapa curentă: ${getEvaluationWorkflowLabel(ev)}`,
      actionLabel: 'Auto-evaluare',
      link: INGINERI_ANGAJAT_PANEL_PATH,
      category: 'self_assessment',
      angajatId: userId,
    });
  } else if (daysLeft >= 0 && daysLeft <= EVALUATION_REMINDER_START_DAYS) {
    items.push({
      id: `emp-eval-soon-${ev.id}`,
      severity: 'normal',
      title: 'Evaluare tri-lunară se apropie',
      message: `Termen ${ev.termenReevaluare} · ${getEvaluationWorkflowLabel(ev)}`,
      actionLabel: 'Vezi status',
      link: ingineriPath('/evaluari'),
      category: 'evaluation',
      angajatId: userId,
    });
  }
}

function sortItems(items: ActionInboxItem[]): ActionInboxItem[] {
  return [...items].sort((a, b) => {
    if (a.severity === 'urgent' && b.severity !== 'urgent') return -1;
    if (b.severity === 'urgent' && a.severity !== 'urgent') return 1;
    return a.title.localeCompare(b.title, 'ro');
  });
}

export function getActionInboxForRole(userId: string, role: ActionInboxRole): ActionInboxItem[] {
  const items: ActionInboxItem[] = [];

  switch (role) {
    case 'hr':
      pushHrExceptionItems(items);
      break;
    case 'mentor':
      pushMentorValidationItems(userId, items);
      break;
    case 'supervisor':
      pushEvaluationSupervisorItems(userId, items);
      pushReTrainingSupervisorItems(userId, items);
      break;
    case 'employee':
      pushEmployeeItems(userId, items);
      break;
  }

  return sortItems(items);
}

/** Inbox combinat pentru utilizatori cu mai multe roluri (ex. mentor + supervizor) */
export function getActionInboxForUser(
  userId: string,
  roles: ActionInboxRole[],
): ActionInboxItem[] {
  const seen = new Set<string>();
  const merged: ActionInboxItem[] = [];
  for (const role of roles) {
    for (const item of getActionInboxForRole(userId, role)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return sortItems(merged);
}

export function countUrgentActions(items: ActionInboxItem[]): number {
  return items.filter((i) => i.severity === 'urgent').length;
}
