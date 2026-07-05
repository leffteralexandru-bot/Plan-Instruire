/** Tipuri de măsurare — Ghid Operațional artGRANIT (7 categorii) */
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
  /** Echipament tehnic — bifabil de inginer */
  equipment: string[];
  /** Pași numerotați la măsurare */
  steps: string[];
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

export const DEFAULT_OPERATIONAL_GUIDE: OperationalGuideTask[] = [
  {
    id: 'blat',
    label: 'Blat',
    categorySubtitle: 'Blat / șorț',
    introText:
      'Verificați condițiile de mai jos înainte de deplasare. Checklist destinat planificării măsurătorilor Art Granit.',
    preMeasurementConditions: [
      COMMON_DECISION,
      'Mobila montată complet, fixată și reglată pe orizontal.',
      'Dacă există mașină de spălat vase, este recomandat să fie montată.',
      'Prezența accesoriilor: baterie, chiuvetă, aragaz, dozator, filtru, buton mărunțitor etc.',
      COMMON_ACCESS,
    ],
    equipment: [],
    steps: [],
  },
  {
    id: 'placare',
    label: 'Placare',
    categorySubtitle: 'Placare perete',
    introText: 'Checklist condiții înainte de măsurarea placării pe perete.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Pereții pregătiți pentru placare (se interzice placare pe bază de gips).',
      'Montate toate prizele și conexiunile (apă, canalizare).',
      'Suportul TV montat în perete.',
      'Prezența grilei de ventilare.',
    ],
    equipment: [],
    steps: [],
  },
  {
    id: 'scara',
    label: 'Scară',
    categorySubtitle: 'Scări interior',
    introText: 'Checklist condiții înainte de măsurarea scărilor interioare.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Fără lucrări cu praf în imediata apropiere a obiectului măsurat.',
      'Dacă scările sunt cu LED — profilul pentru LED montat.',
      'Pe suprafața scărilor să nu fie montată schelă.',
      'Tipul treptelor stabilit (ex. secțiune).',
    ],
    equipment: [],
    steps: [],
  },
  {
    id: 'semineu',
    label: 'Șemineu',
    categorySubtitle: 'Placare cămin',
    introText: 'Checklist condiții înainte de măsurarea placării căminului.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Căminul construit.',
      'Termoizolarea executată.',
      'Grila de ventilare prezentă.',
      'Schiță conceptuală / proiectul căminului disponibil.',
    ],
    equipment: [],
    steps: [],
  },
  {
    id: 'glaf',
    label: 'Glaf',
    categorySubtitle: 'Pervazuri interior / exterior',
    introText: 'Checklist condiții înainte de măsurarea pervazurilor.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Schele pentru pervazuri la înălțime (dacă e cazul).',
      'Baza pregătită ~30 mm sub toc fereastră.',
      'Strat final de tencuială sau termoizolare executat.',
      'La exterior: elemente decorative sub-pervaz și/sau împrejurul acestuia.',
    ],
    equipment: [],
    steps: [],
  },
  {
    id: 'scara_exterior',
    label: 'Scări ext.',
    categorySubtitle: 'Scări exterioare',
    introText: 'Checklist condiții înainte de măsurarea scărilor exterioare.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Schele prezente pentru măsurători la înălțime (dacă e cazul).',
      'Placare existentă demontată până la măsurare, pentru studierea bazei.',
      'La ploaie sau ninsoare — măsurarea se reprogramează.',
    ],
    equipment: [],
    steps: [],
  },
  {
    id: 'placare_exterior',
    label: 'Placări ext.',
    categorySubtitle: 'Placări exterioare / parapet (atic)',
    introText: 'Checklist condiții înainte de măsurarea placărilor exterioare.',
    preMeasurementConditions: [
      COMMON_DECISION,
      COMMON_ACCESS,
      'Schele prezente pentru măsurători la înălțime (dacă e cazul).',
      'La ploaie sau ninsoare — măsurarea se reprogramează.',
      'Placare existentă demontată până la măsurare, pentru studierea bazei.',
      'Aceste lucrări necesită prindere mecanică.',
    ],
    equipment: [],
    steps: [],
  },
];

export const OPERATIONAL_GUIDE_TASK_COUNT = OPERATIONAL_GUIDE_TASK_ORDER.length;

export function isOperationalGuideTaskId(value: string): value is OperationalGuideTaskId {
  return (OPERATIONAL_GUIDE_TASK_ORDER as string[]).includes(value);
}
