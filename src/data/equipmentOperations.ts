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

export interface EquipmentDevice {
  id: string;
  name: string;
  category: string;
  description?: string;
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
    'Ghiduri pentru aparatele de măsurat utilizate în teren. Selectați aparatul, apoi secțiunea: curățare, utilizare sau integrare CAD.',
  devices: [
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

export function getDeviceSection(
  device: EquipmentDevice,
  sectionId: EquipmentGuideSectionId,
): EquipmentGuideSection {
  return device[sectionId];
}
