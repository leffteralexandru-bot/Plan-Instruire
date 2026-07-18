import { useState } from 'react';
import { TechnicalRepositoryCatalogSection } from '@/components/technicalRepository/TechnicalRepositoryCatalogSection';
import { TechnicalRepositoryManualsSection } from '@/components/technicalRepository/TechnicalRepositoryManualsSection';
import type { TechnicalCatalogItem, TechnicalManual } from '@/data/technicalRepository';

interface TechnicalRepositoryProductsSectionProps {
  intro?: string;
  items: TechnicalCatalogItem[];
  productManuals: TechnicalManual[];
}

export function TechnicalRepositoryProductsSection({
  intro,
  items,
  productManuals,
}: TechnicalRepositoryProductsSectionProps) {
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {productManuals.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
              Chiuvete producător
            </p>
            <p className="text-xs text-corporate-muted mt-1 leading-relaxed">
              Specificații chiuvete și instrucțiuni de instalare Cosentino — Silestone® Integrity.
            </p>
          </div>
          <TechnicalRepositoryManualsSection
            manuals={productManuals}
            emptyLabel="Nu există documentație chiuvete încărcată."
            selectedManualId={selectedManualId}
            onSelectManual={setSelectedManualId}
            onBack={() => setSelectedManualId(null)}
          />
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {productManuals.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-corporate-muted">
              Catalog produse
            </p>
          )}
          <TechnicalRepositoryCatalogSection
            intro={productManuals.length > 0 ? undefined : intro}
            items={items}
            emptyLabel="HR va adăuga produse și fișe tehnice."
          />
        </div>
      )}

      {productManuals.length === 0 && items.length === 0 && intro && (
        <p className="text-sm text-corporate-muted leading-relaxed">{intro}</p>
      )}
    </div>
  );
}
