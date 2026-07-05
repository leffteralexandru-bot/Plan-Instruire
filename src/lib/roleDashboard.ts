import { storage } from '@/store/storage';
import { getPendingMentorValidations, buildTraineeHrReport, getAngajatTrainingReport, isInMentorCohort } from '@/lib/hrReport';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { getSupervisedEmployeeIds } from '@/lib/supervisor';
import { userStore } from '@/lib/userStore';
import {
  countUrgentActions,
  getActionInboxForRole,
  type ActionInboxRole,
} from '@/lib/actionInbox';

export interface RoleDashboardMetrics {
  subordinatesCount: number;
  pendingValidations: number;
  activeEvaluations: number;
  lateEvaluations: number;
  activeRetraining: number;
  completedRetraining?: number;
  errorsThisMonth: number;
  urgentActions: number;
  trainingProgressPercent?: number;
}

function errorsThisMonthForIds(ids: Set<string>): number {
  const luna = new Date().toISOString().slice(0, 7);
  return hrPerformanceStore
    .getErrorCases()
    .filter((e) => ids.has(e.angajatId) && e.data.startsWith(luna)).length;
}

function retrainingCountForIds(ids: Set<string>): number {
  return trainingSystemStore
    .getReTrainingSessions()
    .filter(
      (s) =>
        ids.has(s.angajatId) && normalizeReTrainingStatus(s.status) !== 'finalizat',
    ).length;
}

function evaluationCounts(ids: Set<string>): { active: number; late: number } {
  let active = 0;
  let late = 0;
  for (const id of ids) {
    const ev = hrPerformanceStore.getCurrentEvaluation(id);
    if (!ev || ev.status === 'evaluat') continue;
    active += 1;
    if (ev.status === 'intarziat') late += 1;
  }
  return { active, late };
}

export function getMentorDashboardMetrics(mentorId: string): RoleDashboardMetrics {
  const trainees = userStore.getTraineeProfiles({ mentorId });
  const cohortTrainees = trainees.filter(isInMentorCohort);
  const ids = new Set(trainees.map((t) => t.id));
  let pendingValidations = 0;
  let progressSum = 0;

  for (const t of cohortTrainees) {
    pendingValidations += getPendingMentorValidations(storage.getProgress(t.id)).length;
    progressSum += buildTraineeHrReport(t, storage.getProgress(t.id)).progressPercent;
  }

  const evalCounts = evaluationCounts(ids);
  const inbox = getActionInboxForRole(mentorId, 'mentor');

  return {
    subordinatesCount: cohortTrainees.length,
    pendingValidations,
    activeEvaluations: evalCounts.active,
    lateEvaluations: evalCounts.late,
    activeRetraining: retrainingCountForIds(ids),
    errorsThisMonth: errorsThisMonthForIds(ids),
    urgentActions: countUrgentActions(inbox),
    trainingProgressPercent: cohortTrainees.length
      ? Math.round(progressSum / cohortTrainees.length)
      : undefined,
  };
}

export function getSupervisorDashboardMetrics(supervisorId: string): RoleDashboardMetrics {
  const ids = new Set(getSupervisedEmployeeIds(supervisorId));
  const evalCounts = evaluationCounts(ids);
  const inbox = getActionInboxForRole(supervisorId, 'supervisor');

  return {
    subordinatesCount: ids.size,
    pendingValidations: 0,
    activeEvaluations: evalCounts.active,
    lateEvaluations: evalCounts.late,
    activeRetraining: retrainingCountForIds(ids),
    errorsThisMonth: errorsThisMonthForIds(ids),
    urgentActions: countUrgentActions(inbox),
  };
}

export function getEmployeeDashboardMetrics(userId: string): RoleDashboardMetrics {
  const ev = hrPerformanceStore.getCurrentEvaluation(userId);
  const inbox = getActionInboxForRole(userId, 'employee');
  const trainingReport = getAngajatTrainingReport(userId);
  const trainingProgressPercent = trainingReport?.progressPercent;

  const retraining = trainingSystemStore
    .getReTrainingSessions({ angajatId: userId })
    .filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat').length;

  const completedRetraining = trainingSystemStore
    .getReTrainingSessions({ angajatId: userId })
    .filter((s) => normalizeReTrainingStatus(s.status) === 'finalizat').length;

  const evalOpen = ev?.status === 'in_curs' || ev?.status === 'intarziat';

  return {
    subordinatesCount: 0,
    pendingValidations: 0,
    activeEvaluations: evalOpen ? 1 : 0,
    lateEvaluations: ev?.status === 'intarziat' ? 1 : 0,
    activeRetraining: retraining,
    completedRetraining,
    errorsThisMonth: errorsThisMonthForIds(new Set([userId])),
    urgentActions: countUrgentActions(inbox),
    trainingProgressPercent,
  };
}

export function getRoleDashboardMetrics(
  userId: string,
  role: ActionInboxRole,
): RoleDashboardMetrics {
  switch (role) {
    case 'mentor':
      return getMentorDashboardMetrics(userId);
    case 'supervisor':
      return getSupervisorDashboardMetrics(userId);
    case 'employee':
      return getEmployeeDashboardMetrics(userId);
    default:
      return {
        subordinatesCount: hrPerformanceStore.getProfiles().length,
        pendingValidations: 0,
        activeEvaluations: 0,
        lateEvaluations: 0,
        activeRetraining: 0,
        errorsThisMonth: 0,
        urgentActions: 0,
      };
  }
}

export interface SubordinateRow {
  userId: string;
  name: string;
  functie: string;
  evaluationStatus?: import('@/types').EvaluationStatus;
  evaluationStage?: string;
  retrainingActive: boolean;
  retrainingCompleted: boolean;
}

export function buildSupervisedSubordinateRows(supervisorId: string): SubordinateRow[] {
  const rows: SubordinateRow[] = [];
  for (const userId of getSupervisedEmployeeIds(supervisorId)) {
    const p = hrPerformanceStore.getProfile(userId);
    if (!p) continue;
    const ev = hrPerformanceStore.getCurrentEvaluation(userId);
    const sessions = trainingSystemStore.getReTrainingSessions({ angajatId: userId });
    const retraining = sessions.some((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
    const retrainingCompleted = sessions.some(
      (s) => normalizeReTrainingStatus(s.status) === 'finalizat',
    );
    rows.push({
      userId,
      name: `${p.prenume} ${p.nume}`.trim(),
      functie: p.functie,
      evaluationStatus: ev?.status,
      evaluationStage: ev ? getEvaluationWorkflowLabel(ev) : undefined,
      retrainingActive: retraining,
      retrainingCompleted,
    });
  }
  return rows;
}
