import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TechnicalCard } from '@/components/equipment/TechnicalCard';
import type { EquipmentSafetyWarning } from '@/data/equipmentOperations';
import {
  acknowledgeEquipmentSafety,
  hasAcknowledgedEquipmentSafety,
} from '@/lib/equipmentSafetyAck';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';

interface EquipmentSafetyWarningCardProps {
  deviceId: string;
  warning: EquipmentSafetyWarning;
  onAcknowledged?: () => void;
}

/**
 * Afișat obligatoriu la prima accesare a ghidului unui echipament.
 */
export function EquipmentSafetyWarningCard({
  deviceId,
  warning,
  onAcknowledged,
}: EquipmentSafetyWarningCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasAcknowledgedEquipmentSafety(deviceId));
  }, [deviceId]);

  if (!visible) return null;

  const handleAck = () => {
    acknowledgeEquipmentSafety(deviceId);
    setVisible(false);
    onAcknowledged?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 @min-[640px]:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-safety-title"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-neural-lg">
        <TechnicalCard
          as="article"
          variant="safety"
          title={warning.title}
          titleId="equipment-safety-title"
          subtitle="Citiți înainte de a utiliza echipamentul"
        >
          <div className="prose prose-sm max-w-none text-corporate-dark">
            <SimpleMarkdown source={warning.content} />
          </div>
          <div className="mt-4 flex flex-col gap-2 @min-[640px]:flex-row">
            <Button type="button" variant="primary" fullWidth onClick={handleAck}>
              Am citit și înțeles
            </Button>
          </div>
        </TechnicalCard>
      </div>
    </div>
  );
}
