import { ingineriPath, INGINERI_ANGAJAT_PANEL_PATH, INGINERI_PLAN_PATH, INGINERI_SUPERVISOR_PANEL_PATH, reTrainingLessonPath } from '@/data/departments';
import { adminPath } from '@/lib/adminRoutes';
import type { AdminTab } from '@/components/admin/performance/AdminTabNav';

export type ActionFocusKind =
  | 'cohort'
  | 'validations'
  | 'feedback'
  | 'retrain'
  | 'eval'
  | 'self-assessment'
  | 'error'
  | 'team'
  | 'settings';

export const ACTION_FOCUS_RING_CLASS = 'ring-2 ring-corporate-gold ring-offset-2 transition-shadow';

function withParams(base: string, params: Record<string, string | undefined>): string {
  const [path, existing] = base.split('?');
  const sp = new URLSearchParams(existing ?? '');
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path!;
}

export function actionFocusElementId(
  kind: ActionFocusKind,
  id: string,
  extra?: string,
): string {
  if (kind === 'feedback' && extra) return `action-focus-feedback-w${extra}-${id}`;
  return `action-focus-${kind}-${id}`;
}

export function highlightActionElement(elementId: string): void {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(...ACTION_FOCUS_RING_CLASS.split(' '));
      window.setTimeout(() => {
        el.classList.remove(...ACTION_FOCUS_RING_CLASS.split(' '));
      }, 2800);
    }, 120);
  });
}

export function mentorPanelLink(opts: {
  focus: 'cohort' | 'validations' | 'feedback' | 'retrain';
  traineeId?: string;
  sessionId?: string;
  week?: 2 | 4;
}): string {
  return withParams(ingineriPath('/mentor'), {
    focus: opts.focus === 'cohort' ? 'cohort' : opts.focus,
    trainee: opts.traineeId,
    session: opts.sessionId,
    week: opts.week ? String(opts.week) : undefined,
  });
}

export function supervisorPanelLink(opts: {
  focus: 'team' | 'retrain';
  angajatId?: string;
  sessionId?: string;
}): string {
  return withParams(INGINERI_SUPERVISOR_PANEL_PATH, {
    focus: opts.focus,
    angajat: opts.angajatId,
    session: opts.sessionId,
  });
}

export function evaluationsLink(opts?: { angajatId?: string; evalId?: string }): string {
  return withParams(ingineriPath('/evaluari'), {
    focus: 'eval',
    viewAs: opts?.angajatId,
    eval: opts?.evalId,
  });
}

export function angajatPanelLink(opts?: {
  focus?: 'self-assessment' | 'parcurs';
  section?: 'training' | 'retraining' | 'evaluation';
}): string {
  return withParams(INGINERI_ANGAJAT_PANEL_PATH, {
    focus: opts?.focus,
    section: opts?.section,
  });
}

export function adminActionLink(
  tab: AdminTab,
  opts?: { focus?: ActionFocusKind; angajatId?: string; evalId?: string; sessionId?: string; errorId?: string },
): string {
  return withParams(adminPath(tab), {
    focus: opts?.focus,
    angajat: opts?.angajatId,
    eval: opts?.evalId,
    session: opts?.sessionId,
    error: opts?.errorId,
  });
}

export function employeePlanLink(angajatId?: string): string {
  if (!angajatId) return INGINERI_PLAN_PATH;
  return withParams(INGINERI_PLAN_PATH, { viewAs: angajatId });
}

export { reTrainingLessonPath };
