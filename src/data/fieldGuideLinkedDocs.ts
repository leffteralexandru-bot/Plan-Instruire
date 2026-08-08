import type { OperationalGuideTaskId } from '@/data/operationalGuide';
import {
  FIELD_GUIDE_ANEXA1_PDF,
  FIELD_GUIDE_ANEXA1_PDF_NAME,
  FIELD_GUIDE_CANTING_PDF,
  FIELD_GUIDE_CANTING_PDF_NAME,
  FIELD_GUIDE_CARNET_PDF,
  FIELD_GUIDE_CARNET_PDF_NAME,
  FIELD_GUIDE_CHECKLIST_BY_TASK,
  FIELD_GUIDE_CTG_PDF,
  FIELD_GUIDE_CTG_PDF_NAME,
  FIELD_GUIDE_FISE_TEHNICE_PDF,
  FIELD_GUIDE_FISE_TEHNICE_PDF_NAME,
} from '@/data/fieldGuideChapters';

const LINKED = '/docs/operational-guide/field-guide/linked-manuals';

export type FieldGuideLinkedDocId =
  | 'anexa1'
  | 'carnet'
  | 'proliner'
  | 'gll'
  | 'ruleta'
  | 'checklist'
  | 'canting'
  | 'fise'
  | 'ctg'
  | 'doc-tehnica';

export interface FieldGuideLinkedDoc {
  id: FieldGuideLinkedDocId;
  title: string;
  eyebrow: string;
  url: string;
  fileName: string;
  /** Deschide Repository tehnic în loc de overlay PDF */
  openRepo?: boolean;
  /** Deschide cartea din Mentenanță / Utilaje teren */
  equipmentDeviceId?: string;
}

const STATIC_DOCS: Record<
  Exclude<FieldGuideLinkedDocId, 'checklist' | 'doc-tehnica'>,
  Omit<FieldGuideLinkedDoc, 'id'>
> = {
  anexa1: {
    title: 'Anexa 1 (șablon)',
    eyebrow: 'Anexa 1 · șablon',
    url: FIELD_GUIDE_ANEXA1_PDF,
    fileName: FIELD_GUIDE_ANEXA1_PDF_NAME,
  },
  carnet: {
    title: 'Carnet măsurători + creion',
    eyebrow: 'Carnet măsurători · exemplu',
    url: FIELD_GUIDE_CARNET_PDF,
    fileName: FIELD_GUIDE_CARNET_PDF_NAME,
  },
  proliner: {
    title: 'Aparatul de măsurat Proliner',
    eyebrow: 'Utilaje teren · Proliner · carte Mentenanță',
    url: `${LINKED}/proliner-manual.pdf`,
    fileName: 'proliner-manual.pdf',
    equipmentDeviceId: 'eq-proliner',
  },
  gll: {
    title: 'Nivelă laser Bosch GLL 3-80',
    eyebrow: 'Utilaje teren · GLL 3-80 · carte Mentenanță',
    url: `${LINKED}/bosch-gll-3-80-manual.pdf`,
    fileName: 'bosch-gll-3-80-manual.pdf',
    equipmentDeviceId: 'eq-bosch-gll-3-80',
  },
  ruleta: {
    title: 'Ruletă Bosch 5 m',
    eyebrow: 'Utilaje teren · Ruletă · carte Mentenanță',
    url: `${LINKED}/bosch-ruleta-5m.pdf`,
    fileName: 'bosch-ruleta-5m.pdf',
    equipmentDeviceId: 'eq-bosch-tape-5m',
  },
  canting: {
    title: 'Canting',
    eyebrow: 'Canting · șablon nesting',
    url: FIELD_GUIDE_CANTING_PDF,
    fileName: FIELD_GUIDE_CANTING_PDF_NAME,
  },
  fise: {
    title: 'Fișe tehnice accesorii (exemple)',
    eyebrow: 'Fișe tehnice accesorii · exemple',
    url: FIELD_GUIDE_FISE_TEHNICE_PDF,
    fileName: FIELD_GUIDE_FISE_TEHNICE_PDF_NAME,
  },
  ctg: {
    title: 'CTG — Exemplu_Comanda_Material',
    eyebrow: 'CTG · Comandă material · șablon',
    url: FIELD_GUIDE_CTG_PDF,
    fileName: FIELD_GUIDE_CTG_PDF_NAME,
  },
};

/** Mapare nume fișier din PDF → id deep-link (pentru rewrite la build). */
export const FIELD_GUIDE_PDF_FILENAME_TO_DOC_ID: Record<string, FieldGuideLinkedDocId> = {
  'anexa-1-sablon.pdf': 'anexa1',
  'Carnet-masuratori-creion.pdf': 'carnet',
  'proliner-manual.pdf': 'proliner',
  'bosch-gll-3-80-manual.pdf': 'gll',
  'bosch-ruleta-5m.pdf': 'ruleta',
  'Checklist_Client_ArtGranit.pdf': 'checklist',
  'Canting.pdf': 'canting',
  'Exemple_Fise_Tehnice_Accesorii.pdf': 'fise',
  'Exemplu_Comanda_Material.pdf': 'ctg',
};

export function resolveFieldGuideLinkedDoc(
  docId: string | null | undefined,
  tip: OperationalGuideTaskId,
): FieldGuideLinkedDoc | null {
  if (!docId) return null;
  if (docId === 'doc-tehnica') {
    return {
      id: 'doc-tehnica',
      title: 'Documentație tehnică',
      eyebrow: 'Etapa 1.7 · Repository tehnic',
      url: '',
      fileName: '',
      openRepo: true,
    };
  }
  if (docId === 'checklist') {
    const checklist = FIELD_GUIDE_CHECKLIST_BY_TASK[tip];
    return {
      id: 'checklist',
      title: 'Checklist_Client_ArtGranit',
      eyebrow: `Checklist Client · șablon · ${tip}`,
      url: checklist.url,
      fileName: checklist.fileName,
    };
  }
  const staticDoc = STATIC_DOCS[docId as keyof typeof STATIC_DOCS];
  if (!staticDoc) return null;
  return { id: docId as FieldGuideLinkedDocId, ...staticDoc };
}

/** Query pe panou: același destinație din PDF descărcat și din poza de pe site. */
export function buildFieldGuideDocSearchParams(input: {
  tip: OperationalGuideTaskId;
  doc: FieldGuideLinkedDocId;
  ghid?: 'teren' | 'proiectare';
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.doc === 'doc-tehnica') {
    params.set('ref', 'repo');
    params.set('doc', 'doc-tehnica');
  } else {
    params.set('ref', 'guide');
    params.set('ghid', input.ghid ?? 'teren');
    params.set('tip', input.tip);
    params.set('doc', input.doc);
  }
  return params;
}
