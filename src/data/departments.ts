/** Departamente artGRANIT — planuri de instruire pe structură organizațională */
export type DepartmentId = 'productie' | 'ingineri' | 'administratie' | 'management';

export interface Department {
  id: DepartmentId;
  /** Denumire oficială (cu diacritice) */
  label: string;
  subtitle: string;
  description: string;
  /** Plan disponibil în aplicație */
  planAvailable: boolean;
  route: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'ingineri',
    label: 'Ingineri',
    subtitle: 'Inginer Proiectant',
    description:
      'Proiectare blaturi, Proliner, Bitrix24, standarde artGRANIT — plan 20 zile (4 săptămâni).',
    planAvailable: true,
    route: '/ingineri',
  },
  {
    id: 'productie',
    label: 'Producție',
    subtitle: 'Atelier & prelucrare',
    description:
      'Prelucrare piatră naturală, quartz, finisaje — plan de instruire în pregătire.',
    planAvailable: false,
    route: '/productie',
  },
  {
    id: 'administratie',
    label: 'Administrație',
    subtitle: 'Back-office & suport',
    description:
      'Procese administrative, documente, relații clienți — plan de instruire în pregătire.',
    planAvailable: false,
    route: '/administratie',
  },
  {
    id: 'management',
    label: 'Management',
    subtitle: 'Conducere & coordonare',
    description:
      'Coordonare echipe, indicatori, standarde calitate — plan de instruire în pregătire.',
    planAvailable: false,
    route: '/management',
  },
];

export function getDepartmentById(id: DepartmentId): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function getAvailableDepartments(): Department[] {
  return DEPARTMENTS.filter((d) => d.planAvailable);
}

/** Ruta de bază pentru planul unui departament */
export function departmentBasePath(id: DepartmentId): string {
  return getDepartmentById(id)?.route ?? '/';
}

/** Sub-rută în cadrul planului Ingineri (singurul activ momentan) */
export function ingineriPath(subpath = ''): string {
  const base = '/ingineri';
  if (!subpath) return base;
  return subpath.startsWith('/') ? `${base}${subpath}` : `${base}/${subpath}`;
}

export function isDepartmentPlanRoute(pathname: string): boolean {
  return DEPARTMENTS.some((d) => d.planAvailable && pathname.startsWith(d.route));
}

export function getDepartmentFromPath(pathname: string): Department | undefined {
  return DEPARTMENTS.find((d) => pathname === d.route || pathname.startsWith(`${d.route}/`));
}
