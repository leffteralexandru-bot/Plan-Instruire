import type {
  EquipmentChapter,
  EquipmentChapterBlock,
  EquipmentSafetyWarning,
} from '@/data/equipmentOperations';

const MANUAL_PDF = '/docs/equipment/bosch-glm-40/bosch-glm-40-manual-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/bosch-glm-40/pages/page-${String(n).padStart(2, '0')}.png`;
const VIDEO = (id: string) => `/docs/equipment/bosch-glm-40/videos/${id}.mp4`;

export const BOSCH_GLM_40_VIDEOS = {
  overview: VIDEO('ck8hgxavkR4'),
  howto: VIDEO('6hZxO5xUjtE'),
  demoRo: VIDEO('d76uCeNqlRE'),
} as const;

export const BOSCH_GLM_40_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță — Laser Clasa 2',
  content: `## Responsabilitate operator

Telemetru Bosch GLM 40 — **clasa laser 2**. Nu îndreptați fasciculul spre persoane.

## Reguli critice

- **Nu priviți fasciculul laser** direct și nu lăsați aparatul pornit nesupravegheat.
- Măsurați perpendicular pe suprafață, evitând soarele direct pe lentilă.
- După șoc sau cădere, verificați precizia înainte de măsurători critice.
- Permiteți **numai personalului instruit** să opereze telemetrul pe șantier.`,
};

function blocksChapter(
  number: number,
  title: string,
  summary: string,
  blocks: EquipmentChapterBlock[],
  options?: { includePdf?: boolean; videoUrl?: string },
): EquipmentChapter {
  return {
    id: `bosch-glm-40-ch-${number}`,
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
      ? 'BOSCH-GLM-40-Manual-artGRANIT.pdf'
      : undefined,
  };
}

export const BOSCH_GLM_40_CHAPTERS: EquipmentChapter[] = [
  blocksChapter(1, 'Manual de instruire', 'Descărcare manual complet Bosch PDF — offline', [], {
    includePdf: true,
  }),
  blocksChapter(
    2,
    'Prezentare produs',
    'GLM 40 Professional — 40 m, precizie ±1,5 mm, memorie 10 valori',
    [
      {
        id: 'b2-intro',
        type: 'markdown',
        body: `## Bosch PRO GLM 40

Telemetru laser compact pentru **distanță, suprafață și volum** — display iluminat, memorie 10 măsurători.

**Cod produs:** 0601072900 | **Set livrare:** geantă, 2× baterii AAA, manual`,
      },
      {
        id: 'b2-specs',
        type: 'definitions',
        items: [
          { term: 'Domeniu măsurare', definition: '0,15 – 40 m' },
          { term: 'Precizie', definition: '± 1,5 mm' },
          { term: 'Clasă laser', definition: '2 (635 nm, < 1 mW)' },
          { term: 'Protecție', definition: 'IP54 — praf și stropi' },
          { term: 'Autonomie', definition: '≈ 5.000 măsurători individuale' },
          { term: 'Greutate', definition: '≈ 90 g' },
        ],
      },
      {
        id: 'b2-video',
        type: 'figure',
        imageUrl: PAGE(2),
        alt: 'Prezentare Bosch GLM 40 Professional',
        caption: 'Distanță, suprafață, volum — un singur aparat',
        videoUrl: BOSCH_GLM_40_VIDEOS.overview,
        videoLabel: 'Urmăriți videoclipul de prezentare',
      },
      {
        id: 'b2-modes',
        type: 'bullet-list',
        title: 'Moduri de măsurare',
        items: [
          'Distanță (lungime) — mod standard',
          'Suprafață — L × l',
          'Volum — L × l × h',
          'Măsurare indirectă (Pythagora) — înălțime',
          'Măsurare în timp real — valoare actualizată la mișcare',
        ],
      },
    ],
    { videoUrl: BOSCH_GLM_40_VIDEOS.overview },
  ),
  blocksChapter(3, 'Siguranță și componente', 'Butoane, lentile laser și baterii AAA', [
    {
      id: 'b3-warn',
      type: 'callout',
      variant: 'attention',
      title: 'ATENȚIE! Laser clasa 2',
      body: 'Nu îndreptați fasciculul spre ochi sau persoane. Opriți aparatul după utilizare.',
    },
    {
      id: 'b3-parts',
      type: 'figure',
      imageUrl: PAGE(2),
      alt: 'Componente Bosch GLM 40',
      caption: 'Display, butoane măsurare/funcție, lentilă emisie și recepție',
    },
    {
      id: 'b3-battery',
      type: 'steps',
      title: 'Montare baterii',
      items: [
        'Apăsați clapeta compartimentului baterii.',
        'Introduceți **2 baterii AAA alcaline** (polaritate conform marcajului).',
        'Închideți capacul până la fixare.',
        'La simbolul baterie pe display — ≈ 15 min rămase în mod real-time.',
      ],
    },
  ]),
  blocksChapter(
    4,
    'Măsurare distanță',
    'Pornire, măsurare lungime și timp real',
    [
      {
        id: 'b4-steps',
        type: 'steps',
        title: 'Măsurare lungime',
        items: [
          'Puneți aparatul cu **spatele** la punctul de start (perete, colț).',
          'Țintiți perpendicular pe suprafața țintă.',
          'Apăsați butonul **Măsurare** — rezultatul apare în max. 4 secunde.',
          'Apăsați din nou pentru a salva în memorie (ultimele 3 pe display).',
        ],
      },
      {
        id: 'b4-fig',
        type: 'figure',
        imageUrl: PAGE(4),
        alt: 'Procedură măsurare distanță GLM 40',
        caption: 'Punct de referință: spatele telemetrului',
        videoUrl: BOSCH_GLM_40_VIDEOS.howto,
        videoLabel: 'Cum se utilizează',
      },
      {
        id: 'b4-realtime',
        type: 'callout',
        variant: 'tip',
        body: 'Mod **timp real**: valoarea se actualizează la ~0,5 s când vă deplasați spre/departe de țintă — util pentru găsirea distanței minime/maxime.',
      },
      {
        id: 'b4-fig2',
        type: 'figure',
        imageUrl: PAGE(12),
        alt: 'Măsurare în timp real',
        caption: 'Mod real-time — mutați aparatul spre țintă',
        videoUrl: BOSCH_GLM_40_VIDEOS.demoRo,
        videoLabel: 'Demonstrație GLM 40',
      },
    ],
    { videoUrl: BOSCH_GLM_40_VIDEOS.howto },
  ),
  blocksChapter(5, 'Suprafață, volum, Pythagora', 'Calcule automate și înălțime indirectă', [
    {
      id: 'b5-area',
      type: 'steps',
      title: 'Suprafață',
      items: [
        'Apăsați butonul Funcție până la pictograma suprafață.',
        'Măsurați lungimea, apoi lățimea — suprafața se calculează automat.',
      ],
    },
    {
      id: 'b5-volume',
      type: 'steps',
      title: 'Volum',
      items: [
        'Selectați modul volum.',
        'Măsurați L, l și h — volumul apare după a treia măsurătoare.',
      ],
    },
    {
      id: 'b5-pyth',
      type: 'steps',
      title: 'Înălțime indirectă (Pythagora)',
      items: [
        'Selectați măsurare indirectă.',
        'Asigurați un unghi drept între distanța orizontală și înălțimea căutată.',
        'Măsurați distanța orizontală, apoi diagonala — înălțimea se calculează automat.',
      ],
    },
    {
      id: 'b5-fig',
      type: 'figure',
      imageUrl: PAGE(14),
      alt: 'Măsurare indirectă Pythagora',
      caption: 'Schema măsurare înălțime indirectă',
    },
  ]),
  blocksChapter(6, 'Memorie și unități', 'Ultimele 10 valori, m/cm și ft/inch', [
    {
      id: 'b6-memory',
      type: 'markdown',
      body: `## Memorie

Telemetrul salvează automat **ultimele 10 măsurători**. Navigați cu butoanele 3/6. Pentru ștergere: mod memorie → buton Clear.`,
    },
    {
      id: 'b6-units',
      type: 'steps',
      title: 'Schimbare unități',
      items: [
        'Țineți apăsat butonul Funcție până la ecranul unități.',
        'Folosiți butoanele 3 și 6 pentru m/cm sau ft/inch.',
        'Apăsați Măsurare pentru confirmare.',
      ],
    },
    {
      id: 'b6-fig',
      type: 'figure',
      imageUrl: PAGE(16),
      alt: 'Schimbare unități și sunet',
      caption: 'Unități de măsură și activare/dezactivare sunet',
    },
    {
      id: 'b6-add',
      type: 'callout',
      variant: 'note',
      body: 'Puteți **aduna/scădea** măsurători în modul lungime — util pentru calcule rapide pe teren fără carnet.',
    },
  ]),
  blocksChapter(7, 'Întreținere și verificare', 'Curățare lentile, verificare precizie', [
    {
      id: 'b7-check',
      type: 'steps',
      title: 'Verificare precizie',
      items: [
        'Măsurați o distanță cunoscută (ex. 2 m riglă).',
        'Comparați cu valoarea GLM 40 — abatere acceptabilă ± 1,5 mm.',
        'După cădere sau șoc, repetați verificarea înainte de măsurători critice.',
      ],
    },
    {
      id: 'b7-clean',
      type: 'steps',
      title: 'Curățare',
      items: [
        'Ștergeți carcasa cu lavetă ușor umedă — **fără solvenți**.',
        'Curățați lentila de recepție ca pe o lentilă foto.',
        'Nu scufundați aparatul în apă.',
        'Depozitați în geantă, scoateți bateriile la depozitare lungă.',
      ],
    },
    {
      id: 'b7-fig',
      type: 'figure',
      imageUrl: PAGE(17),
      alt: 'Sfaturi de lucru GLM 40',
      caption: 'Factori care influențează raza și precizia',
    },
  ]),
];

export const BOSCH_GLM_40_MANUAL_URL = MANUAL_PDF;
