import { useCallback, useEffect, useState } from 'react';
import type { EquipmentOperationsData } from '@/data/equipmentOperations';
import { equipmentOperationsStore } from '@/lib/equipmentOperationsStore';

export function useEquipmentOperations(): EquipmentOperationsData {
  const [data, setData] = useState<EquipmentOperationsData>(() => equipmentOperationsStore.get());

  const refresh = useCallback(() => {
    setData(equipmentOperationsStore.get());
  }, []);

  useEffect(() => {
    window.addEventListener('equipment-operations-updated', refresh);
    return () => window.removeEventListener('equipment-operations-updated', refresh);
  }, [refresh]);

  return data;
}
