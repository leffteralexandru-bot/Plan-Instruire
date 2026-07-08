import type { EquipmentChapter, EquipmentChapterBlock, EquipmentSafetyWarning } from '@/data/equipmentOperations';

const PROLINER_MANUAL_PDF = '/docs/equipment/proliner-quick-start-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/proliner/pages/page-${String(n).padStart(2, '0')}.png`;
const YT = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export const PROLINER_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Influența operatorului asupra procesului de măsurare este decisivă — operatorul este pe deplin responsabil pentru acuratețe și siguranță.

## Reguli critice

- **Nimeni nu are voie** să se apropie de cablu sau de cutia de comandă cât timp stiloul este în uz.
- Un cablu rupt sau un stilou scăpat poate provoca retragerea rapidă și imprevizibilă a cablului — risc grav de rănire.
- Efectuați măsurători de control periodic pentru a asigura precizia.
- Permiteți **numai personalului instruit** să lucreze cu Proliner.
- Nu utilizați Proliner în zone cu lucrări de construcție intense.`,
};

function fig(
  id: string,
  pageNum: number,
  alt: string,
  videoId?: string,
  caption?: string,
): EquipmentChapterBlock {
  return {
    id,
    type: 'figure',
    imageUrl: PAGE(pageNum),
    alt,
    caption,
    videoUrl: videoId ? YT(videoId) : undefined,
    videoLabel: 'Urmăriți videoclipul',
  };
}

function chapter(
  number: number,
  title: string,
  summary: string,
  blocks: EquipmentChapterBlock[],
  videoId?: string,
): EquipmentChapter {
  return {
    id: `proliner-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    blocks,
    videoUrl: videoId ? YT(videoId) : undefined,
    images: [],
    pdfUrl: PROLINER_MANUAL_PDF,
    pdfFileName: `Proliner-Capitol-${number}-${title.replace(/\s+/g, '-').slice(0, 40)}.pdf`,
  };
}

export const PROLINER_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Conținutul pachetului', 'Componente standard și verificare colet', [
    {
      id: 'ch1-intro',
      type: 'markdown',
      body: `## Componente standard ale pachetului Proliner

| Cantitate | Componentă |
|-----------|------------|
| 1× | Proliner |
| 1× | Telecomandă |
| 2× | Baterii |
| 1× | Încărcător de baterii |
| 2× | Adaptor cu cablu |
| 1× | Geantă cu scanere |
| 1× | Stick USB |
| 1× | Stilou pentru ecran tactil Prodim |
| 1× | Cârpă de curățare |`,
    },
    fig('ch1-page', 4, 'Capitol 1 — Conținutul pachetului Proliner', 'J-JPfeYNZsM', 'Pagina din manualul Prodim'),
    {
      id: 'ch1-attention',
      type: 'callout',
      variant: 'attention',
      body: 'Verificați lista de conținut pentru a afla conținutul exact al comenzii/coletului dvs. Conținutul poate diferi de cel prezentat aici. Contactați Prodim dacă conținutul livrat diferă de cel din lista de conținut.',
    },
    {
      id: 'ch1-note',
      type: 'callout',
      variant: 'note',
      body: 'Păstrați cutia de transport și conținutul acesteia pentru a asigura un transport în condiții de siguranță în cazul unei returnări.',
    },
  ], 'J-JPfeYNZsM'),

  chapter(2, 'Proliner (hardware)', 'Piese, butoane și montaj pe trepied', [
    {
      id: 'ch2-parts',
      type: 'bullet-list',
      title: 'Piese Proliner',
      items: [
        'Unitate de măsurare pliabilă',
        'Cap de măsurare rotativ',
        'Stilou de măsurare',
        'Conector pentru baterie',
        'Buton de deblocare a capului de măsurare',
        'Cablu de măsurare',
        'Buton de pornire',
        'Difuzor de semnal',
        'Sertar de depozitare',
        'Suport cu șurub (partea din spate)',
        'Buton sertar de depozitare',
        'Mâner de transport',
        'Port USB',
        'Grilă de ventilație',
        'Ecran tactil',
        'Port de date (Ethernet)',
        'Conexiune de alimentare',
        'Fixare cu șuruburi (partea inferioară)',
      ],
    },
    fig('ch2-page', 5, 'Capitol 2 — Proliner (hardware)', 'L3hl_zLhrh8'),
    {
      id: 'ch2-tip',
      type: 'callout',
      variant: 'tip',
      body: 'Montați Proliner-ul pe un trepied pentru o acoperire mai bună! Suporturile cu șurub pot fi folosite pentru a fixa Proliner-ul pe un trepied. Acestea sunt amplasate în partea de jos și în spate a Proliner-ului.',
    },
  ], 'L3hl_zLhrh8'),

  chapter(3, 'Telecomanda', 'Mod punct, continuu, închidere contur, ștergere', [
    {
      id: 'ch3-intro',
      type: 'markdown',
      body: 'Telecomanda este utilizată pentru a înregistra punctele de măsurare. Telecomanda are patru butoane:',
    },
    {
      id: 'ch3-buttons',
      type: 'steps',
      items: [
        '**Modul „Punct”** — Apăsați o dată pentru un singur punct. Proliner trasează automat o linie între punctele consecutive.',
        '**Modul continuu** — Înregistrează o serie de puncte până la oprire; linii drepte și/sau raze, în funcție de formă.',
        '**Sfârșitul unui contur** — Încheie conturul măsurat. Țineți apăsat butonul 3 pentru a crea un strat nou denumit.',
        '**Ștergerea ultimului punct sau contur** — Apăsați pentru ultimul punct; țineți apăsat pentru ultimul contur.',
      ],
    },
    fig('ch3-page', 6, 'Capitol 3 — Telecomanda', 'QQotdHG7LXY'),
    {
      id: 'ch3-defs',
      type: 'definitions',
      items: [
        { term: 'Punct', definition: 'O singură măsurătoare înregistrată.' },
        { term: 'Linie', definition: 'Legătura automată între două puncte.' },
        { term: 'Contur', definition: 'O secvență închisă de linii și puncte.' },
      ],
    },
    {
      id: 'ch3-tip',
      type: 'callout',
      variant: 'tip',
      body: 'Lucrați cu straturi — un strat este o colecție de puncte, linii și contururi. Țineți apăsat butonul 3 pentru a închide un strat și a crea unul nou.',
    },
  ], 'QQotdHG7LXY'),

  chapter(4, 'Software-ul Proliner', 'Autentificare, aplicații, meniuri și setări', [
    {
      id: 'ch4-note',
      type: 'callout',
      variant: 'note',
      title: 'CONȚINUT AFIȘAT',
      body: 'În funcție de configurația specifică a dispozitivului Proliner, aplicațiile, funcțiile și opțiunile pot diferi de conținutul afișat sau descris în acest manual.',
    },
    {
      id: 'ch4-auth',
      type: 'markdown',
      body: `### 4.1 Ecranul de autentificare
După pornirea Proliner, veți vedea ecranul de încărcare inițial, urmat de ecranul de autentificare. Apăsați butonul de autentificare pentru a accesa ecranul aplicației.

### 4.2 Ecranul aplicației
Afișează funcțiile principale și aplicațiile specifice industriei. Porniți o aplicație făcând clic pe pictogramă.

- **Manager** — setări avansate, diagnosticare, actualizări manuale (doar sub supravegherea Prodim)
- **Actualizare** — actualizare automată software și licențe via internet (Ethernet; de la v4.1 și Bluetooth)
- **Deconectare** — revenire la autentificare
- **Oprire** — oprire recomandată a Proliner`,
    },
    fig('ch4-page7', 7, 'Capitol 4 — Software Proliner (ecrane și meniuri)', undefined, 'Pagina 7 — manual Prodim'),
    {
      id: 'ch4-menu',
      type: 'markdown',
      body: `### 4.3 Meniul principal
Starea bateriei · Setări · Data/Ora · Rotire ecran 180º

### 4.4–4.6 Meniul de măsurare
Creați și gestionați proiecte, fișiere și date ale clienților. Deschidere, redenumire, ștergere proiecte. Transfer: import/export via USB, stocare externă sau rețea.`,
    },
    fig('ch4-page8', 8, 'Capitol 4 — Structura meniului Proliner', undefined, 'Pagina 8 — manual Prodim'),
    {
      id: 'ch4-settings',
      type: 'bullet-list',
      title: '4.7 Setări de măsurare',
      items: [
        '**Stilou** — Indicator sau scaner',
        '**Contur** — deschis sau închis automat',
        '**Compensare** — stânga, dreapta sau fără compensare',
        '**Proiecție** — plan unic sau multiple; plan orizontal, vertical, mediu sau măsurat',
        '**Compensare plan proiecție** — plan decalat (implicit) sau fără decalaj',
      ],
    },
    fig('ch4-page9', 9, 'Capitol 4 — Setări Proliner', 'LQIOkWHIP3Q', 'Pagina 9 — apăsați pentru video'),
    {
      id: 'ch4-attention',
      type: 'callout',
      variant: 'attention',
      body: 'Prolinerul este echipat cu software și licențe specifice clientului. Meniurile pot diferi între diferitele tipuri de Proliner.',
    },
  ], 'LQIOkWHIP3Q'),

  chapter(5, 'Proiecție 2D', 'De la măsurare 3D la șablon 2D', [
    {
      id: 'ch5-text',
      type: 'markdown',
      body: `Prolinerul măsoară întotdeauna în **3D**. Pentru a crea un șablon 2D, punctele 3D măsurate trebuie proiectate pe un plan de proiecție.

**Măsurare 3D** → **Plan de proiecție** → **Șablon 2D**

Exemplu: un blat de bucătărie pare plat, dar în realitate este inegal (3D). Determinați întotdeauna mai întâi planul de proiecție 2D — afișat în albastru deschis pe ecran.`,
    },
    fig('ch5-page', 10, 'Capitol 5 — Proiecție 2D', '_mVfoiH0zfM'),
  ], '_mVfoiH0zfM'),

  chapter(6, 'Compensarea măsurătorilor', 'Corecție 2,5 mm vârf stilou', [
    {
      id: 'ch6-text',
      type: 'markdown',
      body: `Stiloul de măsurare captează puncte din **centrul absolut al vârfului stiloului**. În timpul măsurătorii, obiectul este atins cu partea exterioară a vârfului.

Datorită grosimii vârfului, există o diferență de **2,5 mm** între obiectul măsurat și ceea ce înregistrează Proliner. Corectați în setările de compensare sau în editare ulterioară / CAD.

În funcție de compensarea stânga/dreapta, măsurați într-o anumită direcție. Opțiunea „niciuna” = fără compensare automată.`,
    },
    fig('ch6-page', 11, 'Capitol 6 — Compensarea măsurătorilor', 'SqE2UoNkMb4'),
    {
      id: 'ch6-attention',
      type: 'callout',
      variant: 'attention',
      body: 'Dacă utilizați un alt tip de stilou de măsurare, trebuie să ajustați și valorile de compensare!',
    },
    {
      id: 'ch6-tip',
      type: 'callout',
      variant: 'tip',
      body: 'Consultați site-ul Prodim pentru alte soluții de stilouri și accesorii pentru diverse aplicații.',
    },
  ], 'SqE2UoNkMb4'),

  chapter(7, 'Poziționare', 'Stabilitate, rază de acțiune, înălțime', [
    {
      id: 'ch7-stability',
      type: 'markdown',
      body: `La măsurare, alegeți poziția ideală. Nivelarea nu este necesară dacă stabiliți singur planul de proiecție.

**Stabilitate:** Proliner și obiectul măsurat nu trebuie să se miște.

**Rază de acțiune:** Toate punctele accesibile; evitați obstacolele; mențineți firul drept.`,
    },
    fig('ch7-page', 12, 'Capitol 7 — Poziționarea Proliner', 'G9fAtCcAsOM'),
    {
      id: 'ch7-tip',
      type: 'callout',
      variant: 'tip',
      body: 'Poziționați Proliner-ul semnificativ mai sus decât obiectul de măsurat! Așezați-l deasupra planului de proiecție — altfel măsurătoarea poate fi oglindită.',
    },
  ], 'G9fAtCcAsOM'),

  chapter(8, 'Funcția Leap', 'Rază nelimitată cu leap-pods', [
    {
      id: 'ch8-text',
      type: 'markdown',
      body: `Funcția Leap oferă rază de acțiune nelimitată pentru suprafețe mari sau măsurători din mai multe poziții. Se folosesc capsule Leap ca puncte de referință.

1. Finalizați prima parte a măsurătorii
2. Plasați cele 4 leap-pods și inițiați Leap
3. Înregistrați poziția podurilor
4. Mutați Proliner și repetați înregistrarea — pașii pot fi repetați fără limită`,
    },
    fig('ch8-page', 13, 'Capitol 8 — Funcția Leap', 'WIySmjB6Uuc'),
    {
      id: 'ch8-rules',
      type: 'steps',
      title: 'Reguli amplasare poduri',
      items: [
        'Podurile nu sunt așezate unul lângă altul',
        'Senzorii nu sunt pe o singură linie',
        'Senzorii nu sunt într-o formă simetrică',
      ],
    },
    {
      id: 'ch8-tip1',
      type: 'callout',
      variant: 'tip',
      body: 'Folosiți marcaje în locul podurilor dacă amplasarea pe perete nu este posibilă.',
    },
    {
      id: 'ch8-tip2',
      type: 'callout',
      variant: 'tip',
      body: 'Verificați și Proliner IPT — soluția pentru puncte greu accesibile.',
    },
  ], 'WIySmjB6Uuc'),

  chapter(9, 'Măsurarea în 5 pași', 'Flux complet blat bucătărie', [
    {
      id: 'ch9-intro',
      type: 'markdown',
      body: 'Exemplu practic: măsurarea unui blat de bucătărie.',
    },
    {
      id: 'ch9-steps',
      type: 'steps',
      title: 'Cei 5 pași',
      items: [
        '**PASUL 1 — POZIȚIONAREA** — Poziție fixă și stabilă; toate punctele accesibile.',
        '**PASUL 2 — PLANUL DE PROIECȚIE** — Determinați planul prin 3+ puncte.',
        '**PASUL 3 — CONTUR EXTERIOR** — Perete, margine exterioară, suporturi blat (nu uși).',
        '**PASUL 4 — CONTUR INTERIOR** — Dulapuri, decupaje, chiuvete, robinete.',
        '**PASUL 5 — FIȘIER** — Editare desen, note, export DXF.',
      ],
    },
    fig('ch9-page', 14, 'Capitol 9 — Măsurarea în 5 pași', 'MqOXGqwkPTo'),
    {
      id: 'ch9-attention',
      type: 'callout',
      variant: 'attention',
      body: 'Dacă măsurați cu marjă de compensare, nu măsurați prea strâns. Luați în considerare marja necesară pentru instalare.',
    },
    {
      id: 'ch9-tip',
      type: 'callout',
      variant: 'tip',
      body: 'Extindeți funcționalitatea cu Proliner CT — soluție specială pentru blaturi de bucătărie.',
    },
  ], 'MqOXGqwkPTo'),

  chapter(10, 'Proliner CT', 'Funcții CAD la fața locului', [
    {
      id: 'ch10-intro',
      type: 'markdown',
      body: 'Software opțional* pentru finisarea șabloanelor digitale la fața locului și pregătirea pentru producție.',
    },
    {
      id: 'ch10-features',
      type: 'steps',
      items: [
        '**Editare șabloane** — decalare linii, forme, cote, linii tăiere, note',
        '**Pregătire CNC** — tangente instantanee între puncte măsurate',
        '**Biblioteci** — decupaje, chiuvete, profiluri, materiale din DXF',
        '**Placă virtuală** — elemente și calcul material',
        '**Informații proiect** — note și instrucțiuni pe șablon',
        '**Acord client** — verificare și semnătură la fața locului',
        '**Export** — desene și rapoarte DXF/PDF pentru client și producție',
      ],
    },
    fig('ch10-page', 15, 'Capitol 10 — Proliner CT', 'HDwqWuRFcrI'),
    {
      id: 'ch10-note',
      type: 'callout',
      variant: 'note',
      body: '* Proliner CT este o completare opțională a software-ului Proliner integrat standard.',
    },
  ], 'HDwqWuRFcrI'),

  chapter(11, 'Întreținere', 'Curățare cablu și depozitare', [
    {
      id: 'ch11-care',
      type: 'markdown',
      body: `## Îngrijire generală

Curățați regulat Proliner și mențineți-l fără praf. Folosiți rucsacul oficial și/sau cutia de transport.

Cablul de măsurare — curățare săptămânală cu cârpa fără praf furnizată. **Nu folosiți lubrifianți, detergenți sau substanțe chimice!**

Începeți o măsurătoare înainte de curățarea firului — astfel auziți alarma când firul este întins prea mult.`,
    },
    {
      id: 'ch11-procedure',
      type: 'steps',
      title: 'Curățare fir (2 persoane recomandat)',
      items: [
        'Persoana 1 ține stiloul și întinde firul până la semnalul sonor de alarmă',
        'Persoana 2 curăță firul cu cârpa',
        'Singur: fir pe suprafață curată, fără încurcare — **nu dați niciodată drumul firului**',
      ],
    },
    fig('ch11-page', 16, 'Capitol 11 — Întreținere', 'WvyB-Jb5LDE'),
    {
      id: 'ch11-contact',
      type: 'markdown',
      body: 'Pentru asistență: [prodim-systems.com](https://www.prodim-systems.com) · helpdesk@prodim-systems.com',
    },
  ], 'WvyB-Jb5LDE'),
];

export const PROLINER_MANUAL_URL = PROLINER_MANUAL_PDF;
