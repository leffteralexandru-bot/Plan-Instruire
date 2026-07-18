import { Badge } from '@/components/ui/Badge';
import { EquipmentGuideDeviceView } from '@/components/equipment/EquipmentGuideDeviceView';
import type { TechnicalManual } from '@/data/technicalRepository';
import { technicalManualToDevice } from '@/lib/technicalManualAdapter';

function ManualCard({
  manual,
  number,
  onClick,
}: {
  manual: TechnicalManual;
  number: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-corporate-border bg-white px-4 py-3.5 hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10 transition-all"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums bg-corporate-surface text-corporate-dark group-hover:bg-corporate-black group-hover:text-white transition-colors"
          aria-hidden
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-corporate-dark group-hover:text-corporate-black">
                {manual.name}
              </p>
              {manual.description && (
                <p className="text-xs text-corporate-muted mt-1 leading-snug">{manual.description}</p>
              )}
            </div>
            <Badge variant="default">{manual.category}</Badge>
          </div>
          <span className="text-[10px] text-corporate-gold mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
            Deschide documentul →
          </span>
        </div>
      </div>
    </button>
  );
}

interface TechnicalRepositoryManualsSectionProps {
  intro?: string;
  manuals: TechnicalManual[];
  emptyLabel: string;
}

export function TechnicalRepositoryManualsSection({
  intro,
  manuals,
  emptyLabel,
  selectedManualId,
  onSelectManual,
  onBack,
}: TechnicalRepositoryManualsSectionProps & {
  selectedManualId: string | null;
  onSelectManual: (id: string | null) => void;
  onBack: () => void;
}) {
  const manual = manuals.find((m) => m.id === selectedManualId) ?? null;
  const manualNumber = manual ? manuals.findIndex((m) => m.id === manual.id) + 1 : undefined;

  if (manual) {
    return (
      <EquipmentGuideDeviceView
        device={technicalManualToDevice(manual)}
        manualNumber={manualNumber}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-4">
      {intro && <p className="text-sm text-corporate-muted leading-relaxed">{intro}</p>}
      {manuals.length === 0 ? (
        <p className="text-sm text-corporate-muted italic">{emptyLabel}</p>
      ) : (
        <div className="grid gap-2">
          {manuals.map((m, index) => (
            <ManualCard
              key={m.id}
              manual={m}
              number={index + 1}
              onClick={() => onSelectManual(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
