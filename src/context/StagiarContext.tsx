import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DepartmentId } from '@/data/departments';
import { storage } from '@/store/storage';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { canOpenMentorPanel } from '@/lib/accessControl';
import type { TraineeProfile } from '@/types';
import { userStore } from '@/lib/userStore';

interface StagiarContextValue {
  selectedStagiarId: string;
  setSelectedStagiarId: (id: string) => void;
  stagiari: TraineeProfile[];
  selectedStagiarName: string;
}

const StagiarContext = createContext<StagiarContextValue | null>(null);

export function StagiarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { visibleTrainees } = useUsers();
  const [selectedStagiarId, setSelectedState] = useState(visibleTrainees[0]?.id ?? '');

  const hasOwnTraining = !!user && !!userStore.getActiveEnrollmentForAngajat(user.id);

  useEffect(() => {
    const saved = storage.getSelectedStagiarId();
    if (saved && visibleTrainees.some((s) => s.id === saved)) {
      setSelectedState(saved);
    } else if (hasOwnTraining && user) {
      setSelectedState(user.id);
    } else if (visibleTrainees[0]) {
      setSelectedState(visibleTrainees[0].id);
    }
  }, [user, visibleTrainees, hasOwnTraining]);

  const setSelectedStagiarId = useCallback((id: string) => {
    setSelectedState(id);
    storage.setSelectedStagiarId(id);
  }, []);

  const activeId =
    hasOwnTraining && user && selectedStagiarId && selectedStagiarId !== user.id
      ? selectedStagiarId
      : hasOwnTraining && user
        ? user.id
        : selectedStagiarId || visibleTrainees[0]?.id || '';

  const selected = visibleTrainees.find((s) => s.id === activeId);

  const value = useMemo(
    () => ({
      selectedStagiarId: activeId,
      setSelectedStagiarId,
      stagiari: visibleTrainees,
      selectedStagiarName: selected?.name ?? 'Angajat',
    }),
    [activeId, setSelectedStagiarId, visibleTrainees, selected],
  );

  return <StagiarContext.Provider value={value}>{children}</StagiarContext.Provider>;
}

export function useStagiarSelection() {
  const ctx = useContext(StagiarContext);
  if (!ctx) throw new Error('useStagiarSelection în StagiarProvider');
  return ctx;
}

export function useCanSelectStagiar() {
  const { user } = useAuth();
  const { visibleTrainees } = useUsers();
  const others = visibleTrainees.filter((t) => t.id !== user?.id);
  return canOpenMentorPanel(user) && others.length > 0;
}

/** Departamentul instruirii active a angajatului curent */
export function useAngajatDepartment(): DepartmentId | undefined {
  const { user } = useAuth();
  if (!user) return undefined;
  return userStore.getActiveEnrollmentForAngajat(user.id)?.departmentId;
}
