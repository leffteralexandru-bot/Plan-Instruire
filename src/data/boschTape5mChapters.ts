import type {
  EquipmentChapter,
  EquipmentChapterBlock,
  EquipmentSafetyWarning,
} from '@/data/equipmentOperations';

const MANUAL_PDF = '/docs/equipment/bosch-tape-5m/bosch-tape-5m-declaratie-ue.pdf';
const PAGE = (n: number) =>
  `/docs/equipment/bosch-tape-5m/pages/page-${String(n).padStart(2, '0')}.png`;
const VIDEO = (id: string) => `/docs/equipment/bosch-tape-5m/videos/${id}.mp4`;

export const BOSCH_TAPE_5M_VIDEOS = {
  howtoRo: VIDEO('D4XjvT04RxM'),
  tipsRo: VIDEO('Eyv967IsKlw'),
  proTips: VIDEO('OGsf-SZtW-s'),
} as const;

export const BOSCH_TAPE_5M_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță — Ruletă de măsurat',
  content: `## Responsabilitate operator

Ruleta Bosch 5 m — **clasă de precizie II**. Verificați starea benzii înainte de măsurători critice.

## Reguli critice

- **Nu lăsați banda să se retragă liber** spre degete sau față — țineți apăsat butonul de blocare la retragere.
- Nu folosiți ruleta cu bandă ruptă, îndoită sau cu cârlig deformat.
- La măsurători pe șantier umed/prăfos, ștergeți marcațiile înainte de citire.
- Permiteți **numai personalului instruit** să efectueze măsurători de recepție.`,
};

function blocksChapter(
  number: number,
  title: string,
  summary: string,
  blocks: EquipmentChapterBlock[],
  options?: { includePdf?: boolean; videoUrl?: string },
): EquipmentChapter {
  return {
    id: `bosch-tape-5m-ch-${number}`,
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
      ? 'BOSCH-Ruleta-5m-Declaratie-UE-artGRANIT.pdf'
      : undefined,
  };
}

export const BOSCH_TAPE_5M_CHAPTERS: EquipmentChapter[] = [
  blocksChapter(1, 'Manual de instruire', 'Document oficial Bosch + ghid video artGRANIT', [], {
    includePdf: true,
  }),
  blocksChapter(
    2,
    'Prezentare produs',
    'Ruletă 5 m Professional — carcasă aluminiu, cârlig magnetic, Flexi Stop',
    [
      {
        id: 'b2-intro',
        type: 'markdown',
        body: `## Bosch Professional Ruletă 5 m

Ruletă metrică pentru măsurători liniare pe șantier — bandă **nylon 27 mm**, carcasă **aluminiu**, cârlig magnetic.

**Cod produs:** 1600A016BH | **Livrare:** cutie carton`,
      },
      {
        id: 'b2-specs',
        type: 'definitions',
        items: [
          { term: 'Lungime bandă', definition: '5 m' },
          { term: 'Lățime bandă', definition: '27 mm' },
          { term: 'Stand-out maxim', definition: '2,7 m (fără sprijin)' },
          { term: 'Clasă precizie', definition: 'II (UE)' },
          { term: 'Cârlig', definition: 'Magnetic — prindere pe metal' },
          { term: 'Blocare', definition: 'Flexi Stop — buton retragere' },
          { term: 'Greutate', definition: '≈ 360 g' },
        ],
      },
      {
        id: 'b2-fig',
        type: 'figure',
        imageUrl: PAGE(1),
        alt: 'Bosch Ruletă 5 m Professional — conținut cutie',
        caption: 'Ruletă 5 m în carcasă aluminiu, cu clema de centură',
      },
      {
        id: 'b2-parts',
        type: 'bullet-list',
        title: 'Componente principale',
        items: [
          'Carcasă aluminiu cu grip anti-șoc',
          'Bandă gradată metrică, față dublă',
          'Cârlig metalic magnetic la capăt',
          'Buton Flexi Stop (blocare retragere)',
          'Cursor/slider de blocare lateral',
          'Clema centură',
        ],
      },
    ],
  ),
  blocksChapter(
    3,
    'Cum se măsoară — baze',
    'Poziționare, citire marcaje, măsurare exterior și interior',
    [
      {
        id: 'b3-steps',
        type: 'steps',
        title: 'Procedură standard',
        items: [
          'Trageți banda până la punctul țintă — țineți ruleta **orizontală** sau **verticală**, fără unghi.',
          'Fixați banda cu **cursorul lateral** sau țineți apăsat **Flexi Stop** când citiți valoarea.',
          'Citiți marcajul la **muchia cârligului** (exterior) sau la **spatele carcasei** (interior).',
          'Eliberați butonul de blocare și lăsați banda să se retragă **controlat**, cu degetul pe buton.',
        ],
      },
      {
        id: 'b3-fig',
        type: 'figure',
        imageUrl: PAGE(2),
        alt: 'Ruletă Bosch 5 m — vedere produs',
        caption: 'Țineți banda dreaptă; citiți la muchia de referință',
        videoUrl: BOSCH_TAPE_5M_VIDEOS.howtoRo,
        videoLabel: 'Măsurare cu rigla / ruleta (RO)',
      },
      {
        id: 'b3-exterior',
        type: 'callout',
        variant: 'tip',
        title: 'Măsurare exterior (de la perete la perete)',
        body: 'Cârligul se sprijină **pe exteriorul** primului perete; citiți la muchia exterioară a celui de-al doilea punct. Cârligul include compensația grosimii sale.',
      },
      {
        id: 'b3-interior',
        type: 'callout',
        variant: 'note',
        title: 'Măsurare interior (între două pereți)',
        body: 'Sprijiniți **spatele carcasei** pe primul perete și citiți la muchia interioară a celui de-al doilea. Alternativ: măsurați exterior + exterior și **scădeți** de două ori grosimea cârligului (≈ 2–3 mm).',
      },
    ],
    { videoUrl: BOSCH_TAPE_5M_VIDEOS.howtoRo },
  ),
  blocksChapter(
    4,
    'Cârlig magnetic și stand-out',
    'Măsurare pe o singură persoană, prindere pe metal, bandă extinsă 2,7 m',
    [
      {
        id: 'b4-magnetic',
        type: 'steps',
        title: 'Utilizare cârlig magnetic',
        items: [
          'Atașați cârligul pe **profil metalic**, țeavă sau tablă — verificați că e fix.',
          'Extindeți banda spre punctul de măsurat fără a o lăsa să cadă.',
          'La muchii ascuțite, sprijiniți cârligul pe **cant** (nu pe față lată) pentru precizie.',
        ],
      },
      {
        id: 'b4-standout',
        type: 'callout',
        variant: 'attention',
        title: 'Stand-out 2,7 m',
        body: 'Banda poate rămâne rigidă până la **2,7 m** fără sprijin intermediar. Peste această distanță, sprijiniți banda sau folosiți un ajutor — altfel banda se îndoiește și citirea devine inexactă.',
      },
      {
        id: 'b4-fig',
        type: 'figure',
        imageUrl: PAGE(3),
        alt: 'Cârlig magnetic Bosch ruletă 5 m',
        caption: 'Cârlig magnetic — măsurare pe distanțe lungi, o singură persoană',
        videoUrl: BOSCH_TAPE_5M_VIDEOS.tipsRo,
        videoLabel: 'Trucuri utile — ruleta de măsurat (RO)',
      },
    ],
    { videoUrl: BOSCH_TAPE_5M_VIDEOS.tipsRo },
  ),
  blocksChapter(5, 'Flexi Stop și blocare bandă', 'Buton retragere și cursor lateral', [
    {
      id: 'b5-flexi',
      type: 'steps',
      title: 'Flexi Stop',
      items: [
        'Trageți banda la lungimea dorită.',
        'Apăsați **Flexi Stop** (butonul de pe carcasă) — banda rămâne extinsă.',
        'Marcați sau citiți valoarea fără presiune pe bandă.',
        'Eliberați butonul pentru retragere controlată.',
      ],
    },
    {
      id: 'b5-slider',
      type: 'steps',
      title: 'Cursor lateral',
      items: [
        'Glisați cursorul în sus pentru a **bloca** banda la o lungime fixă.',
        'Folosiți la transfer repetat al aceleiași dimensiuni (ex. marcaj pe mai multe piese).',
        'Eliberați cursorul înainte de retragerea completă a benzii.',
      ],
    },
    {
      id: 'b5-fig',
      type: 'figure',
      imageUrl: PAGE(1),
      alt: 'Blocare bandă ruletă Bosch',
      caption: 'Flexi Stop + cursor — două moduri de a fixa lungimea',
    },
  ]),
  blocksChapter(
    6,
    'Trucuri de precizie',
    'Punct de zero, marcaje roșii, diagonale și verificare',
    [
      {
        id: 'b6-tricks',
        type: 'bullet-list',
        title: 'Tehnici utile pe teren',
        items: [
          'Folosiți **marca roșie** la fiecare metru pentru citire rapidă.',
          'Pentru diagonale: banda trebuie să urmeze **linia dreaptă** între puncte, fără să sară peste obstacole.',
          'La colțuri: măsurați în **L** (două segmente) dacă nu puteți trece banda direct.',
          'Pentru găuri/centre: marcați cu creion folosind gaura din cârlig (unde există).',
        ],
      },
      {
        id: 'b6-fig',
        type: 'figure',
        imageUrl: PAGE(2),
        alt: 'Măsurare precisă cu ruleta',
        caption: 'Măsurare perpendiculară, fără unghi — sursa principală de erori',
        videoUrl: BOSCH_TAPE_5M_VIDEOS.proTips,
        videoLabel: 'Pro tips — măsurare precisă cu ruleta',
      },
      {
        id: 'b6-check',
        type: 'steps',
        title: 'Verificare rapidă a preciziei',
        items: [
          'Extindeți 1 m și comparați cu o riglă etalon.',
          'Verificați că **primul centimetru** (cârlig retractat) nu este uzat sau șters.',
          'Dacă abaterea depășește **±1 mm/m** (clasă II), înlocuiți ruleta.',
        ],
      },
    ],
    { videoUrl: BOSCH_TAPE_5M_VIDEOS.proTips },
  ),
  blocksChapter(7, 'Întreținere', 'Curățare bandă, depozitare, uzură', [
    {
      id: 'b7-clean',
      type: 'steps',
      title: 'Curățare și depozitare',
      items: [
        'Ștergeți praful de pe bandă cu lavetă uscată — **fără solvenți** pe marcajele gradate.',
        'Lăsați banda uscată înainte de retragere (umiditatea accelerează coroziunea).',
        'Retrageți banda **complet** în carcasă după utilizare.',
        'Depozitați în cutie, ferit de cădere și de temperaturi extreme.',
      ],
    },
    {
      id: 'b7-wear',
      type: 'callout',
      variant: 'attention',
      body: 'Înlocuiți ruleta dacă banda este **tăiată**, cârligul **îndoit**, sau marcajele **șterse** în zona primilor 50 cm — aceste defecte duc la erori sistematice la granit/marmură.',
    },
    {
      id: 'b7-fig',
      type: 'figure',
      imageUrl: PAGE(1),
      alt: 'Întreținere ruletă Bosch 5 m',
      caption: 'Bandă curată, retrasă complet — durată de viață maximă',
    },
  ]),
];

export const BOSCH_TAPE_5M_MANUAL_URL = MANUAL_PDF;
