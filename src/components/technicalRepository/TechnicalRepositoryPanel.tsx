import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import {
  TECH_REPO_SECTIONS,
  type TechnicalRepositorySection,
} from '@/data/technicalRepository';
import { useTechnicalRepository } from '@/hooks/useTechnicalRepository';
import { TechnicalRepositoryCatalogSection } from '@/components/technicalRepository/TechnicalRepositoryCatalogSection';
import { TechnicalRepositoryWarrantySection } from '@/components/technicalRepository/TechnicalRepositoryWarrantySection';

type TechnicalRepositoryDisplay = 'inline' | 'header' | 'body';

interface TechnicalRepositoryPanelProps {
  userId: string;
  readOnly?: boolean;
  display?: TechnicalRepositoryDisplay;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

function HubCard({
  label,
  description,
  count,
  onClick,
}: {
  label: string;
  description: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-corporate-border bg-white px-4 py-3.5 hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-corporate-dark group-hover:text-corporate-black">
            {label}
          </p>
          <p className="text-xs text-corporate-muted mt-1 leading-snug">{description}</p>
        </div>
        <span className="text-[10px] font-medium tabular-nums text-corporate-muted shrink-0 mt-0.5">
          {count}
        </span>
      </div>
      <span className="text-[10px] text-corporate-gold mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
        Deschide →
      </span>
    </button>
  );
}

function TechnicalRepositoryContent({
  userId,
  readOnly,
  section,
  onSectionChange,
}: {
  userId: string;
  readOnly: boolean;
  section: TechnicalRepositorySection | null;
  onSectionChange: (section: TechnicalRepositorySection | null) => void;
}) {
  const data = useTechnicalRepository();
  const sectionMeta = section ? TECH_REPO_SECTIONS.find((s) => s.id === section) : null;

  if (section) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border/80 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-corporate-muted">Secțiune</p>
            <p className="text-sm font-semibold text-corporate-dark">{sectionMeta?.label}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSectionChange(null)}>
            ← Înapoi la hub
          </Button>
        </div>

        {section === 'produse' && (
          <TechnicalRepositoryCatalogSection
            intro={data.productsIntro}
            items={data.products}
            emptyLabel="HR va adăuga produse și fișe tehnice."
          />
        )}
        {section === 'materiale' && (
          <TechnicalRepositoryCatalogSection
            intro={data.materialsIntro}
            items={data.materials}
            emptyLabel="HR va adăuga standarde materiale."
          />
        )}
        {section === 'garantie' && (
          <TechnicalRepositoryWarrantySection
            intro={data.warrantyIntro}
            packs={data.warranty}
            userId={userId}
            readOnly={readOnly}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-1">
      <HubCard
        label={TECH_REPO_SECTIONS[0]!.label}
        description={TECH_REPO_SECTIONS[0]!.description}
        count={data.products.length}
        onClick={() => onSectionChange('produse')}
      />
      <HubCard
        label={TECH_REPO_SECTIONS[1]!.label}
        description={TECH_REPO_SECTIONS[1]!.description}
        count={data.materials.length}
        onClick={() => onSectionChange('materiale')}
      />
      <HubCard
        label={TECH_REPO_SECTIONS[2]!.label}
        description={TECH_REPO_SECTIONS[2]!.description}
        count={data.warranty.length}
        onClick={() => onSectionChange('garantie')}
      />
    </div>
  );
}

export function TechnicalRepositoryPanel({
  userId,
  readOnly = false,
  display = 'inline',
  expanded: expandedProp,
  onExpandedChange,
}: TechnicalRepositoryPanelProps) {
  const data = useTechnicalRepository();
  const [expandedInternal, setExpandedInternal] = useState(false);
  const [section, setSection] = useState<TechnicalRepositorySection | null>(null);

  const expanded = display === 'header' ? !!expandedProp : expandedInternal;
  const itemCount = data.products.length + data.materials.length + data.warranty.length;

  const handleToggle = () => {
    if (display === 'header') {
      if (expanded) setSection(null);
      onExpandedChange?.(!expanded);
      return;
    }
    setExpandedInternal((v) => {
      const next = !v;
      onExpandedChange?.(next);
      if (v) setSection(null);
      return next;
    });
  };

  if (display === 'body') {
    return (
      <TechnicalRepositoryContent
        userId={userId}
        readOnly={readOnly}
        section={section}
        onSectionChange={setSection}
      />
    );
  }

  return (
    <ProfessionalPanel
      variant="profile"
      icon="chart"
      eyebrow="Documentație tehnică"
      title="Repository Tehnic"
      subtitle="Produse · materiale · certificare garanție"
      collapsible
      expanded={expanded}
      onToggle={handleToggle}
      bodyDetached={display === 'header'}
      headerTile={display === 'header'}
      toggleLabels={{ expanded: 'Restrânge repository', collapsed: 'Deschide repository tehnic' }}
      badge={
        <span className="text-[10px] font-medium text-corporate-muted tabular-nums">
          {itemCount} resurse
        </span>
      }
      collapsedPeek={
        <p className="text-sm text-corporate-muted">
          Hub central — specificații produse, standarde materiale și certificare garanție.
        </p>
      }
    >
      <TechnicalRepositoryContent
        userId={userId}
        readOnly={readOnly}
        section={section}
        onSectionChange={setSection}
      />
    </ProfessionalPanel>
  );
}
