/** Repository Tehnic artGRANIT — hub documentație (separat de Ghid Operațional) */

export type TechnicalRepositorySection = 'produse' | 'materiale' | 'garantie';

export type WarrantyMaterialId = 'quartz' | 'granit' | 'marmura' | 'ceramica';

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

export interface WarrantyMaterialPack {
  id: WarrantyMaterialId;
  label: string;
  /** Conținut Markdown — editabil HR sau încărcat din mdUrl */
  markdown: string;
  /** Cale opțională fișier .md în /public (ex. /docs/repository/warranty/quartz.md) */
  mdUrl?: string;
  /** Puncte checklist certificare conformitate */
  checklist: string[];
}

export interface TechnicalRepositoryData {
  productsIntro?: string;
  materialsIntro?: string;
  warrantyIntro?: string;
  products: TechnicalCatalogItem[];
  materials: TechnicalCatalogItem[];
  warranty: WarrantyMaterialPack[];
  updatedAt?: string;
  updatedByName?: string;
}

export const TECH_REPO_SECTIONS: {
  id: TechnicalRepositorySection;
  label: string;
  description: string;
}[] = [
  {
    id: 'produse',
    label: 'Specificații tehnice produse',
    description: 'Chiuvete, baterii, accesorii — fișe și cataloage',
  },
  {
    id: 'materiale',
    label: 'Standarde materiale & prelucrare',
    description: 'Quartz, granit, marmură, ceramică — greutate, debitare, fișe',
  },
  {
    id: 'garantie',
    label: 'Certificare garanție',
    description: 'Reguli per material · checklist conformitate',
  },
];

export const WARRANTY_MATERIAL_LABELS: Record<WarrantyMaterialId, string> = {
  quartz: 'Quartz',
  granit: 'Granit',
  marmura: 'Marmură',
  ceramica: 'Ceramică',
};

const DEFAULT_WARRANTY_MD: Record<WarrantyMaterialId, string> = {
  quartz:
    '## Garanție — Quartz\n\n- Verificați lotul și fișa producătorului\n- Respectați grosimea minimă recomandată\n- Documentați decupajele și muchiile finisate\n- Păstrați dovada montajului conform procedurii artGRANIT',
  granit:
    '## Garanție — Granit natural\n\n- Confirmați originea materialului\n- Verificați tratamentul suprafeței\n- Respectați limitele de debitare pentru granit dur\n- Fotografiați starea la livrare',
  marmura:
    '## Garanție — Marmură\n\n- Atenție la materiale poroase — tratament obligatoriu\n- Verificați compatibilitatea adezivului\n- Evitați contactul prelungit cu acizi\n- Documentați finisajele aplicate',
  ceramica:
    '## Garanție — Ceramică\n\n- Verificați clasificarea PEI / rezistență\n- Respectați rosturile minime\n- Confirmați suportul plan\n- Arhivați certificatul furnizorului',
};

function defaultWarrantyChecklist(label: string): string[] {
  return [
    `Am verificat fișa tehnică ${label} și lotul materialului`,
    'Documentația foto/video la livrare este completă',
    'Prelucrarea respectă limitele de debitare artGRANIT',
    'Clientul a fost informat despre condițiile de garanție',
  ];
}

function catalogId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const DEFAULT_TECHNICAL_REPOSITORY: TechnicalRepositoryData = {
  productsIntro:
    'Catalog produse finite utilizate în proiecte artGRANIT. Consultați fișa tehnică înainte de specificare.',
  materialsIntro:
    'Standarde pentru piatră naturală și materiale compozite — greutate, limite debitare, prelucrare.',
  warrantyIntro:
    'Citiți regulile pentru tipul de material, apoi bifați checklist-ul de conformitate înainte de certificare.',
  products: [
    {
      id: catalogId('prod'),
      title: 'Chiuvetă sub blat — model standard',
      category: 'Chiuvete',
      description: 'Dimensiuni și decupaj standard bucătărie',
      specs: { montaj: 'Sub blat', material: 'Inox / compozit' },
    },
    {
      id: catalogId('prod'),
      title: 'Baterie monocomandă',
      category: 'Baterii',
      description: 'Gaură standard Ø35 mm',
      specs: { debit: 'Standard', finisaj: 'Crom / negru mat' },
    },
  ],
  materials: [
    {
      id: catalogId('mat'),
      title: 'Quartz compozit',
      category: 'Quartz',
      description: 'Plăci compozit — regim industrial',
      specs: {
        greutate: '~24–28 kg/m² (20 mm)',
        debitare: 'Disc diamant, turație redusă',
        grosime: '20 / 30 mm',
      },
    },
    {
      id: catalogId('mat'),
      title: 'Granit natural',
      category: 'Granit',
      description: 'Piatră naturală — variabilitate desen',
      specs: {
        greutate: '~28–32 kg/m² (20 mm)',
        debitare: 'Răcire continuă, disc segmentat',
        grosime: '20 / 30 / 40 mm',
      },
    },
    {
      id: catalogId('mat'),
      title: 'Marmură',
      category: 'Marmură',
      description: 'Piatră calcaroasă — atenție la porozitate',
      specs: {
        greutate: '~26–30 kg/m² (20 mm)',
        debitare: 'Viteză redusă, suport rigid',
        tratament: 'Impermeabilizare recomandată',
      },
    },
    {
      id: catalogId('mat'),
      title: 'Ceramică / sinterizat',
      category: 'Ceramică',
      description: 'Plăci ceramice mari format',
      specs: {
        greutate: 'Conform fișei producător',
        debitare: 'Disc continuu, suport plin',
        rost: 'Min. conform producător',
      },
    },
  ],
  warranty: (['quartz', 'granit', 'marmura', 'ceramica'] as WarrantyMaterialId[]).map((id) => ({
    id,
    label: WARRANTY_MATERIAL_LABELS[id],
    markdown: DEFAULT_WARRANTY_MD[id],
    mdUrl: `/docs/repository/warranty/${id}.md`,
    checklist: defaultWarrantyChecklist(WARRANTY_MATERIAL_LABELS[id]),
  })),
};

export function isTechnicalRepositorySection(v: string): v is TechnicalRepositorySection {
  return TECH_REPO_SECTIONS.some((s) => s.id === v);
}

export function isWarrantyMaterialId(v: string): v is WarrantyMaterialId {
  return v in WARRANTY_MATERIAL_LABELS;
}
