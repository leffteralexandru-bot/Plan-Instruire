/** Mentenanță și operare echipament — ghiduri aparate de măsurat */

export type EquipmentGuideSectionId = 'curatare' | 'utilizare' | 'cad';

export type EquipmentAttachmentType = 'image' | 'pdf' | 'link';

export interface EquipmentAttachment {
  id: string;
  type: EquipmentAttachmentType;
  label?: string;
  url: string;
}

export interface EquipmentGuideSection {
  text: string;
  /** Pași numerotați (ex. protocol curățare) */
  steps: string[];
  attachments: EquipmentAttachment[];
}

/** Imagine din manual — click pe desen deschide videoclipul (ca în PDF Prodim). */
export interface EquipmentChapterFigure {
  id: string;
  imageUrl: string;
  alt: string;
  caption?: string;
  videoUrl?: string;
  videoLabel?: string;
}

export type EquipmentChapterCalloutVariant = 'warning' | 'attention' | 'tip' | 'note';

export type EquipmentChapterBlock =
  | { id: string; type: 'markdown'; body: string }
  | {
      id: string;
      type: 'callout';
      variant: EquipmentChapterCalloutVariant;
      title?: string;
      body: string;
    }
  | {
      id: string;
      type: 'figure';
      imageUrl: string;
      alt: string;
      caption?: string;
      videoUrl?: string;
      videoLabel?: string;
    }
  | { id: string; type: 'steps'; title?: string; items: string[] }
  | { id: string; type: 'definitions'; items: { term: string; definition: string }[] }
  | { id: string; type: 'bullet-list'; title?: string; items: string[] };

/** Capitol ghid tip manual (ex. Proliner) — layout responsive pe 4 ecrane. */
export interface EquipmentChapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  content: string;
  steps: string[];
  /** Blocuri ordonate — conținut complet ca în PDF (text, imagini, callout-uri). */
  blocks?: EquipmentChapterBlock[];
  videoUrl?: string;
  /** @deprecated folosiți blocks cu type figure */
  images: { id: string; url: string; alt?: string }[];
  figures?: EquipmentChapterFigure[];
  pdfUrl?: string;
  pdfFileName?: string;
}

export interface EquipmentSafetyWarning {
  title: string;
  content: string;
}

export interface EquipmentDevice {
  id: string;
  name: string;
  category: string;
  description?: string;
  /** Ghid pe capitole (prioritar față de secțiunile legacy). */
  chapters?: EquipmentChapter[];
  safetyWarning?: EquipmentSafetyWarning;
  manualPdfUrl?: string;
  curatare: EquipmentGuideSection;
  utilizare: EquipmentGuideSection;
  cad: EquipmentGuideSection;
}

export interface EquipmentOperationsData {
  intro?: string;
  devices: EquipmentDevice[];
  updatedAt?: string;
  updatedByName?: string;
}

export const EQUIPMENT_GUIDE_SECTIONS: {
  id: EquipmentGuideSectionId;
  label: string;
  description: string;
}[] = [
  {
    id: 'curatare',
    label: 'Protocol de curățare',
    description: 'Pași întreținere și curățare aparat',
  },
  {
    id: 'utilizare',
    label: 'Manual de utilizare',
    description: 'Mod de lucru corect pe teren',
  },
  {
    id: 'cad',
    label: 'Integrare CAD',
    description: 'Lucru cu fișiere CAD generate de utilaj',
  },
];

import {
  PROLINER_CHAPTERS,
  PROLINER_MANUAL_URL,
  PROLINER_SAFETY_WARNING,
} from '@/data/prolinerChapters';

function deviceId(): string {
  return `eq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function attachId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function section(
  text: string,
  steps: string[],
  attachments: Omit<EquipmentAttachment, 'id'>[] = [],
): EquipmentGuideSection {
  return {
    text,
    steps,
    attachments: attachments.map((a) => ({ ...a, id: attachId() })),
  };
}

export const DEFAULT_EQUIPMENT_OPERATIONS: EquipmentOperationsData = {
  intro:
    'Ghiduri pentru aparatele de măsurat utilizate în teren. Selectați aparatul, apoi parcurgeți capitolele sau secțiunile: curățare, utilizare, integrare CAD.',
  devices: [
    {
      id: 'eq-proliner',
      name: 'Proliner',
      category: 'Măsurare digitală',
      description: 'Ghid de pornire rapidă — hardware, software, măsurare și întreținere',
      chapters: PROLINER_CHAPTERS,
      safetyWarning: PROLINER_SAFETY_WARNING,
      manualPdfUrl: PROLINER_MANUAL_URL,
      curatare: section(
        '## Protocol curățare Proliner\n\nVezi Capitolul 11 — Întreținere din ghidul complet.',
        ['Curățare cablu cu cârpă fără praf', 'Fără lubrifianți sau detergenți'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 1–10 din ghidul Proliner pentru fluxul complet de măsurare.',
        [],
        [{ type: 'pdf', label: 'Ghid complet Proliner (PDF)', url: PROLINER_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Export DXF din Proliner (Capitol 9)\n- Import în proiectul CAD artGRANIT\n- Verificați compensarea și planul de proiecție',
        [],
      ),
    },
    {
      id: deviceId(),
      name: 'Stație totală / teodolit',
      category: 'Topografie',
      description: 'Măsurători unghi și distanță — repere și trasări',
      curatare: section(
        '## Protocol curățare\n\nÎntreținerea corectă prelungește viața opticii și precizia măsurătorilor.',
        [
          'Opriți aparatul și închideți capacul optic',
          'Îndepărtați praful uscat cu pensulă moale dedicată',
          'Curățați lentilele cu lavetă microfibră (fără presiune)',
          'Nu folosiți solvenți sau hârtie abrazivă',
          'Verificați șuruburile de fixare și starea bateriei',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\n- Stabilizați trepiedul pe suprafață rigidă\n- Nivelați bulele în limitele producătorului\n- Prindeți reperele în ordinea procedurii artGRANIT\n- Notați condițiile meteo (vânt, temperatură)',
        [],
        [{ type: 'pdf', label: 'Manual utilizare (PDF)', url: '/docs/equipment/total-station-manual.pdf' }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Exportați punctele în format .txt / .csv conform șablonului artGRANIT\n- Verificați unitatea de măsură (mm)\n- Importați în proiectul CAD cu stratul „Măsurători teren”\n- Păstrați fișierul sursă în dosarul proiectului',
        [],
      ),
    },
    {
      id: deviceId(),
      name: 'Laser distanță (distanțometru)',
      category: 'Distanță',
      description: 'Măsurători rapide distanță, suprafață, volum',
      curatare: section(
        '## Protocol curățare',
        [
          'Ștergeți lentila laser cu lavetă uscată',
          'Curățați carcasa cu material ușor umed',
          'Verificați absența zgârieturilor pe lentilă',
          'Depozitați în husă după utilizare',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\n- Țintiți perpendicular pe suprafața măsurată\n- Evitați măsurătorile în soare direct pe lentilă\n- Confirmați modul (distanță / suprafață / Pythagora)\n- Înregistrați valorile în fișa de teren',
        [],
      ),
      cad: section(
        '## Integrare CAD\n\n- Transcrieți dimensiunile validate în schița CAD\n- Marcați punctele de referință folosite la măsurare\n- Documentați abaterile față de planul arhitectural',
        [],
      ),
    },
    {
      id: deviceId(),
      name: 'Nivel laser rotativ',
      category: 'Nivelare',
      description: 'Trasare orizontală și verificare planitate',
      curatare: section(
        '## Protocol curățare',
        [
          'Opriți rotorul înainte de curățare',
          'Îndepărtați praful de pe corp și lentilă',
          'Verificați starea suportului și clemei',
          'Calibrare conform programului producătorului',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\n- Montați pe trepied stabil, departe de vibrații\n- Așteptați autonivelarea completă\n- Verificați referința pe mai multe puncte\n- Protejați aparatul de lovituri pe șantier',
        [],
      ),
      cad: section(
        '## Integrare CAD\n\n- Raportați cota de nivel în planul de secțiune\n- Notați punctele de verificare în legendă\n- Arhivați fotografia setup-ului pe teren',
        [],
      ),
    },
    {
      id: deviceId(),
      name: 'Ruletă digitală / bandă laser',
      category: 'Măsurare liniară',
      description: 'Verificări rapide dimensiuni și perimetre',
      curatare: section(
        '## Protocol curățare',
        [
          'Ștergeți banda cu lavetă uscată',
          'Nu forțați retragerea benzii dacă este murdară',
          'Verificați zero-ul la pornire',
          'Înlocuiți bateria la semnal slab',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\n- Aplicați banda drept, fără curburi\n- Confirmați fixarea capătului la punctul de start\n- Notați valoarea stabilă (nu în timpul retragerii)\n- Dublați măsurătorile critice',
        [],
      ),
      cad: section(
        '## Integrare CAD\n\n- Introduceți dimensiunile în tabelul de verificare CAD\n- Semnalați abaterile > toleranță artGRANIT către coordonator',
        [],
      ),
    },
  ],
};

export function isEquipmentGuideSectionId(v: string): v is EquipmentGuideSectionId {
  return EQUIPMENT_GUIDE_SECTIONS.some((s) => s.id === v);
}

export function isEquipmentChapterGuide(device: EquipmentDevice): boolean {
  return (device.chapters?.length ?? 0) > 0;
}

export function getDeviceSection(
  device: EquipmentDevice,
  sectionId: EquipmentGuideSectionId,
): EquipmentGuideSection {
  return device[sectionId];
}
