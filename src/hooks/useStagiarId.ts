import { useStagiarSelection } from '@/context/StagiarContext';

export function useStagiarId(): string | undefined {
  const { selectedStagiarId } = useStagiarSelection();
  return selectedStagiarId || undefined;
}

export function useStagiarName(): string {
  const { selectedStagiarName } = useStagiarSelection();
  return selectedStagiarName;
}
