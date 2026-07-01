import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface FieldModeContextValue {
  fieldMode: boolean;
  toggleFieldMode: () => void;
}

const FieldModeContext = createContext<FieldModeContextValue | null>(null);
const KEY = 'artgranit_field_mode';

export function FieldModeProvider({ children }: { children: ReactNode }) {
  const [fieldMode, setFieldMode] = useState(() => localStorage.getItem(KEY) === '1');

  useEffect(() => {
    localStorage.setItem(KEY, fieldMode ? '1' : '0');
    document.documentElement.classList.toggle('field-mode', fieldMode);
  }, [fieldMode]);

  const value = useMemo(
    () => ({
      fieldMode,
      toggleFieldMode: () => setFieldMode((v) => !v),
    }),
    [fieldMode],
  );

  return <FieldModeContext.Provider value={value}>{children}</FieldModeContext.Provider>;
}

export function useFieldMode() {
  const ctx = useContext(FieldModeContext);
  if (!ctx) throw new Error('useFieldMode în FieldModeProvider');
  return ctx;
}
