/** Grupuri (colective) program instruire artGRANIT */
export interface Cohort {
  id: string;
  label: string;
  programVersion: string;
  startDate: string;
  active: boolean;
}

export const COHORTS: Cohort[] = [
  {
    id: 'cohort-2026-i',
    label: 'Grupa I — Iunie 2026',
    programVersion: '2026.1',
    startDate: '2026-06-01',
    active: true,
  },
  {
    id: 'cohort-2026-ii',
    label: 'Grupa II — Septembrie 2026',
    programVersion: '2026.2',
    startDate: '2026-09-01',
    active: false,
  },
];

export function getCohortById(id: string): Cohort | undefined {
  return COHORTS.find((c) => c.id === id);
}

export function getActiveCohort(): Cohort {
  return COHORTS.find((c) => c.active) ?? COHORTS[0];
}

export function getStagiariForCohort(cohortId: string, users: { cohortId?: string; role: string }[]) {
  return users.filter((u) => (u.role === 'angajat' || u.role === 'stagiar') && u.cohortId === cohortId);
}
