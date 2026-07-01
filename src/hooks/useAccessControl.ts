import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  canAddEmployeeNote,
  canEditEmployeeProfile,
  canExportEmployeeDossier,
  canOpenMentorPanel,
  canSendEvaluationReminder,
  canViewEmployee,
  filterProfilesForActor,
  getAccessibleEmployeeIds,
} from '@/lib/accessControl';

export function useAccessControl() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      user,
      canViewEmployee: (targetId: string) => canViewEmployee(user, targetId),
      canEditEmployeeProfile: canEditEmployeeProfile(user),
      canExportDossier: (targetId: string) => canExportEmployeeDossier(user, targetId),
      canAddNote: (targetId: string) => canAddEmployeeNote(user, targetId),
      canSendReminder: canSendEvaluationReminder(user),
      canOpenMentorPanel: canOpenMentorPanel(user),
      accessibleEmployeeIds: getAccessibleEmployeeIds(user),
      filterProfiles: <T extends { userId: string }>(items: T[]) => filterProfilesForActor(user, items),
    }),
    [user],
  );
}
