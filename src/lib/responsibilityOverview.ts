import type { EmployeeProfile, User } from '@/types';
import { storage } from '@/store/storage';
import { buildTraineeHrReport, getPendingMentorValidations } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import {
  EVALUATION_STATUS_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { getEmployeeMentorAssignments } from '@/lib/employeeMentorAssignments';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { userStore } from '@/lib/userStore';
import { RE_TRAINING_STATUS_LABELS, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';

export interface ResponsibilityRow {
  angajatId: string;
  angajatName: string;
  functie: string;
  mentorId?: string;
  mentorName: string;
  supervisorId?: string;
  supervisorName: string;
  trainingLabel: string;
  trainingStatus?: string;
  evaluationStatus?: string;
  evaluationStage?: string;
  reTrainingLabel?: string;
  pendingValidations: number;
}

export interface ResponsibilityFilters {
  mentorId: string;
  supervisorId: string;
  search: string;
}

export function buildResponsibilityRows(profiles: EmployeeProfile[], users: User[]): ResponsibilityRow[] {
  const trainees = userStore.getTraineeProfiles();

  return profiles.map((profile) => {
    const assignments = getEmployeeMentorAssignments(profile, users);
    const trainee = trainees.find((t) => t.id === profile.userId);
    const evalCurrent = hrPerformanceStore.getCurrentEvaluation(profile.userId);

    let trainingLabel = '—';
    let trainingStatus: string | undefined;
    if (trainee && (assignments.instruire.active || profile.tipAngajat === 'incepator')) {
      const report = buildTraineeHrReport(trainee, storage.getProgress(profile.userId));
      trainingLabel = `${report.progressPercent}% (${report.completedDays}/${report.totalDays} zile)`;
      trainingStatus = getTraineeStatusLabel(getTraineeStatus(report));
    }

    const reSession = trainingSystemStore
      .getReTrainingSessions({ angajatId: profile.userId })
      .find((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');

    const pendingValidations = trainee
      ? getPendingMentorValidations(storage.getProgress(profile.userId)).length
      : 0;

    return {
      angajatId: profile.userId,
      angajatName: `${profile.prenume} ${profile.nume}`.trim(),
      functie: profile.functie,
      mentorId: assignments.instruire.userId,
      mentorName: assignments.instruire.name,
      supervisorId: assignments.supervizor.userId,
      supervisorName: assignments.supervizor.name,
      trainingLabel,
      trainingStatus,
      evaluationStatus: evalCurrent ? EVALUATION_STATUS_LABELS[evalCurrent.status] : undefined,
      evaluationStage: evalCurrent ? getEvaluationWorkflowLabel(evalCurrent) : undefined,
      reTrainingLabel: reSession
        ? `${assignments.reInstruire.name} · ${RE_TRAINING_STATUS_LABELS[normalizeReTrainingStatus(reSession.status)]}`
        : undefined,
      pendingValidations,
    };
  });
}

export function filterResponsibilityRows(
  rows: ResponsibilityRow[],
  filters: ResponsibilityFilters,
): ResponsibilityRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (filters.mentorId !== 'all' && r.mentorId !== filters.mentorId) return false;
    if (filters.supervisorId !== 'all' && r.supervisorId !== filters.supervisorId) return false;
    if (!q) return true;
    const blob = [r.angajatName, r.functie, r.mentorName, r.supervisorName].join(' ').toLowerCase();
    return blob.includes(q);
  });
}

export function listMentorFilterOptions(rows: ResponsibilityRow[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.mentorId && r.mentorName !== '—') map.set(r.mentorId, r.mentorName);
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));
}

export function listSupervisorFilterOptions(rows: ResponsibilityRow[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.supervisorId && r.supervisorName !== '—') map.set(r.supervisorId, r.supervisorName);
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));
}
