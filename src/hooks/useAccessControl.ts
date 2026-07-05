import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  canAddEmployeeNote,
  canEditEmployeeProfile,
  canExportEmployeeDossier,
  canOpenMentorPanel,
  canOpenSupervisorPanel,
  canSendEvaluationReminder,
  canViewEmployee,
  filterProfilesForActor,
  getAccessibleEmployeeIds,
} from '@/lib/accessControl';
import { canEditTrainingPlan, canViewPlatformSettings } from '@/lib/roles';

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
      canEditTrainingPlan: canEditTrainingPlan(user),
      canViewPlatformSettings: canViewPlatformSettings(user),
      canOpenMentorPanel: canOpenMentorPanel(user),
      canOpenSupervisorPanel: canOpenSupervisorPanel(user),
      accessibleEmployeeIds: getAccessibleEmployeeIds(user),
      filterProfiles: <T extends { userId: string }>(items: T[]) => filterProfilesForActor(user, items),
    }),
    [user],
  );
}
