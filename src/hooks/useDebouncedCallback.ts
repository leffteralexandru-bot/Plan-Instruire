import { useCallback, useEffect, useRef } from 'react';

/** Callback debounced — util pentru auto-save și căutări. */
export function useDebouncedCallback<T extends (...args: never[]) => void | Promise<void>>(
  callback: T,
  delayMs: number,
): T & { flush: () => void; cancel: () => void } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (!timerRef.current || !argsRef.current) return;
    cancel();
    void callbackRef.current(...argsRef.current);
  }, [cancel]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const pending = argsRef.current;
        argsRef.current = null;
        if (pending) void callbackRef.current(...pending);
      }, delayMs);
    },
    [delayMs],
  ) as T & { flush: () => void; cancel: () => void };

  debounced.flush = flush;
  debounced.cancel = cancel;

  useEffect(() => cancel, [cancel]);

  return debounced;
}
