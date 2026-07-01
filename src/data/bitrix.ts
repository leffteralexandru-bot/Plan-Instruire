import type { OrgSettings } from '@/types';
import { getActiveCohort } from '@/data/cohorts';

/** Portal Bitrix24 artGRANIT — suprascris de VITE_BITRIX_PORTAL_URL sau setări locale */
export const ARTGRANIT_BITRIX_PORTAL = 'https://artgranit.bitrix24.ro';

export function getDefaultOrgSettings(): OrgSettings {
  const fromEnv = import.meta.env.VITE_BITRIX_PORTAL_URL?.trim();
  const cohort = getActiveCohort();
  return {
    bitrixPortalUrl: fromEnv || ARTGRANIT_BITRIX_PORTAL,
    programVersion: cohort.programVersion,
    activeCohortId: cohort.id,
  };
}

/** @deprecated Folosiți getDefaultOrgSettings() — păstrat pentru compatibilitate */
export const DEFAULT_SETTINGS: OrgSettings = {
  bitrixPortalUrl: ARTGRANIT_BITRIX_PORTAL,
  programVersion: '2026.1',
};

export function normalizePortalUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function bitrixProjectUrl(projectId: string, settings: OrgSettings): string {
  return `${normalizePortalUrl(settings.bitrixPortalUrl)}/crm/deal/details/${projectId}/`;
}

export function bitrixTasksUrl(settings: OrgSettings): string {
  return `${normalizePortalUrl(settings.bitrixPortalUrl)}/company/personal/user/0/tasks/`;
}

/** Zile din planul artGRANIT cu link rapid Bitrix (5, 7, 11) */
export const BITRIX_LINK_DAYS = [5, 7, 11] as const;

export function getBitrixUrlForDay(dayNumber: number, settings: OrgSettings): string | null {
  if ((BITRIX_LINK_DAYS as readonly number[]).includes(dayNumber)) {
    return bitrixTasksUrl(settings);
  }
  return null;
}
