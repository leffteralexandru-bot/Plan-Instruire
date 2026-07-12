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

export interface EquipmentManualPageHotspot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EquipmentManualPageVideoHotspot extends EquipmentManualPageHotspot {
  videoUrl: string;
}

export interface EquipmentManualPage {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  hotspot?: EquipmentManualPageHotspot;
  /** Zone play multiple pe aceeași pagină (ex. manual Prodim CT). */
  videoHotspots?: EquipmentManualPageVideoHotspot[];
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
  /** Pagini manual (doar imagine + hotspot video) — prioritar la afișare. */
  pages?: EquipmentManualPage[];
  /** Blocuri ordonate — fallback pentru alte echipamente. */
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
import {
  PRODIM_CT_CHAPTERS,
  PRODIM_CT_MANUAL_URL,
  PRODIM_CT_SAFETY_WARNING,
} from '@/data/prodimCtChapters';
import {
  PROLINER_4X_CHAPTERS,
  PROLINER_4X_MANUAL_URL,
  PROLINER_4X_SAFETY_WARNING,
} from '@/data/proliner4xChapters';
import {
  PRODIM_STAIRS_CHAPTERS,
  PRODIM_STAIRS_MANUAL_URL,
  PRODIM_STAIRS_SAFETY_WARNING,
} from '@/data/prodimStairsChapters';
import {
  PROLINER_STAIRS_APP_CHAPTERS,
  PROLINER_STAIRS_APP_MANUAL_URL,
  PROLINER_STAIRS_APP_SAFETY_WARNING,
} from '@/data/prolinerStairsAppChapters';
import {
  PROLINER_REMOTE_CHAPTERS,
  PROLINER_REMOTE_MANUAL_URL,
  PROLINER_REMOTE_SAFETY_WARNING,
} from '@/data/prolinerRemoteChapters';
import {
  PROLINER_NEW_REMOTE_CHAPTERS,
  PROLINER_NEW_REMOTE_MANUAL_URL,
  PROLINER_NEW_REMOTE_SAFETY_WARNING,
} from '@/data/prolinerNewRemoteChapters';
import {
  BOSCH_GLL_380_CHAPTERS,
  BOSCH_GLL_380_MANUAL_URL,
  BOSCH_GLL_380_SAFETY_WARNING,
} from '@/data/boschGll380Chapters';
import {
  BOSCH_GLM_40_CHAPTERS,
  BOSCH_GLM_40_MANUAL_URL,
  BOSCH_GLM_40_SAFETY_WARNING,
} from '@/data/boschGlm40Chapters';
import {
  BOSCH_TAPE_5M_CHAPTERS,
  BOSCH_TAPE_5M_MANUAL_URL,
  BOSCH_TAPE_5M_SAFETY_WARNING,
} from '@/data/boschTape5mChapters';
import {
  FACTORY_FABRICATOR_CHAPTERS,
  FACTORY_FABRICATOR_MANUAL_URL,
  FACTORY_FABRICATOR_SAFETY_WARNING,
} from '@/data/factoryFabricatorChapters';

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
      name: 'GHID DE PORNIRE RAPIDĂ PROLINER',
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
      id: 'eq-factory-fabricator',
      name: 'FABRICATOR FABRICĂ — MANUAL SOFTWARE',
      category: 'Măsurare digitală',
      description: 'Manual software Fabricator fabrică — proiecte, desen, potrivire și integrare Proliner',
      chapters: FACTORY_FABRICATOR_CHAPTERS,
      safetyWarning: FACTORY_FABRICATOR_SAFETY_WARNING,
      manualPdfUrl: FACTORY_FABRICATOR_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nConsultați ghidul Proliner pentru întreținerea hardware.',
        ['Verificare echipament înainte de măsurare'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–12 pentru instalare, bibliotecă, desen și integrare Proliner.',
        [],
        [{ type: 'pdf', label: 'Fabricator fabrică — Manual software (PDF)', url: FACTORY_FABRICATOR_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Export proiecte .prlp către Proliner\n- Import măsurători în Fabricator fabrică\n- Layout tăiere și cotație',
        [],
      ),
    },
    {
      id: 'eq-proliner-4x',
      name: 'PROLINER 4.X MANUAL DE UTILIZARE',
      category: 'Măsurare digitală',
      description: 'Manual software Proliner 4.X — Factory Fabricator, desen, potrivire și integrare teren',
      chapters: PROLINER_4X_CHAPTERS,
      safetyWarning: PROLINER_4X_SAFETY_WARNING,
      manualPdfUrl: PROLINER_4X_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nConsultați ghidul de pornire rapidă Proliner pentru întreținerea hardware.',
        ['Curățare cablu cu cârpă fără praf', 'Verificare stilou și cablu înainte de măsurare'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–12 pentru instalare, bibliotecă, desen și integrare Proliner.',
        [],
        [{ type: 'pdf', label: 'PROLINER 4.X Manual de utilizare (PDF)', url: PROLINER_4X_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Export proiecte .prlp către Proliner\n- Import măsurători în Factory Fabricator\n- Editare CAD și layout tăiere',
        [],
      ),
    },
    {
      id: 'eq-prodim-ct',
      name: 'Manual Prodim CT 3.2 & 3.3',
      category: 'Măsurare digitală',
      description: 'Manual software Prodim CT — parametri, măsurare, editare și modul CT',
      chapters: PRODIM_CT_CHAPTERS,
      safetyWarning: PRODIM_CT_SAFETY_WARNING,
      manualPdfUrl: PRODIM_CT_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nConsultați manualul Proliner pentru întreținerea hardware (cablu, stilou).',
        ['Curățare cablu cu cârpă fără praf', 'Depozitare corectă după utilizare'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–11 pentru parametri, măsurare, editare și modul CT.',
        [],
        [{ type: 'pdf', label: 'Manual Prodim CT 3.2 & 3.3 (PDF)', url: PRODIM_CT_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Modul CT: profile, materiale și export schiță\n- Raport PDF cu informații proiect\n- Import decupaje în fluxul artGRANIT',
        [],
      ),
    },
    {
      id: 'eq-prodim-stairs',
      name: 'SCĂRI PRODIM',
      category: 'Măsurare digitală',
      description: 'Manual Prodim Stairs — protocol măsurare scări, verificare și raport',
      chapters: PRODIM_STAIRS_CHAPTERS,
      safetyWarning: PRODIM_STAIRS_SAFETY_WARNING,
      manualPdfUrl: PRODIM_STAIRS_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nConsultați ghidul Proliner pentru întreținerea hardware înainte de măsurarea scărilor.',
        ['Verificare stilou și cablu', 'Poziționare stabilă pe treptă'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–6 pentru protocolul complet de măsurare a scărilor.',
        [],
        [{ type: 'pdf', label: 'SCĂRI PRODIM — Manual (PDF)', url: PRODIM_STAIRS_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Verificare model 3D după măsurare\n- Export raport pentru producție\n- Integrare în fluxul artGRANIT',
        [],
      ),
    },
    {
      id: 'eq-proliner-stairs-app',
      name: 'APLICAȚIE PROLINER SCĂRI',
      category: 'Măsurare digitală',
      description: 'Manual aplicație Proliner Stairs — măsurare ghidată, model și verificare scări',
      chapters: PROLINER_STAIRS_APP_CHAPTERS,
      safetyWarning: PROLINER_STAIRS_APP_SAFETY_WARNING,
      manualPdfUrl: PROLINER_STAIRS_APP_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nConsultați ghidul Proliner pentru întreținerea hardware înainte de măsurarea scărilor.',
        ['Verificare stilou și cablu', 'Poziționare stabilă pe teren'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–6 pentru setări, măsurare ghidată și verificare model.',
        [],
        [{ type: 'pdf', label: 'APLICAȚIE PROLINER SCĂRI — Manual (PDF)', url: PROLINER_STAIRS_APP_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Model interactiv scări la fața locului\n- Verificare potrivire trepte și contratrepte\n- Raport și export pentru producție',
        [],
      ),
    },
    {
      id: 'eq-proliner-remote',
      name: 'PROLINER TELECOMANDĂ',
      category: 'Măsurare digitală',
      description: 'Manual telecomandă Proliner și aplicație Android Remote Control',
      chapters: PROLINER_REMOTE_CHAPTERS,
      safetyWarning: PROLINER_REMOTE_SAFETY_WARNING,
      manualPdfUrl: PROLINER_REMOTE_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nPăstrați telecomanda curată și verificați bateriile înainte de utilizare.',
        ['Ștergeți suprafața cu lavetă uscată', 'Verificați nivelul bateriei'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–4 pentru utilizarea telecomenzii și a aplicației Android.',
        [],
        [{ type: 'pdf', label: 'PROLINER TELECOMANDĂ — Manual (PDF)', url: PROLINER_REMOTE_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Control de la distanță în timpul măsurătorilor pe teren\n- Utilizați aplicația Android la interferență semnal',
        [],
      ),
    },
    {
      id: 'eq-proliner-new-remote',
      name: 'CT 3.1 TELECOMANDĂ NOUĂ',
      category: 'Măsurare digitală',
      description: 'Manual programare telecomandă nouă — Proliners 7, 8 & 10',
      chapters: PROLINER_NEW_REMOTE_CHAPTERS,
      safetyWarning: PROLINER_NEW_REMOTE_SAFETY_WARNING,
      manualPdfUrl: PROLINER_NEW_REMOTE_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nPăstrați telecomanda curată și verificați bateriile înainte de programare.',
        ['Ștergeți suprafața cu lavetă uscată', 'Verificați nivelul bateriei'],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–3 pentru verificare și programare telecomandă din meniul Diagnosticare.',
        [],
        [{ type: 'pdf', label: 'CT 3.1 TELECOMANDĂ NOUĂ — Manual (PDF)', url: PROLINER_NEW_REMOTE_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Control de la distanță pe Proliners 7, 8 & 10\n- Reprogramare telecomandă oricând din fila Telecomandă',
        [],
      ),
    },
    {
      id: 'eq-bosch-gll-3-80',
      name: 'BOSCH GLL 3-80',
      category: 'Nivelare',
      description: 'Nivelă laser cu linii 3×360° — 30 m, autonivelare, valiză profesională',
      chapters: BOSCH_GLL_380_CHAPTERS,
      safetyWarning: BOSCH_GLL_380_SAFETY_WARNING,
      manualPdfUrl: BOSCH_GLL_380_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nOpriți aparatul înainte de curățare. Nu folosiți solvenți pe lentilele laser.',
        [
          'Ștergeți carcasa cu lavetă ușor umedă',
          'Curățați lentilele cu material moale, fără presiune',
          'Verificați filetul stativ și starea bateriilor',
          'Activați blocarea pendulului la transport',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–7 pentru pornire, trasare nivel și verificare precizie.',
        [],
        [{ type: 'pdf', label: 'BOSCH GLL 3-80 — Manual (PDF)', url: BOSCH_GLL_380_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Raportați cota de nivel în planul de secțiune\n- Notați punctele de referință în legendă\n- Arhivați fotografia setup-ului pe teren',
        [],
      ),
    },
    {
      id: 'eq-bosch-glm-40',
      name: 'BOSCH GLM 40',
      category: 'Distanță',
      description: 'Telemetru laser 40 m — distanță, suprafață, volum, Pythagora',
      chapters: BOSCH_GLM_40_CHAPTERS,
      safetyWarning: BOSCH_GLM_40_SAFETY_WARNING,
      manualPdfUrl: BOSCH_GLM_40_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nNu folosiți solvenți. Protejați lentila de recepție ca pe o lentilă foto.',
        [
          'Ștergeți carcasa cu lavetă ușor umedă',
          'Curățați lentila laser cu material moale',
          'Depozitați în geantă după utilizare',
          'Verificați precizia după șoc sau cădere',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–7 pentru măsurare distanță, suprafață, volum și memorie.',
        [],
        [{ type: 'pdf', label: 'BOSCH GLM 40 — Manual (PDF)', url: BOSCH_GLM_40_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Transcrieți dimensiunile validate în schița CAD\n- Marcați punctele de referință folosite la măsurare\n- Documentați abaterile față de planul arhitectural',
        [],
      ),
    },
    {
      id: 'eq-bosch-tape-5m',
      name: 'BOSCH Ruletă 5 m',
      category: 'Măsurare liniară',
      description: 'Ruletă metrică 5 m — cârlig magnetic, Flexi Stop, clasă precizie II',
      chapters: BOSCH_TAPE_5M_CHAPTERS,
      safetyWarning: BOSCH_TAPE_5M_SAFETY_WARNING,
      manualPdfUrl: BOSCH_TAPE_5M_MANUAL_URL,
      curatare: section(
        '## Protocol curățare\n\nNu folosiți solvenți pe banda gradată. Retrageți banda complet după utilizare.',
        [
          'Ștergeți praful de pe bandă cu lavetă uscată',
          'Verificați că banda este uscată înainte de retragere',
          'Retrageți banda complet în carcasă',
          'Depozitați în cutie, ferit de cădere',
        ],
      ),
      utilizare: section(
        '## Mod de lucru\n\nParcurgeți capitolele 2–7 pentru măsurare liniară, cârlig magnetic și verificare precizie.',
        [],
        [{ type: 'pdf', label: 'BOSCH Ruletă 5 m — Declarație UE (PDF)', url: BOSCH_TAPE_5M_MANUAL_URL }],
      ),
      cad: section(
        '## Integrare CAD\n\n- Transcrieți dimensiunile validate în schița CAD\n- Notați dacă măsurarea a fost interior sau exterior\n- Verificați diagonalele înainte de tăiere',
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
