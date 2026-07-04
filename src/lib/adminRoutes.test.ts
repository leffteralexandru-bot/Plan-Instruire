import { describe, expect, it } from 'vitest';
import { adminPath, isAdminTab, parseAdminTabFromSearch } from '@/lib/adminRoutes';

describe('adminRoutes', () => {
  it('generează link cu tab', () => {
    expect(adminPath('evaluari')).toBe('/ingineri/admin?tab=evaluari');
  });

  it('parsează tab valid din URL', () => {
    expect(parseAdminTabFromSearch('?tab=supervizor')).toBe('supervizor');
    expect(parseAdminTabFromSearch('')).toBe('management');
    expect(parseAdminTabFromSearch('?tab=invalid')).toBe('management');
  });

  it('validează tab-uri admin', () => {
    expect(isAdminTab('setari')).toBe(true);
    expect(isAdminTab('foo')).toBe(false);
  });
});
