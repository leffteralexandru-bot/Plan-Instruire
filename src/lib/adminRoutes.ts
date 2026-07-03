import type { AdminTab } from '@/components/admin/performance/AdminTabNav';
import { ingineriPath } from '@/data/departments';

const ADMIN_TABS: AdminTab[] = [
  'management',
  'angajati',
  'responsabilitati',
  'evaluari',
  'erori',
  'supervizor',
  'instruire',
  'setari',
];

export function isAdminTab(value: string | null | undefined): value is AdminTab {
  return !!value && (ADMIN_TABS as string[]).includes(value);
}

export function parseAdminTabFromSearch(search: string): AdminTab {
  const tab = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('tab');
  return isAdminTab(tab) ? tab : 'management';
}

/** Link direct către un tab din Panoul HR */
export function adminPath(tab: AdminTab = 'management'): string {
  return `${ingineriPath('/admin')}?tab=${tab}`;
}
