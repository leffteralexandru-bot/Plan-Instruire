import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { highlightActionElement } from '@/lib/actionFocus';

export interface ActionFocusParams {
  focus: string | null;
  traineeId: string | null;
  angajatId: string | null;
  sessionId: string | null;
  evalId: string | null;
  errorId: string | null;
  section: string | null;
  week: string | null;
}

export function useActionFocusParams(): ActionFocusParams {
  const [searchParams] = useSearchParams();
  return {
    focus: searchParams.get('focus'),
    traineeId: searchParams.get('trainee'),
    angajatId: searchParams.get('angajat') ?? searchParams.get('viewAs'),
    sessionId: searchParams.get('session'),
    evalId: searchParams.get('eval'),
    errorId: searchParams.get('error'),
    section: searchParams.get('section'),
    week: searchParams.get('week'),
  };
}

/** Rulează handler-ul pentru focus-ul din URL o singură dată per query string. */
export function useActionFocusEffect(
  handlers: Record<string, () => void>,
  deps: unknown[] = [],
): void {
  const [searchParams] = useSearchParams();
  const appliedKey = useRef<string | null>(null);
  const focus = searchParams.get('focus');
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!focus || !handlers[focus]) return;
    if (appliedKey.current === searchKey) return;
    appliedKey.current = searchKey;
    const timer = window.setTimeout(() => handlers[focus]!(), 180);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, searchKey, ...deps]);
}

export function useHighlightOnFocus(elementId: string | null | undefined, enabled = true): void {
  const { focus } = useActionFocusParams();

  useEffect(() => {
    if (!enabled || !focus || !elementId) return;
    highlightActionElement(elementId);
  }, [enabled, focus, elementId]);
}
