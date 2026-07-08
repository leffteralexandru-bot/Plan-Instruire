import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const STATUS_PRIORITY: Record<AutoSaveStatus, number> = {
  idle: 0,
  saved: 1,
  error: 2,
  pending: 3,
  saving: 4,
};

interface AutoSaveContextValue {
  globalStatus: AutoSaveStatus;
  registerPendingSave: () => void;
  unregisterPendingSave: () => void;
  registerDirty: () => void;
  unregisterDirty: () => void;
  registerFlush: (fn: () => void | Promise<void>) => () => void;
  reportStatus: (id: string, status: AutoSaveStatus) => void;
  unregisterStatus: (id: string) => void;
}

const AutoSaveContext = createContext<AutoSaveContextValue | null>(null);

export function AutoSaveProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef(0);
  const dirtyRef = useRef(0);
  const flushFnsRef = useRef(new Set<() => void | Promise<void>>());
  const statusMapRef = useRef(new Map<string, AutoSaveStatus>());
  const [globalStatus, setGlobalStatus] = useState<AutoSaveStatus>('idle');

  const recomputeGlobalStatus = useCallback(() => {
    let best: AutoSaveStatus = 'idle';
    for (const status of statusMapRef.current.values()) {
      if (STATUS_PRIORITY[status] > STATUS_PRIORITY[best]) best = status;
    }
    setGlobalStatus(best);
  }, []);

  const registerPendingSave = useCallback(() => {
    pendingRef.current += 1;
  }, []);

  const unregisterPendingSave = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
  }, []);

  const registerDirty = useCallback(() => {
    dirtyRef.current += 1;
  }, []);

  const unregisterDirty = useCallback(() => {
    dirtyRef.current = Math.max(0, dirtyRef.current - 1);
  }, []);

  const registerFlush = useCallback((fn: () => void | Promise<void>) => {
    flushFnsRef.current.add(fn);
    return () => flushFnsRef.current.delete(fn);
  }, []);

  const reportStatus = useCallback(
    (id: string, status: AutoSaveStatus) => {
      statusMapRef.current.set(id, status);
      recomputeGlobalStatus();
    },
    [recomputeGlobalStatus],
  );

  const unregisterStatus = useCallback(
    (id: string) => {
      statusMapRef.current.delete(id);
      recomputeGlobalStatus();
    },
    [recomputeGlobalStatus],
  );

  const flushAll = useCallback(async () => {
    await Promise.all([...flushFnsRef.current].map((fn) => Promise.resolve(fn())));
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingRef.current <= 0 && dirtyRef.current <= 0) return;
      void flushAll();
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [flushAll]);

  const value = useMemo(
    () => ({
      globalStatus,
      registerPendingSave,
      unregisterPendingSave,
      registerDirty,
      unregisterDirty,
      registerFlush,
      reportStatus,
      unregisterStatus,
    }),
    [
      globalStatus,
      registerPendingSave,
      unregisterPendingSave,
      registerDirty,
      unregisterDirty,
      registerFlush,
      reportStatus,
      unregisterStatus,
    ],
  );

  return <AutoSaveContext.Provider value={value}>{children}</AutoSaveContext.Provider>;
}

export function useAutoSaveRegistry(): AutoSaveContextValue {
  const ctx = useContext(AutoSaveContext);
  if (!ctx) {
    throw new Error('useAutoSaveRegistry must be used within AutoSaveProvider');
  }
  return ctx;
}

export function useAutoSaveGlobalStatus(): AutoSaveStatus {
  const ctx = useContext(AutoSaveContext);
  return ctx?.globalStatus ?? 'idle';
}
