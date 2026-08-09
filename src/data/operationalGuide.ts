/** Tipuri de măsurare — Ghid Operațional artGRANIT (7 categorii) */
import { PROLINER_LOCAL_VIDEOS } from '@/data/prolinerVideos';
import { MEASURER_TYPE_CONTENT } from '@/data/operationalGuideMeasurerContent';

export type OperationalGuideTaskId =
  | 'blat'
  | 'placare'
  | 'scara'
  | 'semineu'
  | 'glaf'
  | 'scara_exterior'
  | 'placare_exterior';

export interface OperationalGuideTask {
  id: OperationalGuideTaskId;
  /** Denumire scurtă (meniu) */
  label: string;
  /** Subtitlu categorie (din checklist oficial) */
  categorySubtitle?: string;
  /** URL video: YouTube, fișier .mp4/.webm sau pagină HTML */
  videoUrl?: string;
  videoTitle?: string;
  /** Explicații generale pe tip — din ghidul teren */
  introText?: string;
  /** A — condiții ÎNAINTE de măsurare (checklist client/șantier) */
  preMeasurementConditions: string[];
  /** Condiții ÎNAINTE de proiectare (Ghid Proiectare — separat) */
  preDesignConditions: string[];
  /** B — obligații măsurător pe loc (întrebări + verificări) */
  fieldObligations: string[];
  /** D — reguli pe teren specifice tipului */
  typeFieldRules: string[];
  /** Echipament tehnic — listă comună */
  equipment: string[];
  /** Documente Full Kit înainte de drum (Bitrix + organizare) */
  kitDocuments: string[];
  /** E — pași numerotați la măsurare */
  steps: string[];
  /** F — checklist final înainte de plecare */
  finalChecklist: string[];
  /** Pași numerotați la proiectare (Ghid Proiectare) — conținut separat */
  designSteps: string[];
  /** PDF checklist oficial (o pagină per categorie) */
  checklistPdfUrl?: string;
  checklistPdfFileName?: string;
  checklistPageImageUrl?: string;
  /** PDF / PNG — Echipament necesar (Pregătire teren) */
  equipmentPdfUrl?: string;
  equipmentPdfFileName?: string;
  equipmentPageImageUrl?: string;
  /** PDF / PNG — Pași de măsurare (Pe teren) */
  stepsPdfUrl?: string;
  stepsPdfFileName?: string;
  stepsPageImageUrl?: string;
  /** PDF ghid teren complet (toate tipurile) */
  fieldGuidePdfUrl?: string;
  fieldGuidePdfFileName?: string;
  updatedAt?: string;
  updatedByName?: string;
}

export const OPERATIONAL_GUIDE_TASK_ORDER: OperationalGuideTaskId[] = [
  'blat',
  'placare',
  'scara',
  'semineu',
  'glaf',
  'scara_exterior',
  'placare_exterior',
];

export const OPERATIONAL_GUIDE_LABELS: Record<OperationalGuideTaskId, string> = {
  blat: 'Blat',
  placare: 'Placare',
  scara: 'Scară',
  semineu: 'Șemineu',
  glaf: 'Glaf',
  scara_exterior: 'Scări ext.',
  placare_exterior: 'Placări ext.',
};

/** C — reguli pe teren comune (toate tipurile) */
export const COMMON_FIELD_RULES: string[] = [
  'Fiecare cotă se notează în clipa măsurării, pe loc — nu se lasă nimic pe memorie și nu se completează ulterior din cap.',
  'La cotele critice se citesc valorile cu voce tare, ca să se evite transpozițiile (exemplu: 1180 scris greșit ca 1810).',
  'Unghiurile se măsoară întotdeauna — nu se presupune că sunt 90°. Dacă sunt mai mult de 2 îmbinări, se face șablon.',
  'Detaliile se finalizează cu clientul pe loc și se semnează pe schiță / Anexa 1 înainte de a pleca de pe șantier.',
  'FAȚA VĂZUTĂ și orientarea pieselor se marchează pe schiță și se confirmă cu fotografie, ca să nu se monteze invers.',
  'Dacă condițiile de pe teren sunt improprii pentru o măsurare corectă, se anunță managerul: fie se reprogramează, fie se asigură condițiile înainte de continuare.',
];

/** Regula de bază din ghidul teren */
export const FIELD_GUIDE_BASE_RULE =
  'Chiar dacă arată montat vizual — TU întrebi și verifici fizic.';

/** PDF ghid teren — fișier general (toate tipurile); pe site capitolele rămân pe tip. */
export const FIELD_GUIDE_PDF_URL =
  '/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf';
export const FIELD_GUIDE_PDF_NAME = 'Ghid-teren-masurare.pdf';

function fieldGuidePdfForTask(_taskId: OperationalGuideTaskId): {
  fieldGuidePdfUrl: string;
  fieldGuidePdfFileName: string;
} {
  return {
    fieldGuidePdfUrl: FIELD_GUIDE_PDF_URL,
    fieldGuidePdfFileName: FIELD_GUIDE_PDF_NAME,
  };
}

/** Condiții înainte de proiectare — Blat (Ghid Proiectare — se va completa separat). */
const PRE_DESIGN_BLAT = [
  'Conturul Proliner coincide cu schița și cotele de pe ruletă.',
  'Fișe tehnice pentru accesoriile clientului montate pe blat.',
  'Respectați cartea tehnică a materialului (Repository tehnic).',
];

/** Echipament standard — aceeași listă pentru toate tipurile. Fără trusă completă, nu pleacă spre măsurare. */
const EQUIPMENT_BASE = [
  'ANEXA Nr. 1 (șablon) + fișe tehnice',
  'Carnet măsurători + creion',
  'Aparatul de măsurat Proliner',
  'Nivelă laser Bosch GLL 3-80',
  'Ruletă Bosch 5 m',
  'Ochelari de înregistrare video',
];

/**
 * Full Kit documente — înainte de drum.
 * ATENȚIE: exemplele din ghid sunt șabloane; documentele REALE se descarcă din Bitrix.
 */
export const FULL_KIT_DOCUMENTS: string[] = [
  'Programare confirmată (dată, oră, adresă, acces) — verifici în planificare / calendar (nu e fișier Bitrix).',
  'Checklist condiții client — semnat pe tip produs → fișierul REAL din Bitrix (nu exemplul din ghid).',
  'Anexa 1 — citită înainte de drum (muchie, finisaj, decupaje, accesorii) → din Bitrix, atașată la proiectul tău.',
  'Canting + fișe tehnice accesorii — din task / Bitrix.',
  'Comandă de material / fișa comenzii (CTG) — material, muchie, decupări, sens vene → din Bitrix.',
  'Fișa tehnică a materialului — Documentație tehnică în app (după tipul de pe comandă).',
  'Regulă Full Kit: COMPLET sau INCOMPLET — nu există „aproape gata”. Fără documentele Bitrix (punctele 2–5) + echipament, nu pleacă spre măsurare.',
];

const CHECKLIST_BASE = '/docs/operational-guide/checklists';
const CHECKLIST_PAGE = (slug: string) => `/docs/operational-guide/checklists/pages/${slug}.png`;
const EQUIPMENT_PDF_URL = '/docs/operational-guide/equipment/Echipament-necesar.pdf';
const EQUIPMENT_PDF_NAME = 'Echipament-necesar.pdf';
const EQUIPMENT_PAGE = '/docs/operational-guide/equipment/pages/echipament.png';
const STEPS_BASE = '/docs/operational-guide/steps';
const STEPS_PDF = (slug: string) => `${STEPS_BASE}/Pasi-masurare-${slug}.pdf`;
const STEPS_PDF_NAME = (slug: string) => `Pasi-masurare-${slug}.pdf`;
const STEPS_PAGE = (slug: string) => `${STEPS_BASE}/pages/${slug}.png`;

const FIELD_DOCS = (slug: string, taskId: OperationalGuideTaskId) => ({
  equipmentPdfUrl: EQUIPMENT_PDF_URL,
  equipmentPdfFileName: EQUIPMENT_PDF_NAME,
  equipmentPageImageUrl: EQUIPMENT_PAGE,
  stepsPdfUrl: STEPS_PDF(slug),
  stepsPdfFileName: STEPS_PDF_NAME(slug),
  stepsPageImageUrl: STEPS_PAGE(slug),
  ...fieldGuidePdfForTask(taskId),
});

const META: Record<
  OperationalGuideTaskId,
  {
    label: string;
    categorySubtitle: string;
    checklistSlug: string;
    checklistFile: string;
    pageSlug: string;
    stepsSlug: string;
    videoUrl?: string;
    videoTitle?: string;
    preDesignConditions: string[];
  }
> = {
  blat: {
    label: 'Blat',
    categorySubtitle: 'Blat (șorțul = Placare)',
    checklistSlug: 'Checklist-masuratori-Blat',
    checklistFile: 'Checklist_Client_ArtGranit-Blat.pdf',
    pageSlug: 'blat',
    stepsSlug: 'blat',
    videoUrl: PROLINER_LOCAL_VIDEOS[14],
    videoTitle: 'Demonstrație măsurare blat — Proliner (măsurare în 5 pași)',
    preDesignConditions: [...PRE_DESIGN_BLAT],
  },
  placare: {
    label: 'Placare',
    categorySubtitle: 'Placare perete / șorț',
    checklistSlug: 'Checklist-masuratori-Placare',
    checklistFile: 'Checklist_Client_ArtGranit-Placare.pdf',
    pageSlug: 'placare',
    stepsSlug: 'placare',
    preDesignConditions: [],
  },
  scara: {
    label: 'Scară',
    categorySubtitle: 'Scări interior',
    checklistSlug: 'Checklist-masuratori-Scara',
    checklistFile: 'Checklist_Client_ArtGranit-Scara.pdf',
    pageSlug: 'scara',
    stepsSlug: 'scara',
    preDesignConditions: [],
  },
  semineu: {
    label: 'Șemineu',
    categorySubtitle: 'Placare cămin',
    checklistSlug: 'Checklist-masuratori-Semineu',
    checklistFile: 'Checklist_Client_ArtGranit-Semineu.pdf',
    pageSlug: 'semineu',
    stepsSlug: 'semineu',
    preDesignConditions: [],
  },
  glaf: {
    label: 'Glaf',
    categorySubtitle: 'Pervazuri interior / exterior',
    checklistSlug: 'Checklist-masuratori-Glaf',
    checklistFile: 'Checklist_Client_ArtGranit-Glaf.pdf',
    pageSlug: 'glaf',
    stepsSlug: 'glaf',
    preDesignConditions: [],
  },
  scara_exterior: {
    label: 'Scări ext.',
    categorySubtitle: 'Scări exterioare',
    checklistSlug: 'Checklist-masuratori-Scari-exterioare',
    checklistFile: 'Checklist_Client_ArtGranit-Scari-exterioare.pdf',
    pageSlug: 'scara-exterior',
    stepsSlug: 'scara-exterior',
    preDesignConditions: [],
  },
  placare_exterior: {
    label: 'Placări ext.',
    categorySubtitle: 'Placări exterioare / parapet (atic)',
    checklistSlug: 'Checklist-masuratori-Placari-exterioare',
    checklistFile: 'Checklist_Client_ArtGranit-Placari-exterioare.pdf',
    pageSlug: 'placare-exterior',
    stepsSlug: 'placare-exterior',
    preDesignConditions: [],
  },
};

function buildTask(id: OperationalGuideTaskId): OperationalGuideTask {
  const meta = META[id];
  const content = MEASURER_TYPE_CONTENT[id];
  return {
    id,
    label: meta.label,
    categorySubtitle: meta.categorySubtitle,
    checklistPdfUrl: `${CHECKLIST_BASE}/${meta.checklistFile}`,
    checklistPdfFileName: meta.checklistFile,
    checklistPageImageUrl: CHECKLIST_PAGE(meta.pageSlug),
    ...FIELD_DOCS(meta.stepsSlug, id),
    videoUrl: meta.videoUrl,
    videoTitle: meta.videoTitle,
    introText: content.introText,
    preMeasurementConditions: [...content.preMeasurementConditions],
    preDesignConditions: [...meta.preDesignConditions],
    fieldObligations: [...content.fieldObligations],
    typeFieldRules: [...content.typeFieldRules],
    equipment: [...EQUIPMENT_BASE],
    kitDocuments: [...FULL_KIT_DOCUMENTS],
    steps: [...content.steps],
    finalChecklist: [...content.finalChecklist],
    designSteps: [],
  };
}

export const DEFAULT_OPERATIONAL_GUIDE: OperationalGuideTask[] =
  OPERATIONAL_GUIDE_TASK_ORDER.map(buildTask);

export const OPERATIONAL_GUIDE_TASK_COUNT = OPERATIONAL_GUIDE_TASK_ORDER.length;

export function isOperationalGuideTaskId(value: string): value is OperationalGuideTaskId {
  return (OPERATIONAL_GUIDE_TASK_ORDER as string[]).includes(value);
}
