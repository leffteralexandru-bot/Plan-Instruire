import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_SETTINGS_ADMIN_EMAIL, PLATFORM_SETTINGS_ADMIN_ID } from '@/lib/platformSettingsAdmin';
import {
  DEFAULT_EVALUATION_CYCLE_DAYS,
  getDefaultEvaluationSettings,
  getEvaluationCycleDays,
  getEvaluationSettings,
  resetEvaluationSettings,
  saveEvaluationSettings,
} from '@/lib/evaluationSettings';

const alex = { id: PLATFORM_SETTINGS_ADMIN_ID, name: 'Alex', email: PLATFORM_SETTINGS_ADMIN_EMAIL };

const ls: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(ls)) delete ls[k];
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => ls[k] ?? null,
    setItem: (k: string, v: string) => {
      ls[k] = v;
    },
    removeItem: (k: string) => {
      delete ls[k];
    },
    clear: () => {
      for (const k of Object.keys(ls)) delete ls[k];
    },
  });
});

describe('evaluationSettings', () => {
  it('returnează valorile implicite când nu există stocare', () => {
    const s = getEvaluationSettings();
    expect(s.cycleDays).toBe(DEFAULT_EVALUATION_CYCLE_DAYS);
    expect(s.criteria).toHaveLength(10);
  });

  it('salvează și citește ciclul de zile', () => {
    saveEvaluationSettings({ cycleDays: 120 }, alex);
    expect(getEvaluationCycleDays()).toBe(120);
  });

  it('limitează ciclul între 30 și 365 zile', () => {
    saveEvaluationSettings({ cycleDays: 10 }, alex);
    expect(getEvaluationCycleDays()).toBe(30);
    saveEvaluationSettings({ cycleDays: 999 }, alex);
    expect(getEvaluationCycleDays()).toBe(365);
  });

  it('resetează la valorile implicite', () => {
    saveEvaluationSettings({ cycleDays: 60 }, alex);
    resetEvaluationSettings(alex);
    expect(getEvaluationCycleDays()).toBe(getDefaultEvaluationSettings().cycleDays);
  });

  it('blochează salvarea pentru alți utilizatori HR', () => {
    expect(() =>
      saveEvaluationSettings(
        { cycleDays: 120 },
        { id: 'u-hr', name: 'Elena', email: 'e.vasilescu@artgranit.ro' },
      ),
    ).toThrow(/Alex/i);
  });
});
