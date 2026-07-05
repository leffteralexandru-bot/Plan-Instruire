import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  WARRANTY_MATERIAL_LABELS,
  type WarrantyMaterialId,
  type WarrantyMaterialPack,
} from '@/data/technicalRepository';
import { technicalRepositoryStore } from '@/lib/technicalRepositoryStore';
import { SimpleMarkdown } from '@/lib/simpleMarkdown';
import { OperationalGuideChecklist } from '@/components/operational/OperationalGuideChecklist';

interface TechnicalRepositoryWarrantySectionProps {
  intro?: string;
  packs: WarrantyMaterialPack[];
  userId: string;
  readOnly?: boolean;
}

export function TechnicalRepositoryWarrantySection({
  intro,
  packs,
  userId,
  readOnly = false,
}: TechnicalRepositoryWarrantySectionProps) {
  const [activeId, setActiveId] = useState<WarrantyMaterialId>(packs[0]?.id ?? 'quartz');
  const [checked, setChecked] = useState<boolean[]>([]);
  const [mdOverride, setMdOverride] = useState<string | null>(null);
  const [mdLoading, setMdLoading] = useState(false);

  const active = packs.find((p) => p.id === activeId) ?? packs[0];

  useEffect(() => {
    if (!active) return;
    setChecked(technicalRepositoryStore.getWarrantyChecklist(userId, active.id));
    setMdOverride(null);

    if (!active.mdUrl) return;
    setMdLoading(true);
    fetch(active.mdUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => setMdOverride(text))
      .catch(() => setMdOverride(null))
      .finally(() => setMdLoading(false));
  }, [active?.id, active?.mdUrl, userId]);

  const toggle = (index: number) => {
    if (readOnly || !active) return;
    setChecked(
      technicalRepositoryStore.setWarrantyChecklistItem(
        userId,
        active.id,
        index,
        !checked[index],
        active.checklist.length,
      ),
    );
  };

  const allChecked =
    active && active.checklist.length > 0 && checked.filter(Boolean).length === active.checklist.length;

  const markdownSource = mdOverride ?? active?.markdown ?? '';

  return (
    <div className="space-y-4">
      {intro && <p className="text-sm text-corporate-muted leading-relaxed">{intro}</p>}

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(WARRANTY_MATERIAL_LABELS) as WarrantyMaterialId[]).map((id) => {
          const pack = packs.find((p) => p.id === id);
          if (!pack) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveId(id)}
              className={[
                'rounded-lg px-3 py-2 text-xs sm:text-sm font-medium border transition-colors',
                activeId === id
                  ? 'bg-corporate-black text-white border-corporate-black'
                  : 'bg-white text-corporate-dark border-corporate-border hover:border-corporate-gold/40',
              ].join(' ')}
            >
              {pack.label}
            </button>
          );
        })}
      </div>

      {active && (
        <>
          <Card padding="sm" className="bg-corporate-surface/30">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-sm font-semibold text-corporate-dark">Reguli garanție — {active.label}</p>
              {active.mdUrl && (
                <Badge variant="info">Sursă .md</Badge>
              )}
            </div>
            {mdLoading ? (
              <p className="text-xs text-corporate-muted">Se încarcă regulile…</p>
            ) : (
              <SimpleMarkdown source={markdownSource} />
            )}
            {active.mdUrl && (
              <a
                href={active.mdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-[10px] text-corporate-gold hover:underline"
              >
                Deschide fișier Markdown →
              </a>
            )}
          </Card>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted mb-2">
              Checklist certificare conformitate
            </p>
            <OperationalGuideChecklist
              items={active.checklist}
              checked={checked}
              onToggle={toggle}
              readOnly={readOnly}
              emptyMessage="HR va defini punctele de certificare."
            />
            {!readOnly && allChecked && (
              <p className="text-xs font-medium text-emerald-700 mt-2">
                Toate punctele sunt bifate — conformitate certificată pentru {active.label}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
