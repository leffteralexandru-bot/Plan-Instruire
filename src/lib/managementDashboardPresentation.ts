import {
  formatManagementTrendMonth,
  type ManagementDashboardMetrics,
  type ManagementTrendPoint,
} from '@/lib/managementDashboard';

export const MANAGEMENT_DASHBOARD_TITLE = 'Dashboard Management';

export const MANAGEMENT_DASHBOARD_SUBTITLE =
  'Retenție instruire · evaluări la timp · trend erori · gap-uri dezvoltare.';

export const MANAGEMENT_PDF_HELPER =
  'Document executiv branduit — KPI, trend, gap-uri și recomandări. Deschide direct în browser sau Acrobat.';

export interface ManagementKpiRow {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

/** Aceleași etichete și valori pe dashboard, mobil, desktop și PDF. */
export function getManagementKpiRows(metrics: ManagementDashboardMetrics): ManagementKpiRow[] {
  return [
    { label: 'Angajați activi', value: String(metrics.totalAngajati) },
    {
      label: 'Progres instruire mediu',
      value: `${metrics.progresInstruireMediu}%`,
      sub: `${metrics.angajatiInInstruire} în program`,
    },
    {
      label: 'Finalizare instruire',
      value: `${metrics.rataFinalizareInstruire}%`,
      sub: `${metrics.certificateEmise} certificate`,
      highlight: metrics.rataFinalizareInstruire < 50,
    },
    {
      label: 'Evaluări la timp',
      value: `${metrics.rataEvaluariLaTimp}%`,
      sub: `${metrics.evaluariIntarziate} întârziate`,
      highlight: metrics.evaluariIntarziate > 0,
    },
    {
      label: 'Erori luna curentă',
      value: String(metrics.eroriLunaCurenta),
      highlight: metrics.eroriLunaCurenta > 0,
    },
    {
      label: 'Planuri acțiune deschise',
      value: String(metrics.planuriActiuneDeschise),
      highlight: metrics.planuriActiuneDeschise > 0,
    },
    {
      label: 'Re-instruiri active',
      value: String(metrics.reInstruiriActive),
      highlight: metrics.reInstruiriActive > 0,
    },
    {
      label: 'Validări mentor',
      value: String(metrics.validariMentorPending),
      sub: 'pending',
      highlight: metrics.validariMentorPending > 0,
    },
  ];
}

export interface ManagementTrendTableRow {
  luna: string;
  erori: string;
  progres: string;
  evaluari: string;
}

/** Tabel trend — aceeași ordine cronologică peste tot (ca în PDF). */
export function getManagementTrendTableRows(
  trend: ManagementTrendPoint[],
): ManagementTrendTableRow[] {
  return trend.map((point) => ({
    luna: formatManagementTrendMonth(point.luna, 'full'),
    erori: String(point.eroriLuna),
    progres: `${point.progresMediu}%`,
    evaluari: String(point.evaluariFinalizate),
  }));
}

export const MANAGEMENT_TREND_COLUMNS = [
  { key: 'erori' as const, label: 'Erori / lună', shortLabel: 'Erori' },
  { key: 'progres' as const, label: 'Progres instruire', shortLabel: 'Progres %' },
  { key: 'evaluari' as const, label: 'Evaluări finalizate', shortLabel: 'Evaluări' },
];
