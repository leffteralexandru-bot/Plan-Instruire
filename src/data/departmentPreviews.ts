import type { DepartmentId } from './departments';

/** Tematici planificate — actualizate când primiți documentele de la artGRANIT */
export interface DepartmentPlanPreview {
  id: DepartmentId;
  durationEstimate?: string;
  modules: string[];
}

export const DEPARTMENT_PLAN_PREVIEWS: Record<Exclude<DepartmentId, 'ingineri'>, DepartmentPlanPreview> = {
  productie: {
    id: 'productie',
    durationEstimate: 'în definire',
    modules: [
      'Siguranță și EPI în atelier',
      'Flux producție: tăiere, frezare, polizare',
      'Materiale: granit, quartz, ceramică — prelucrare',
      'Control calitate și finisaje',
      'Predare către montaj',
    ],
  },
  administratie: {
    id: 'administratie',
    durationEstimate: 'în definire',
    modules: [
      'Proceduri interne și documente standard',
      'Oferte, contracte și relații clienți',
      'Facturare și urmărire comenzi',
      'Comunicare cu producție și proiectare',
      'Confidențialitate și GDPR',
    ],
  },
  management: {
    id: 'management',
    durationEstimate: 'în definire',
    modules: [
      'Standarde calitate artGRANIT',
      'Coordonare echipe și proiecte',
      'Indicatori de performanță (KPI)',
      'Gestionarea situațiilor și escaladare',
      'Raportare și planificare',
    ],
  },
};
