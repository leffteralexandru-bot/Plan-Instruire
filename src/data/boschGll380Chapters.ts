import type {
  EquipmentChapter,
  EquipmentChapterBlock,
  EquipmentSafetyWarning,
} from '@/data/equipmentOperations';

const MANUAL_PDF = '/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/bosch-gll-3-80/pages/page-${String(n).padStart(2, '0')}.png`;
const VIDEO = (id: string) => `/docs/equipment/bosch-gll-3-80/videos/${id}.mp4`;

export const BOSCH_GLL_380_VIDEOS = {
  overview: VIDEO('qFUVfZ27hh0'),
  operation: VIDEO('7zhZHo0UIrg'),
  crossline: VIDEO('zlsrkgk8Rmw'),
} as const;

export const BOSCH_GLL_380_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță — Laser Clasa 2',
  content: `## Responsabilitate operator

Nivelă laser Bosch GLL 3-80 — **clasa laser 2**. Operatorul verifică zona de lucru înainte de pornire.

## Reguli critice

- **Nu priviți direct fasciculul laser** și nu îndreptați raza spre persoane sau animale.
- Utilizați ochelarii laser Bosch (accesoriu) — nu înlocuiesc ochelarii de soare.
- Blocați pendulul (transport lock) înainte de mutarea aparatului.
- Permiteți **numai personalului instruit** să opereze nivelaua pe șantier.`,
};

function blocksChapter(
  number: number,
  title: string,
  summary: string,
  blocks: EquipmentChapterBlock[],
  options?: { includePdf?: boolean; videoUrl?: string },
): EquipmentChapter {
  return {
    id: `bosch-gll-380-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    blocks,
    videoUrl: options?.videoUrl,
    images: [],
    pdfUrl: options?.includePdf ? MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'BOSCH-GLL-3-80-Manual-artGRANIT.pdf'
      : undefined,
  };
}

export const BOSCH_GLL_380_CHAPTERS: EquipmentChapter[] = [
  blocksChapter(1, 'Manual de instruire', 'Descărcare manual complet Bosch PDF — offline', [], {
    includePdf: true,
  }),
  blocksChapter(
    2,
    'Prezentare produs',
    'GLL 3-80 Professional — 3 linii 360°, rază 30 m, precizie ±0,2 mm/m',
    [
      {
        id: 'b2-intro',
        type: 'markdown',
        body: `## Bosch PRO GLL 3-80

Nivelă laser cu **3 linii la 360°** — nivelare orizontală și verticală simultană într-o singură încăpere.

**Cod produs:** 0.601.063.S00 | **Set livrare:** valiză, husă, 4× baterii AA, panou de vizare laser`,
      },
      {
        id: 'b2-specs',
        type: 'definitions',
        items: [
          { term: 'Domeniu de lucru', definition: '30 m (fără receptor) / 80 m cu receptor LR 6 sau LR 7' },
          { term: 'Precizie', definition: '± 0,2 mm/m (± 0,3 mm/m conform fișei Bosch)' },
          { term: 'Autonivelare', definition: '± 4° în 4 secunde' },
          { term: 'Protecție', definition: 'IP54 — praf și stropi de apă' },
          { term: 'Autonomie', definition: '4 h cu toate cele 3 linii active' },
          { term: 'Greutate', definition: '≈ 0,82 kg' },
        ],
      },
      {
        id: 'b2-video',
        type: 'figure',
        imageUrl: PAGE(13),
        alt: 'Prezentare Bosch GLL 3-80 Professional',
        caption: 'Vizibilitate la un nou nivel — 3 × 360°',
        videoUrl: BOSCH_GLL_380_VIDEOS.overview,
        videoLabel: 'Urmăriți videoclipul de prezentare',
      },
      {
        id: 'b2-apps',
        type: 'bullet-list',
        title: 'Aplicații recomandate',
        items: [
          'Suspendare tavane false',
          'Construire pardoseli și montaj plăci ceramice',
          'Montaj geamuri, rafturi și rigips',
          'Montaj conducte de scurgere',
        ],
      },
    ],
    { videoUrl: BOSCH_GLL_380_VIDEOS.overview },
  ),
  blocksChapter(3, 'Siguranță și componente', 'Identificare piese, avertismente laser și baterii', [
    {
      id: 'b3-warn',
      type: 'callout',
      variant: 'attention',
      title: 'ATENȚIE! Laser clasa 2',
      body: 'Nu priviți fasciculul laser. Aparatul este destinat determinării liniilor orizontale și verticale în interior și exterior.',
    },
    {
      id: 'b3-parts',
      type: 'figure',
      imageUrl: PAGE(14),
      alt: 'Componente Bosch GLL 3-80',
      caption: 'Identificare butoane, pendul, filet stativ 1/4" și 5/8"',
    },
    {
      id: 'b3-battery',
      type: 'steps',
      title: 'Montare baterii',
      items: [
        'Apăsați dispozitivul de blocare și deschideți compartimentul baterii.',
        'Introduceți **4 baterii AA alcaline** (incluse în set).',
        'Înlocuiți **toate** bateriile simultan, aceeași marcă.',
        'Închideți capacul până la fixare.',
      ],
    },
    {
      id: 'b3-tip',
      type: 'callout',
      variant: 'tip',
      body: 'Pentru transport sigur, activați **blocarea pendulului** — laserul nu se autonivelează când e blocat.',
    },
  ]),
  blocksChapter(
    4,
    'Pornire și autonivelare',
    'Comutator On/Off, moduri linii și montaj pe trepied',
    [
      {
        id: 'b4-steps',
        type: 'steps',
        title: 'Pornire',
        items: [
          'Montați pe trepied stabil (filet 1/4" sau 5/8") sau pe suprafață plană.',
          'Deblocați pendulul (transport lock OFF).',
          'Comutați butonul de pornire — aparatul se autonivelează în **< 4 sec**.',
          'Selectați liniile dorite (orizontală / verticală / ambele).',
          'Așteptați semnalul sonor de nivelare completă înainte de trasare.',
        ],
      },
      {
        id: 'b4-fig',
        type: 'figure',
        imageUrl: PAGE(15),
        alt: 'Operare și autonivelare GLL 3-80',
        caption: 'Indicatori LED și comutator mod linii',
        videoUrl: BOSCH_GLL_380_VIDEOS.operation,
        videoLabel: 'Demonstrație operare',
      },
      {
        id: 'b4-note',
        type: 'callout',
        variant: 'note',
        body: 'Dacă suprafața depășește ± 4°, aparatul semnalează — repoziționați pe suprafață mai plană sau folosiți modul manual (fără autonivelare).',
      },
    ],
    { videoUrl: BOSCH_GLL_380_VIDEOS.operation },
  ),
  blocksChapter(5, 'Utilizare pe șantier', 'Trasare nivel, verificare și lucru cu receptor', [
    {
      id: 'b5-work',
      type: 'markdown',
      body: `## Flux de lucru artGRANIT

1. Stabilizați trepiedul departe de vibrații și treceri.
2. Marcați referința pe mai multe puncte (colțuri, uși).
3. Verificați coincidența liniilor pe întreaga încăpere.
4. Documentați setup-ul cu fotografie pentru dosarul proiectului.`,
    },
    {
      id: 'b5-receiver',
      type: 'steps',
      title: 'Cu receptor LR 6 / LR 7 (opțional)',
      items: [
        'Activați modul receptor pe nivelă.',
        'Fixați receptorul pe riglă sau trepied la înălțimea dorită.',
        'Deplasați receptorul până la semnal (sunet + display).',
        'Raza extinsă: până la **80 m** (cu receptor).',
      ],
    },
    {
      id: 'b5-fig',
      type: 'figure',
      imageUrl: PAGE(17),
      alt: 'Verificare precizie și lucru cu receptor',
      caption: 'Control precizie orizontală și verticală',
      videoUrl: BOSCH_GLL_380_VIDEOS.crossline,
        videoLabel: 'Linii încrucișate 360°',
    },
  ]),
  blocksChapter(6, 'Verificare precizie', 'Control periodic înainte de măsurători critice', [
    {
      id: 'b6-intro',
      type: 'callout',
      variant: 'warning',
      body: 'Verificați precizia **înainte de fiecare proiect critic** — temperatura, șocuri sau transportul pot afecta calibrarea.',
    },
    {
      id: 'b6-h',
      type: 'steps',
      title: 'Verificare axă orizontală',
      items: [
        'Plasați aparatul la ≈ 2,5 m de un perete (punct A).',
        'Marcați linia laser pe perete.',
        'Rotiți aparatul 180° fără a schimba înălțimea (punct B).',
        'Diferența dintre marcaje trebuie să fie ≤ **3 mm** la 5 m.',
      ],
    },
    {
      id: 'b6-v',
      type: 'steps',
      title: 'Verificare linii verticale',
      items: [
        'Proiectați linia verticală pe un gol de ușă.',
        'Marcați sus și jos pe ambele fețe ale golului.',
        'Liniile trebuie să coincidă pe aceeași verticală.',
      ],
    },
    {
      id: 'b6-fig',
      type: 'figure',
      imageUrl: PAGE(18),
      alt: 'Procedură verificare precizie GLL 3-80',
      caption: 'Schema verificare din manualul Bosch',
    },
  ]),
  blocksChapter(7, 'Întreținere și depozitare', 'Curățare, baterii și transport în valiză', [
    {
      id: 'b7-clean',
      type: 'steps',
      title: 'Curățare',
      items: [
        'Opriți aparatul înainte de curățare.',
        'Ștergeți carcasa cu lavetă ușor umedă — **fără solvenți**.',
        'Curățați lentilele laser cu lavetă moale, fără presiune.',
        'Verificați starea filetului stativ și a clemei trepiedului.',
      ],
    },
    {
      id: 'b7-store',
      type: 'bullet-list',
      title: 'Depozitare',
      items: [
        'Activați blocarea pendulului pentru transport.',
        'Depozitați în valiza Bosch, la temperatură –20 … +70 °C.',
        'Scoateți bateriile la depozitare îndelungată.',
        'Calibrare la service Bosch la abateri repetate.',
      ],
    },
    {
      id: 'b7-fig',
      type: 'figure',
      imageUrl: PAGE(16),
      alt: 'Întreținere Bosch GLL 3-80',
      caption: 'Zone de curățare și compartiment baterii',
    },
  ]),
];

export const BOSCH_GLL_380_MANUAL_URL = MANUAL_PDF;
