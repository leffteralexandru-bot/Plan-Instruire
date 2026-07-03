import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DepartmentId } from '@/data/departments';
import { storage } from '@/store/storage';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { canOpenMentorPanel } from '@/lib/accessControl';
import { isTraineeInActiveTraining } from '@/lib/hrReport';
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
  const traineesInProgram = useMemo(() => {
    const active = visibleTrainees.filter(isTraineeInActiveTraining);
    if (!user) return active;
    const selfIdx = active.findIndex((t) => t.id === user.id);
    if (selfIdx <= 0) return active;
    const sorted = [...active];
    const [self] = sorted.splice(selfIdx, 1);
    return [self, ...sorted];
  }, [visibleTrainees, user]);
  const [selectedStagiarId, setSelectedState] = useState(traineesInProgram[0]?.id ?? '');

  const hasOwnProgram = !!user && !!userStore.getEnrollmentForAngajat(user.id);

  useEffect(() => {
    const saved = storage.getSelectedStagiarId();
    if (saved && traineesInProgram.some((s) => s.id === saved)) {
      setSelectedState(saved);
    } else if (hasOwnProgram && user) {
      setSelectedState(user.id);
    } else if (traineesInProgram[0]) {
      setSelectedState(traineesInProgram[0].id);
    } else {
      setSelectedState('');
    }
  }, [user, traineesInProgram, hasOwnProgram]);

  const setSelectedStagiarId = useCallback((id: string) => {
    setSelectedState(id);
    storage.setSelectedStagiarId(id);
  }, []);

  const activeId = (() => {
    if (!user) return '';
    const monitored = traineesInProgram.find((t) => t.id === selectedStagiarId)?.id;
    if (monitored) return monitored;
    if (hasOwnProgram) return user.id;
    return traineesInProgram[0]?.id ?? '';
  })();

  const selected =
    visibleTrainees.find((s) => s.id === activeId) ??
    traineesInProgram.find((s) => s.id === activeId);

  const value = useMemo(
    () => ({
      selectedStagiarId: activeId,
      setSelectedStagiarId,
      stagiari: traineesInProgram,
      selectedStagiarName: selected?.name ?? 'Angajat',
    }),
    [activeId, setSelectedStagiarId, traineesInProgram, selected],
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
  const others = visibleTrainees.filter(
    (t) => t.id !== user?.id && isTraineeInActiveTraining(t),
  );
  return canOpenMentorPanel(user) && others.length > 0;
}

/** Departamentul instruirii active a angajatului curent */
export function useAngajatDepartment(): DepartmentId | undefined {
  const { user } = useAuth();
  if (!user) return undefined;
  return userStore.getActiveEnrollmentForAngajat(user.id)?.departmentId;
}
