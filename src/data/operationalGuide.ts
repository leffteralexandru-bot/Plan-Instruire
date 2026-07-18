/** Tipuri de măsurare — Ghid Operațional artGRANIT (7 categorii) */
import { PROLINER_LOCAL_VIDEOS } from '@/data/prolinerVideos';

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
  /** Explicații generale — completat de HR */
  introText?: string;
  /** Condiții de îndeplinit ÎNAINTE de măsurare (checklist client/șantier) — editabil HR */
  preMeasurementConditions: string[];
  /** Condiții de îndeplinit ÎNAINTE de proiectare — editabil HR */
  preDesignConditions: string[];
  /** Echipament tehnic — listă oficială artGRANIT */
  equipment: string[];
  /** Pași numerotați la măsurare (Ghid măsurător) */
  steps: string[];
  /** Pași numerotați la proiectare (Ghid Proiectare) — conținut separat */
  designSteps: string[];
  /** PDF checklist oficial (o pagină per categorie) — extras din documentul HR */
  checklistPdfUrl?: string;
  checklistPdfFileName?: string;
  /** Imagine pagină checklist pentru vizualizare în app */
  checklistPageImageUrl?: string;
  /** PDF / PNG — Echipament necesar (Pregătire teren) */
  equipmentPdfUrl?: string;
  equipmentPdfFileName?: string;
  equipmentPageImageUrl?: string;
  /** PDF / PNG — Pași de măsurare (Pe teren) */
  stepsPdfUrl?: string;
  stepsPdfFileName?: string;
  stepsPageImageUrl?: string;
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

const COMMON_DECISION = 'Prezența obligatorie a persoanei cu putere de decizie.';
const COMMON_ACCESS =
  'Acces pentru măsurare — fără obstacole care restricționează accesul inginerului spre obiectul de măsurat.';

/** Condiții înainte de proiectare — Blat (Ghid Proiectare). */
const PRE_DESIGN_BLAT = [
  'Conturul Proliner coincide cu schița și cotele de pe ruletă.',
  'Fișe tehnice pentru accesoriile clientului montate pe blat.',
  'Respectați cartea tehnică a materialului (Repository tehnic).',
];

/** Echipament standard — aceeași listă și ordine pentru toate tipurile de măsurare. */
const EQUIPMENT_BASE = [
  'ANEXA Nr. 1',
  'Ochelari de înregistrare video',
  'Carnet măsurători + creion',
  'Aparatul de măsurat Proliner',
  'Nivelă laser Bosch GLL 3-80',
  'Ruletă Bosch 5 m',
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

const FIELD_DOCS = (slug: string) => ({
  equipmentPdfUrl: EQUIPMENT_PDF_URL,
  equipmentPdfFileName: EQUIPMENT_PDF_NAME,
  equipmentPageImageUrl: EQUIPMENT_PAGE,
  stepsPdfUrl: STEPS_PDF(slug),
  stepsPdfFileName: STEPS_PDF_NAME(slug),
  stepsPageImageUrl: STEPS_PAGE(slug),
});

/**
 * Ordine pe teren (confirmată de artGRANIT) — text adaptat pe tip:
 * 1 ANEXA → 2 carnet → 3 nivelă → 4 ochelari+Proliner → 5 ruletă → 6 carnet final → 7 Bitrix + salvare Proliner.
 */

export const DEFAULT_OPERATIONAL_GUIDE: OperationalGuideTask[] = [
  {
    id: 'blat',
    label: 'Blat',
    categorySubtitle: 'Blat / șorț',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Blat.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Blat.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('blat'),
    ...FIELD_DOCS('blat'),
    videoUrl: PROLINER_LOCAL_VIDEOS[14],
    videoTitle: 'Demonstrație măsurare blat — Proliner (măsurare în 5 pași)',
    preMeasurementConditions: [
      COMMON_DECISION,
      'Mobila montată complet, fixată și reglată pe orizontal.',
      'Dacă există mașină de spălat vase, este recomandat să fie montată.',
      'Prezența accesoriilor: baterie, chiuvetă, aragaz, dozator, filtru, buton mărunțitor etc.',
      COMMON_ACCESS,
    ],
    preDesignConditions: [...PRE_DESIGN_BLAT],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru blat / șorț), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare blat / șorț, observații din discuția cu managerul).',
      'Verificați cu nivela laser Bosch GLL 3-80 nivelul / orizontalitatea mobilierului (dulapuri, blat).',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul blatului, suportul dulapurilor, șorțul și decupajele (chiuvetă, aragaz, baterie).',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lungimi, adâncimi, decupaje chiuvetă / aragaz / baterie).',
      'Completați pe carnet notele finale pentru blat (grosime, finisaj, abateri, observații teren).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de blat în Proliner.',
    ],
  },
  {
    id: 'placare',
    label: 'Placare',
    categorySubtitle: 'Placare perete',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Placare.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Placare.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('placare'),
    ...FIELD_DOCS('placare'),
    introText: 'Checklist condiții înainte de măsurarea placării pe perete.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Pereții pregătiți pentru placare (se interzice placare pe bază de gips).',
      'Montate toate prizele și conexiunile (apă, canalizare).',
      'Suportul TV montat în perete.',
      'Prezența grilei de ventilare.',
    ],
    preDesignConditions: [],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru placare perete), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare placare perete, observații din discuția cu managerul).',
      'Verificați cu nivela laser Bosch GLL 3-80 verticalitatea și planeitatea peretelui / mobilierului adiacent.',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul zonei de placare și golurile (prize, ventilare, suport TV).',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (înălțimi, lățimi, poziții prize / ventilare / suport TV).',
      'Completați pe carnet notele finale pentru placare (grosime, finisaj, abateri planeitate, observații teren).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de placare în Proliner.',
    ],
  },
  {
    id: 'scara',
    label: 'Scară',
    categorySubtitle: 'Scări interior',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Scara.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Scara.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('scara'),
    ...FIELD_DOCS('scara'),
    introText: 'Checklist condiții înainte de măsurarea scărilor interioare.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Fără lucrări cu praf în imediata apropiere a obiectului măsurat.',
      'Dacă scările sunt cu LED — profilul pentru LED montat.',
      'Pe suprafața scărilor să nu fie montată schelă.',
      'Tipul treptelor stabilit (ex. secțiune).',
    ],
    preDesignConditions: [],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru scară interior), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare scară interior, tip trepte, observații din discuția cu managerul).',
      'Verificați cu nivela laser Bosch GLL 3-80 referințele pe trepte / perete (nivel și aliniere).',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner (Stairs) treptele, contratrepele și profilul scării.',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lățime treaptă, înălțime contratreaptă, lungime rampă).',
      'Completați pe carnet notele finale pentru scară (grosime, finisaj, tip trepte / LED, abateri, observații teren).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de scară în Proliner.',
    ],
  },
  {
    id: 'semineu',
    label: 'Șemineu',
    categorySubtitle: 'Placare cămin',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Semineu.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Semineu.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('semineu'),
    ...FIELD_DOCS('semineu'),
    introText: 'Checklist condiții înainte de măsurarea placării căminului.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Căminul construit.',
      'Termoizolarea executată.',
      'Grila de ventilare prezentă.',
      'Schiță conceptuală / proiectul căminului disponibil.',
    ],
    preDesignConditions: [],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru placare șemineu / cămin), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare șemineu, observații din discuția cu managerul și din proiectul căminului).',
      'Verificați cu nivela laser Bosch GLL 3-80 verticalitatea portalului / elementelor de mobilier adiacente.',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul de placare și deschiderile (focar, grilă, nișe).',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lățimi portal, deschidere focar, poziție grilă / nișe).',
      'Completați pe carnet notele finale pentru șemineu (grosime, finisaj, abateri, observații teren).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de șemineu în Proliner.',
    ],
  },
  {
    id: 'glaf',
    label: 'Glaf',
    categorySubtitle: 'Pervazuri interior / exterior',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Glaf.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Glaf.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('glaf'),
    ...FIELD_DOCS('glaf'),
    introText: 'Checklist condiții înainte de măsurarea pervazurilor.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Schele pentru pervazuri la înălțime (dacă e cazul).',
      'Baza pregătită ~30 mm sub toc fereastră.',
      'Strat final de tencuială sau termoizolare executat.',
      'La exterior: elemente decorative sub-pervaz și/sau împrejurul acestuia.',
    ],
    preDesignConditions: [],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru glaf / pervaz), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare glaf interior / exterior, observații din discuția cu managerul).',
      'Verificați cu nivela laser Bosch GLL 3-80 planeitatea bazei pervazului / nivelului față de toc.',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner lungimea, adâncimea și unghiurile fiecărui glaf.',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lungime, adâncime, ieșire față de toc) pe fiecare glaf.',
      'Completați pe carnet notele finale pentru glaf (grosime, finisaj, abateri, observații teren — interior / exterior).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de glaf în Proliner.',
    ],
  },
  {
    id: 'scara_exterior',
    label: 'Scări ext.',
    categorySubtitle: 'Scări exterioare',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Scari-exterioare.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Scari-exterioare.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('scara-exterior'),
    ...FIELD_DOCS('scara-exterior'),
    introText: 'Checklist condiții înainte de măsurarea scărilor exterioare.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Schele prezente pentru măsurători la înălțime (dacă e cazul).',
      'Placare existentă demontată până la măsurare, pentru studierea bazei.',
      'La ploaie sau ninsoare — măsurarea se reprogramează.',
    ],
    preDesignConditions: [],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru scări exterioare), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare scări exterioare, observații din discuția cu managerul).',
      'Verificați cu nivela laser Bosch GLL 3-80 nivelul / alinierea treptelor exterioare și a bazei.',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner (Stairs) profilul treptelor exterioare.',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lățime treaptă, înălțime, adâncime, aliniere bază).',
      'Completați pe carnet notele finale pentru scări exterioare (grosime, finisaj, stare bază, abateri, observații teren / vreme).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de scări exterioare în Proliner.',
    ],
  },
  {
    id: 'placare_exterior',
    label: 'Placări ext.',
    categorySubtitle: 'Placări exterioare / parapet (atic)',
    checklistPdfUrl: `${CHECKLIST_BASE}/Checklist-masuratori-Placari-exterioare.pdf`,
    checklistPdfFileName: 'Checklist-masuratori-Placari-exterioare.pdf',
    checklistPageImageUrl: CHECKLIST_PAGE('placare-exterior'),
    ...FIELD_DOCS('placare-exterior'),
    introText: 'Checklist condiții înainte de măsurarea placărilor exterioare.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Schele prezente pentru măsurători la înălțime (dacă e cazul).',
      'La ploaie sau ninsoare — măsurarea se reprogramează.',
      'Placare existentă demontată până la măsurare, pentru studierea bazei.',
      'Aceste lucrări necesită prindere mecanică.',
    ],
    preDesignConditions: [],
    equipment: [...EQUIPMENT_BASE],
    designSteps: [],
    steps: [
      'Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru placări exterioare / parapet), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.',
      'Notați pe carnet datele esențiale (client, măsurare placare exterioară / parapet, observații din discuția cu managerul).',
      'Verificați cu nivela laser Bosch GLL 3-80 verticalitatea fațadei / parapetului și nivelul bazei.',
      'Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul de placare și cotele pentru prindere mecanică.',
      'Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (înălțimi, lățimi, cote prindere mecanică).',
      'Completați pe carnet notele finale pentru placare exterioară (grosime, finisaj, prindere mecanică, stare bază, abateri, observații teren / vreme).',
      'Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de placare exterioară în Proliner.',
    ],
  },
];

export const OPERATIONAL_GUIDE_TASK_COUNT = OPERATIONAL_GUIDE_TASK_ORDER.length;

export function isOperationalGuideTaskId(value: string): value is OperationalGuideTaskId {
  return (OPERATIONAL_GUIDE_TASK_ORDER as string[]).includes(value);
}
