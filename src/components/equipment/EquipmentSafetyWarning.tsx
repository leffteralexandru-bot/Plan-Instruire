import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TechnicalCard } from '@/components/equipment/TechnicalCard';
import type { EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';

interface EquipmentSafetyWarningCardProps {
  warning: EquipmentSafetyWarning;
  onAcknowledged?: () => void;
  /** inline = în pagină (meniul de sus rămâne vizibil); modal = pe tot ecranul */
  placement?: 'modal' | 'inline';
}

/** Afișat obligatoriu la fiecare intrare în ghidul echipamentului. */
export function EquipmentSafetyWarningCard({
  warning,
  onAcknowledged,
  placement = 'modal',
}: EquipmentSafetyWarningCardProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleAck = () => {
    setVisible(false);
    onAcknowledged?.();
  };

  const card = (
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
  );

  if (placement === 'inline') {
    return (
      <div
        className="mb-4"
        role="region"
        aria-labelledby="equipment-safety-title"
      >
        {card}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 @min-[640px]:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-safety-title"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-neural-lg">
        {card}
      </div>
    </div>
  );
}
