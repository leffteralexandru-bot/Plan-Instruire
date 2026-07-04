import type { AssignmentHistoryEntry, EmployeeAssignmentHistory, WeeklyMentorHistoryEntry } from '@/types';

export function createHistoryEntry(
  fromUserId: string | undefined,
  toUserId: string | undefined,
  changedBy?: { id: string; name: string } | { changedById?: string; changedByName?: string; note?: string },
): AssignmentHistoryEntry {
  const meta =
    changedBy && 'id' in changedBy
      ? { changedById: changedBy.id, changedByName: changedBy.name }
      : changedBy;
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    changedAt: new Date().toISOString(),
    fromUserId,
    toUserId,
    ...meta,
  };
}

export function appendPrincipalMentorHistory(
  existing: EmployeeAssignmentHistory | undefined,
  entry: AssignmentHistoryEntry,
): EmployeeAssignmentHistory {
  return {
    ...existing,
    principalMentor: [...(existing?.principalMentor ?? []), entry],
  };
}

export function appendSupervisorHistory(
  existing: EmployeeAssignmentHistory | undefined,
  entry: AssignmentHistoryEntry,
): EmployeeAssignmentHistory {
  return {
    ...existing,
    supervisor: [...(existing?.supervisor ?? []), entry],
  };
}

export function appendWeeklyMentorHistory(
  existing: EmployeeAssignmentHistory | undefined,
  entry: WeeklyMentorHistoryEntry,
): EmployeeAssignmentHistory {
  return {
    ...existing,
    weeklyMentors: [...(existing?.weeklyMentors ?? []), entry],
  };
}

export function getWeeklyMentorHistoryForWeek(
  history: EmployeeAssignmentHistory | undefined,
  weekNumber: number,
): WeeklyMentorHistoryEntry[] {
  return (history?.weeklyMentors ?? []).filter((h) => h.weekNumber === weekNumber);
}
