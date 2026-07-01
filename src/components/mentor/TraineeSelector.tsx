import { useStagiarSelection, useCanSelectStagiar } from '@/context/StagiarContext';
import { Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function TraineeSelector() {
  const canSelect = useCanSelectStagiar();
  const { stagiari, selectedStagiarId, setSelectedStagiarId, selectedStagiarName } = useStagiarSelection();

  if (!canSelect) return null;

  return (
    <Card padding="sm" className="mb-6">
      <Select
        id="trainee-select"
        label="Stagiar monitorizat"
        value={selectedStagiarId}
        onChange={(e) => setSelectedStagiarId(e.target.value)}
        options={stagiari.map((s) => ({ value: s.id, label: s.name }))}
      />
      <p className="text-xs text-corporate-muted mt-2">
        Progresul afișat: <strong>{selectedStagiarName}</strong>
      </p>
    </Card>
  );
}
