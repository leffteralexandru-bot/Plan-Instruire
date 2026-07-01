import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STAGIARI } from '@/data/users';
import { storage } from '@/store/storage';
import { useAuth } from '@/hooks/useAuth';

interface StagiarContextValue {
  selectedStagiarId: string;
  setSelectedStagiarId: (id: string) => void;
  stagiari: typeof STAGIARI;
  selectedStagiarName: string;
}

const StagiarContext = createContext<StagiarContextValue | null>(null);

export function StagiarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedStagiarId, setSelectedState] = useState(STAGIARI[0]?.id ?? '');

  useEffect(() => {
    const saved = storage.getSelectedStagiarId();
    if (saved && STAGIARI.some((s) => s.id === saved)) {
      setSelectedState(saved);
    } else if (user?.role === 'stagiar') {
      setSelectedState(user.id);
    }
  }, [user]);

  const setSelectedStagiarId = useCallback((id: string) => {
    setSelectedState(id);
    storage.setSelectedStagiarId(id);
  }, []);

  const activeId = user?.role === 'stagiar' ? user.id : selectedStagiarId;
  const selected = STAGIARI.find((s) => s.id === activeId);

  const value = useMemo(
    () => ({
      selectedStagiarId: activeId,
      setSelectedStagiarId,
      stagiari: STAGIARI,
      selectedStagiarName: selected?.name ?? 'Stagiar',
    }),
    [activeId, setSelectedStagiarId, selected],
  );

  return <StagiarContext.Provider value={value}>{children}</StagiarContext.Provider>;
}

export function useStagiarSelection() {
  const ctx = useContext(StagiarContext);
  if (!ctx) throw new Error('useStagiarSelection în StagiarProvider');
  return ctx;
}

export function useCanSelectStagiar() {
  const { user, isMentor, isAdmin } = useAuth();
  return isMentor || isAdmin || user?.role === 'admin';
}
