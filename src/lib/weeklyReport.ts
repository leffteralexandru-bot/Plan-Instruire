import type { HrAggregateReport } from '@/lib/hrReport';
import { buildHrCsv } from '@/lib/exportReport';

function weekStamp(): string {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return start.toISOString().slice(0, 10);
}

/** Raport HR săptămânal — export CSV dedicat HR */
export function downloadWeeklyHrReport(report: HrAggregateReport): void {
  const csv = buildHrCsv(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `artgranit-raport-saptamanal-${weekStamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
