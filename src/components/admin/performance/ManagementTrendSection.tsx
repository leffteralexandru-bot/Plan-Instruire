import { formatManagementTrendMonth, type ManagementTrendPoint } from '@/lib/managementDashboard';
import {
  getManagementTrendTableRows,
  MANAGEMENT_TREND_COLUMNS,
} from '@/lib/managementDashboardPresentation';

const SERIES = [
  {
    key: 'eroriLuna' as const,
    label: MANAGEMENT_TREND_COLUMNS[0]!.shortLabel,
    fullLabel: MANAGEMENT_TREND_COLUMNS[0]!.label,
    stroke: '#f87171',
    fill: 'rgba(248, 113, 113, 0.12)',
  },
  {
    key: 'progresMediu' as const,
    label: MANAGEMENT_TREND_COLUMNS[1]!.shortLabel,
    fullLabel: MANAGEMENT_TREND_COLUMNS[1]!.label,
    stroke: '#b38f55',
    fill: 'rgba(179, 143, 85, 0.12)',
  },
  {
    key: 'evaluariFinalizate' as const,
    label: MANAGEMENT_TREND_COLUMNS[2]!.shortLabel,
    fullLabel: MANAGEMENT_TREND_COLUMNS[2]!.label,
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.12)',
  },
];

function formatTrendMonthLabel(luna: string, compact?: boolean): string {
  return formatManagementTrendMonth(luna, compact ? 'compact' : 'full');
}

function seriesValues(points: ManagementTrendPoint[], key: (typeof SERIES)[number]['key']): number[] {
  return points.map((p) => Number(p[key]) || 0);
}

function buildLinePath(values: number[], width: number, height: number, padY = 6): string {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const innerH = height - padY * 2;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * step;
      const y = padY + innerH - (value / max) * innerH;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildAreaPath(values: number[], width: number, height: number, padY = 6): string {
  const line = buildLinePath(values, width, height, padY);
  if (!line) return '';
  const baseline = height - padY;
  const lastX = values.length > 1 ? width : 0;
  return `${line} L${lastX},${baseline} L0,${baseline} Z`;
}

function deltaLabel(current: number, previous: number): string {
  const diff = current - previous;
  if (diff === 0) return '±0';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

interface ManagementTrendSectionProps {
  points: ManagementTrendPoint[];
  compact?: boolean;
}

export function ManagementTrendSection({ points, compact }: ManagementTrendSectionProps) {
  if (points.length === 0) return null;

  const latest = points[points.length - 1]!;
  const previous = points.length > 1 ? points[points.length - 2]! : latest;
  const trendTableRows = getManagementTrendTableRows(points);
  const chartW = 300;
  const chartH = compact ? 88 : 112;
  const hasActivity = points.some(
    (p) => p.eroriLuna > 0 || p.progresMediu > 0 || p.evaluariFinalizate > 0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={compact ? 'text-sm font-semibold text-corporate-dark' : 'text-sm font-semibold text-corporate-dark'}>
            Trend lunar
          </h3>
          <p className={compact ? 'text-[10px] text-corporate-muted mt-0.5' : 'text-xs text-corporate-muted mt-0.5'}>
            Evoluție ultimele {points.length} luni — erori, progres instruire, evaluări
          </p>
        </div>
        <p className="text-[10px] text-corporate-muted">
          Ultima lună:{' '}
          <span className="font-medium text-corporate-dark">
            {formatTrendMonthLabel(latest.luna, false)}
          </span>
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-3 gap-1.5' : 'grid gap-2 sm:grid-cols-3'}>
        {SERIES.map((series) => {
          const current = Number(latest[series.key]) || 0;
          const prev = Number(previous[series.key]) || 0;
          const suffix = series.key === 'progresMediu' ? '%' : '';
          return (
            <div
              key={series.key}
              className={[
                'rounded-lg border border-corporate-border/70 bg-white/80',
                compact ? 'px-2 py-1.5' : 'px-3 py-2',
              ].join(' ')}
            >
              <p className={compact ? 'text-[8px] uppercase tracking-wide text-corporate-muted' : 'text-[10px] uppercase tracking-wide text-corporate-muted'}>
                {series.label}
              </p>
              <p className={compact ? 'text-base font-bold text-corporate-dark mt-0.5' : 'text-xl font-bold text-corporate-dark mt-0.5'}>
                {current}
                {suffix}
              </p>
              <p className="text-[9px] text-corporate-muted mt-0.5">
                vs luna anterioară{' '}
                <span
                  className={
                    current === prev
                      ? 'text-corporate-muted'
                      : series.key === 'eroriLuna'
                        ? current > prev
                          ? 'text-red-600'
                          : 'text-emerald-600'
                        : current > prev
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                  }
                >
                  {deltaLabel(current, prev)}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-corporate-border/80 bg-gradient-to-b from-corporate-surface/40 to-white p-3">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {SERIES.map((series) => (
            <span key={series.key} className="inline-flex items-center gap-1.5 text-[10px] text-corporate-muted">
              <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: series.stroke }} aria-hidden />
              {series.fullLabel}
            </span>
          ))}
        </div>

        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full min-w-[260px]"
            role="img"
            aria-label="Grafic trend lunar erori, progres și evaluări"
          >
            {[0.25, 0.5, 0.75].map((ratio) => {
              const y = 6 + (chartH - 12) * (1 - ratio);
              return (
                <line
                  key={ratio}
                  x1={0}
                  y1={y}
                  x2={chartW}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.25)"
                  strokeWidth={0.5}
                />
              );
            })}
            {SERIES.map((series) => {
              const values = seriesValues(points, series.key);
              return (
                <g key={series.key}>
                  <path
                    d={buildAreaPath(values, chartW, chartH)}
                    fill={series.fill}
                  />
                  <path
                    d={buildLinePath(values, chartW, chartH)}
                    fill="none"
                    stroke={series.stroke}
                    strokeWidth={compact ? 1.75 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
            {points.map((point, index) => {
              const step = points.length > 1 ? chartW / (points.length - 1) : 0;
              const x = index * step;
              const showLabel =
                index === 0 || index === points.length - 1 || index % (compact ? 3 : 2) === 0;
              if (!showLabel) return null;
              return (
                <text
                  key={point.luna}
                  x={x}
                  y={chartH - 1}
                  textAnchor="middle"
                  className="fill-corporate-muted"
                  fontSize={compact ? 7 : 8}
                >
                  {formatTrendMonthLabel(point.luna, false)}
                </text>
              );
            })}
          </svg>
        </div>

        {!hasActivity && (
          <p className="text-[10px] text-corporate-muted mt-2 text-center italic">
            Nu există încă activitate înregistrată — graficul va reflecta datele pe măsură ce apar.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-corporate-border/70">
        <table className="w-full min-w-[280px] text-left">
          <thead>
            <tr className="border-b border-corporate-border bg-corporate-surface/50 text-[10px] uppercase tracking-wide text-corporate-muted">
              <th className="px-2 py-2 font-medium">Lună</th>
              {SERIES.map((s) => (
                <th key={s.key} className="px-2 py-2 font-medium text-right">
                  {compact ? s.label : s.fullLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trendTableRows.map((row) => (
              <tr key={row.luna} className="border-b border-corporate-border/50 text-xs">
                <td className="px-2 py-1.5 font-medium text-corporate-dark whitespace-nowrap">
                  {row.luna}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">{row.erori}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{row.progres}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{row.evaluari}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
