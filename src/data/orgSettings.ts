import type { OrgSettings } from '@/types';
import { getActiveCohort } from '@/data/cohorts';

export function getDefaultOrgSettings(): OrgSettings {
  const cohort = getActiveCohort();
  return {
    programVersion: cohort.programVersion,
    activeCohortId: cohort.id,
  };
}
