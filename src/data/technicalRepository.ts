/** Repository Tehnic artGRANIT — hub documentație (separat de Ghid Operațional) */

import type { EquipmentChapter } from '@/data/equipmentOperations';
import { DEKTON_KITCHEN_CHAPTERS } from '@/data/dektonKitchenChapters';
import { COSENTINO_FURNITURE_CHAPTERS } from '@/data/cosentinoFurnitureChapters';
import { SILESTONE_CHAPTERS } from '@/data/silestoneChapters';
import { SILESTONE_INTEGRITY_CHAPTERS } from '@/data/silestoneIntegrityChapters';
import { SILESTONE_INTEGRITY_DRAWINGS_CHAPTERS } from '@/data/silestoneIntegrityDrawingsChapters';

export type TechnicalRepositorySection = 'manuale' | 'produse';

export interface TechnicalCatalogItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  /** Link fișă tehnică (PDF, doc, pagină) */
  documentUrl?: string;
  /** Specificații cheie-valoare (greutate, debitare, grosime…) */
  specs: Record<string, string>;
}

/** Manual tehnic interactiv — capitole + pagini PNG (ca la Utilaje teren). */
export interface TechnicalManual {
  id: string;
  name: string;
  category: string;
  description?: string;
  chapters: EquipmentChapter[];
  manualPdfUrl?: string;
}

export interface TechnicalRepositoryData {
  productsIntro?: string;
  manualsIntro?: string;
  products: TechnicalCatalogItem[];
  /** Manuale interactive pentru produse finite (ex. chiuvete producător). */
  productManuals: TechnicalManual[];
  manuals: TechnicalManual[];
  updatedAt?: string;
  updatedByName?: string;
}

export const TECH_REPO_SECTIONS: {
  id: TechnicalRepositorySection;
  label: string;
  description: string;
}[] = [
  {
    id: 'manuale',
    label: 'Reguli producător & garanție',
    description:
      'Condiții oficiale pentru rezistență și garanția proiectelor — ingineri, măsurători, proiectanți',
  },
  {
    id: 'produse',
    label: 'Specificații tehnice produse',
    description: 'Chiuvete, baterii, accesorii — fișe producător și cataloage',
  },
];

export const DEFAULT_TECHNICAL_REPOSITORY: TechnicalRepositoryData = {
  productsIntro:
    'Documentație oficială a producătorilor — chiuvete Silestone® Integrity (planșe tehnice și ghid instalare). Fiecare document este extras din PDF-ul producătorului, organizat pe capitole cu pagini vizuale.',
  manualsIntro:
    'Reguli și condiții impuse de producătorii de materiale (quartz, granit, marmură, ceramică). Nu sunt proceduri artGRANIT, ci cerințe oficiale de prelucrare, montaj și aplicare care trebuie respectate în proiectare pentru a asigura rezistența lucrărilor și validitatea garanției. Fiecare manual este extras din PDF-ul Cosentino, cu capitole și pagini identice documentului original.',
  products: [],
  productManuals: [
    {
      id: 'product-silestone-integrity-sinks',
      name: 'Silestone® Integrity — Chiuvete',
      category: 'Chiuvete · Cosentino',
      description:
        'Planșe tehnice producător — modele Integrity (ONE, DUE, Q), dimensiuni și decupaj blat',
      chapters: SILESTONE_INTEGRITY_DRAWINGS_CHAPTERS,
      manualPdfUrl: '/docs/repository/silestone-sinks/install-drawings.pdf',
    },
    {
      id: 'product-silestone-integrity-install',
      name: 'Instrucțiuni instalare chiuvete Silestone® Integrity',
      category: 'Chiuvete · Cosentino',
      description:
        'Ghid oficial instalare: undermount cu benzi, chiuvetă integrată, montaj cu adeziv și încorporată',
      chapters: SILESTONE_INTEGRITY_CHAPTERS,
      manualPdfUrl: '/docs/repository/silestone-sinks/integrity-guide.pdf',
    },
  ],
  manuals: [
    {
      id: 'manual-silestone',
      name: 'Cerințe Silestone® — Proiectare și instalare blaturi',
      category: 'Quartz compozit · Cosentino',
      description:
        'Reguli oficiale Cosentino: specificații de fabricație, toleranțe, suport și montaj — condiții pentru rezistență și garanție la blaturi de bucătărie',
      chapters: SILESTONE_CHAPTERS,
      manualPdfUrl: '/docs/repository/silestone/silestone-countertops-manual.pdf',
    },
    {
      id: 'manual-dekton-kitchen',
      name: 'Cerințe Dekton® — Proiectare și instalare blaturi bucătărie',
      category: 'Ceramică sinterizată · Cosentino',
      description:
        'Reguli oficiale Cosentino pentru blaturi Dekton® — familii I–IV, XGloss, Grip+, proiectare, suport, montaj și garanție',
      chapters: DEKTON_KITCHEN_CHAPTERS,
      manualPdfUrl: '/docs/repository/dekton-kitchen/dekton-kitchen-countertops-manual.pdf',
    },
    {
      id: 'manual-cosentino-furniture',
      name: 'Cerințe Cosentino® Spaces — Mobilier design & instalare',
      category: 'Mobilier · Cosentino',
      description:
        'Reguli oficiale proiectare și instalare mobilier Silestone®/Dekton® — structuri, mese, blaturi, ancorare și ambalare',
      chapters: COSENTINO_FURNITURE_CHAPTERS,
      manualPdfUrl: '/docs/repository/cosentino-furniture/furniture-design-installation.pdf',
    },
  ],
};

export function isTechnicalRepositorySection(v: string): v is TechnicalRepositorySection {
  return TECH_REPO_SECTIONS.some((s) => s.id === v);
}
