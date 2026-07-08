import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  OPERATIONAL_GUIDE_LABELS,
  type OperationalGuideTask,
} from '@/data/operationalGuide';
import { operationalGuideStore } from '@/lib/operationalGuideStore';
import { OperationalGuideVideo } from '@/components/operational/OperationalGuideVideo';
import { OperationalGuideChecklist } from '@/components/operational/OperationalGuideChecklist';
import { OperationalGuidePreMeasurementRules } from '@/components/operational/OperationalGuidePreMeasurementRules';
import { PanelSubsection } from '@/components/ui/ProfessionalPanel';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';

interface OperationalGuideTaskViewProps {
  task: OperationalGuideTask;
  userId: string;
  readOnly?: boolean;
}

export function OperationalGuideTaskView({ task, userId, readOnly = false }: OperationalGuideTaskViewProps) {
  const phoneLayout = usePhoneLayout();
  const [equipChecked, setEquipChecked] = useState<boolean[]>(() =>
    operationalGuideStore.getEquipmentChecklist(userId, task.id),
  );

  useEffect(() => {
    setEquipChecked(operationalGuideStore.getEquipmentChecklist(userId, task.id));
  }, [userId, task.id, task.equipment.length]);

  const toggleEquip = (index: number) => {
    if (readOnly) return;
    setEquipChecked(
      operationalGuideStore.setEquipmentChecklistItem(
        userId,
        task.id,
        index,
        !equipChecked[index],
        task.equipment.length,
      ),
    );
  };

  const label = OPERATIONAL_GUIDE_LABELS[task.id];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-corporate-dark">Măsurare {label}</h3>
          {task.categorySubtitle && <Badge variant="default">{task.categorySubtitle}</Badge>}
        </div>
        {!phoneLayout &&
          (task.introText ? (
            <p className="text-sm text-corporate-muted mt-1 leading-relaxed whitespace-pre-wrap">{task.introText}</p>
          ) : (
            <p className="text-sm text-corporate-muted mt-1 italic">
              Citiți regulile obligatorii înainte de a confirma deplasarea la șantier.
            </p>
          ))}
        {task.updatedAt && (
          <p className="text-[10px] text-corporate-muted mt-2">
            Actualizat {new Date(task.updatedAt).toLocaleDateString('ro-RO')}
            {task.updatedByName ? ` · ${task.updatedByName}` : ''}
          </p>
        )}
      </div>

      <OperationalGuidePreMeasurementRules
        key={task.id}
        conditions={task.preMeasurementConditions}
        categoryLabel={task.categorySubtitle}
        defaultExpanded={false}
      />

      <PanelSubsection label="Echipament necesar">
        <OperationalGuideChecklist
          items={task.equipment}
          checked={equipChecked}
          onToggle={toggleEquip}
          readOnly={readOnly}
          emptyMessage="Lista de echipament va fi adăugată de HR."
        />
        {!readOnly && task.equipment.length > 0 && (
          <p className="text-[10px] text-corporate-muted mt-2">
            Bifă echipamentul pregătit — salvat local pe dispozitiv, util pe teren.
          </p>
        )}
      </PanelSubsection>

      <PanelSubsection label="Pași de măsurare">
        {task.steps.length === 0 ? (
          <Card padding="sm" className="border-dashed bg-corporate-surface/40">
            <p className="text-sm text-corporate-muted">Pașii vor fi adăugați de HR.</p>
          </Card>
        ) : (
          <ol className="space-y-2 list-none">
            {task.steps.map((step, index) => (
              <li
                key={`${task.id}-step-${index}`}
                className="flex gap-3 rounded-xl border border-corporate-border bg-white px-4 py-3"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-corporate-gold/15 text-xs font-bold text-amber-900"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <p className="text-sm text-corporate-dark leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        )}
      </PanelSubsection>

      <OperationalGuideVideo url={task.videoUrl} title={task.videoTitle} />
    </div>
  );
}
