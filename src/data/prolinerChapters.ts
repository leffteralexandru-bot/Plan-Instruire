import type { EquipmentChapter, EquipmentSafetyWarning } from '@/data/equipmentOperations';

const PROLINER_MANUAL_PDF = '/docs/equipment/proliner-quick-start-ro.pdf';

export const PROLINER_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Influența operatorului asupra procesului de măsurare este decisivă — operatorul este pe deplin responsabil pentru acuratețe și siguranță.

## Reguli critice

- **Nimeni nu are voie** să se apropie de cablu sau de cutia de comandă cât timp stiloul este în uz.
- Un cablu rupt sau un stilou scăpat poate provoca retragerea rapidă și imprevizibilă a cablului — risc grav de rănire.
- Efectuați măsurători de control periodic pentru a asigura precizia.
- Permiteți **numai personalului instruit** să lucreze cu Proliner.
- Nu utilizați Proliner în zone cu lucrări de construcție intense.

## Confidențialitate

Informațiile din acest ghid sunt destinate exclusiv utilizării interne artGRANIT. Divulgarea sau distribuirea este strict interzisă.`,
};

function chapter(
  number: number,
  title: string,
  summary: string,
  content: string,
  steps: string[] = [],
): EquipmentChapter {
  return {
    id: `proliner-ch-${number}`,
    number,
    title,
    summary,
    content,
    steps,
    images: [],
    pdfUrl: PROLINER_MANUAL_PDF,
    pdfFileName: `Proliner-Capitol-${number}-${title.replace(/\s+/g, '-').slice(0, 40)}.pdf`,
  };
}

export const PROLINER_CHAPTERS: EquipmentChapter[] = [
  chapter(
    1,
    'Conținutul pachetului',
    'Componente standard și verificare colet',
    `## Componente standard

- 1× Proliner, 1× telecomandă, 2× baterii
- 1 încărcător, 2× adaptor cu cablu, 1× geantă scanere
- 1× stick USB, 1× stilou ecran tactil, 1× cârpă curățare

**ATENȚIE:** Verificați lista de conținut pentru conținutul exact al comenzii. Contactați Prodim dacă livrarea diferă.

**NOTĂ:** Păstrați cutia de transport pentru returnări în siguranță.`,
    ['Verificați conținutul coletului față de lista de livrare', 'Păstrați ambalajul original'],
  ),
  chapter(
    2,
    'Proliner (hardware)',
    'Piese, butoane și montaj pe trepied',
    `## Piese principale

Unitate de măsurare pliabilă, cap de măsurare rotativ, stilou, conector baterie, cablu de măsurare, ecran tactil, port USB și Ethernet.

**SFAT:** Montați Proliner pe trepied — suporturile cu șurub sunt în partea inferioară și din spate.`,
  ),
  chapter(
    3,
    'Telecomanda',
    'Mod punct, continuu, închidere contur, ștergere',
    `## Cele patru butoane

1. **Mod Punct** — un singur punct; linie automată între puncte consecutive
2. **Mod continuu** — serie de puncte până la oprire; linii drepte și/sau raze
3. **Sfârșit contur** — închide conturul; țineți apăsat pentru strat nou
4. **Ștergere** — ultimul punct; țineți apăsat pentru ultimul contur

**SFAT:** Lucrați cu straturi — colecții de puncte, linii și contururi.`,
  ),
  chapter(
    4,
    'Software-ul Proliner',
    'Autentificare, aplicații, meniuri',
    `## Ecrane principale

- **Autentificare** — după pornire, acces la aplicații
- **Ecran aplicații** — funcții specifice industriei
- **Manager** — setări avansate (doar sub supraveghere Prodim)
- **Actualizare** — software și licențe via Ethernet

**ATENȚIE:** Software și licențe specifice clientului — meniurile pot diferi între tipuri de Proliner.`,
  ),
  chapter(
    5,
    'Proiecție 2D',
    'De la măsurare 3D la șablon 2D',
    `Proliner măsoară întotdeauna în **3D**. Pentru șablon 2D, punctele se proiectează pe un plan de proiecție.

Determinați planul de proiecție 2D înainte de măsurarea conturului — exemplu: blat de bucătărie inegal (3D) necesită plan de proiecție.`,
  ),
  chapter(
    6,
    'Compensarea măsurătorilor',
    'Corecție 2,5 mm vârf stilou',
    `Stiloul captează din centrul absolut al vârfului. Există o diferență de **2,5 mm** față de obiectul atins.

Compensați în setări (stânga / dreapta / niciuna) sau corectați ulterior în CAD.

**ATENȚIE:** La alt tip de stilou, ajustați valorile de compensare!`,
  ),
  chapter(
    7,
    'Poziționare',
    'Stabilitate, rază de acțiune, înălțime',
    `## Criterii

- **Stabilitate** — Proliner și obiectul nu se mișcă în timpul măsurării
- **Rază de acțiune** — toate punctele accesibile, evitați obstacolele
- **Înălțime** — poziționați Proliner semnificativ mai sus decât obiectul

Dacă planul de proiecție e deasupra Proliner, măsurătoarea poate fi oglindită.`,
  ),
  chapter(
    8,
    'Funcția Leap',
    'Rază nelimitată cu leap-pods',
    `Pentru suprafețe mari sau măsurători din mai multe poziții:

1. Finalizați prima parte a măsurătorii
2. Plasați cele 4 leap-pods și inițiați Leap
3. Înregistrați poziția podurilor
4. Mutați Proliner și repetați înregistrarea

**SFAT:** Folosiți marcaje dacă podurile nu pot fi amplasate pe perete.`,
  ),
  chapter(
    9,
    'Măsurarea în 5 pași',
    'Flux complet blat bucătărie',
    `## Pași

1. **Poziționare** — fix, stabil, toate punctele accesibile
2. **Plan proiecție** — 3+ puncte
3. **Contur exterior** — perete, margine, suporturi (nu uși)
4. **Contur interior** — dulapuri, decupaje, chiuvete, robinete
5. **Fișier** — editare, note, export DXF

**ATENȚIE:** Cu compensare, nu măsurați prea strâns — luați în calcul marja de instalare.`,
    [
      'Poziționare stabilă',
      'Determinare plan proiecție',
      'Măsurare contur exterior',
      'Măsurare contur interior',
      'Export DXF',
    ],
  ),
  chapter(
    10,
    'Proliner CT',
    'Funcții CAD la fața locului',
    `Software opțional pentru blaturi și panouri:

- Editare șabloane digitale (decalare, cote, linii tăiere)
- Tangente CNC automate
- Biblioteci decupaje, chiuvete, materiale
- Placă virtuală și elemente
- Aprobare client la fața locului
- Export DXF și PDF`,
  ),
  chapter(
    11,
    'Întreținere',
    'Curățare cablu și depozitare',
    `## Îngrijire

- Curățați regulat Proliner și cablul (săptămânal) cu cârpa fără praf furnizată
- **Nu** folosiți lubrifianți, detergenți sau substanțe chimice
- Începeți o măsurătoare înainte de curățarea firului (semnal alarmă la întindere)
- Curățarea întregului fir: 2 persoane recomandat; singur: fir pe suprafață curată, **nu dați drumul firului**

Contact: [prodim-systems.com](https://www.prodim-systems.com)`,
    [
      'Curățare carcasă și cablu cu cârpă uscată',
      'Verificare alarmă înainte de curățare fir',
      'Depozitare în rucsac / cutie transport',
    ],
  ),
];

export const PROLINER_MANUAL_URL = PROLINER_MANUAL_PDF;
