import { useFieldMode } from '@/context/FieldModeContext';
import { Button } from '@/components/ui/Button';

export function FieldModeToggle() {
  const { fieldMode, toggleFieldMode } = useFieldMode();

  return (
    <Button variant={fieldMode ? 'secondary' : 'ghost'} size="sm" onClick={toggleFieldMode} type="button">
      {fieldMode ? 'Mod șantier ON' : 'Mod șantier'}
    </Button>
  );
}
