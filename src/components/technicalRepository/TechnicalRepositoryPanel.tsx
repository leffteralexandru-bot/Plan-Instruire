import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import {
  TECH_REPO_SECTIONS,
  type TechnicalRepositorySection,
} from '@/data/technicalRepository';
import { useTechnicalRepository } from '@/hooks/useTechnicalRepository';
import { TechnicalRepositoryProductsSection } from '@/components/technicalRepository/TechnicalRepositoryProductsSection';
import { TechnicalRepositoryManualsSection } from '@/components/technicalRepository/TechnicalRepositoryManualsSection';

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
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);

  const handleSectionBack = () => {
    setSelectedManualId(null);
    onSectionChange(null);
  };

  if (section) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border/80 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-corporate-muted">Secțiune</p>
            <p className="text-sm font-semibold text-corporate-dark">{sectionMeta?.label}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleSectionBack}>
            ← Înapoi la hub
          </Button>
        </div>

        {section === 'produse' && (
          <TechnicalRepositoryProductsSection
            intro={data.productsIntro}
            items={data.products}
            productManuals={data.productManuals}
          />
        )}
        {section === 'manuale' && (
          <TechnicalRepositoryManualsSection
            intro={data.manualsIntro}
            manuals={data.manuals}
            emptyLabel="Nu există documente cu reguli producător încărcate încă."
            selectedManualId={selectedManualId}
            onSelectManual={setSelectedManualId}
            onBack={() => setSelectedManualId(null)}
          />
        )}
      </div>
    );
  }

  const sectionCounts: Record<TechnicalRepositorySection, number> = {
    manuale: data.manuals.length,
    produse: data.productManuals.length,
  };

  return (
    <div className="grid gap-2 sm:grid-cols-1">
      {TECH_REPO_SECTIONS.map((s) => (
        <HubCard
          key={s.id}
          label={s.label}
          description={s.description}
          count={sectionCounts[s.id]}
          onClick={() => onSectionChange(s.id)}
        />
      ))}
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
  const itemCount = data.productManuals.length + data.manuals.length;

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
      subtitle="Reguli producător · specificații produse"
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
          Hub central — reguli producător pentru rezistență și garanție, specificații tehnice produse.
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
