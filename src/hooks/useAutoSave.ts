import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useAutoSaveRegistry, type AutoSaveStatus } from '@/context/AutoSaveContext';

const DEFAULT_DEBOUNCE_MS = 1500;

export interface UseAutoSaveOptions<T> {
  draft: T;
  save: (draft: T) => void | Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
  equals?: (a: T, b: T) => boolean;
  /** Stare inițială deja salvată — evită salvare la mount. */
  baseline?: T;
}

export function useAutoSave<T>({
  draft,
  save,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  equals = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  baseline,
}: UseAutoSaveOptions<T>) {
  const instanceId = useId();
  const { registerPendingSave, unregisterPendingSave, registerDirty, unregisterDirty, registerFlush, reportStatus, unregisterStatus } =
    useAutoSaveRegistry();
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const lastSavedRef = useRef(baseline ?? draft);
  const saveRef = useRef(save);
  const draftRef = useRef(draft);

  saveRef.current = save;
  draftRef.current = draft;

  const setBothStatus = useCallback(
    (next: AutoSaveStatus) => {
      setStatus(next);
      reportStatus(instanceId, next);
    },
    [instanceId, reportStatus],
  );

  const performSave = useCallback(async () => {
    if (!enabled) return;
    const current = draftRef.current;
    if (equals(current, lastSavedRef.current)) {
      setBothStatus('idle');
      return;
    }
    setBothStatus('saving');
    registerPendingSave();
    try {
      await saveRef.current(current);
      lastSavedRef.current = current;
      setBothStatus('saved');
      window.setTimeout(() => {
        setStatus((prev) => {
          const next = prev === 'saved' ? 'idle' : prev;
          reportStatus(instanceId, next);
          return next;
        });
      }, 2000);
    } catch {
      setBothStatus('error');
    } finally {
      unregisterPendingSave();
    }
  }, [enabled, equals, instanceId, registerPendingSave, reportStatus, setBothStatus, unregisterPendingSave]);

  const flush = useCallback(() => performSave(), [performSave]);

  useEffect(() => {
    if (!enabled) return;
    if (equals(draft, lastSavedRef.current)) return;
    setBothStatus('pending');
    const timer = window.setTimeout(() => void performSave(), debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, debounceMs, enabled, equals, performSave, setBothStatus]);

  useEffect(() => registerFlush(flush), [flush, registerFlush]);

  useEffect(() => {
    return () => unregisterStatus(instanceId);
  }, [instanceId, unregisterStatus]);

  useEffect(() => {
    if (baseline !== undefined) lastSavedRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    if (!enabled) return;
    const dirty = !equals(draft, lastSavedRef.current);
    if (!dirty) return;
    registerDirty();
    return () => unregisterDirty();
  }, [draft, enabled, equals, registerDirty, unregisterDirty]);

  return { status, flush, isDirty: !equals(draft, lastSavedRef.current) };
}
