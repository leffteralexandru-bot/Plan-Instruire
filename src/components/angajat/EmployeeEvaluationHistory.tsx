import {
  buildCompletedEvaluationSummaries,
  formatEvaluationHistoryLine,
  formatEvaluationRoDate,
} from '@/lib/evaluationDisplay';
import type { EvaluationCycle } from '@/types';

interface EmployeeEvaluationHistoryProps {
  cycles: EvaluationCycle[];
  nextEvaluationDate?: string;
}

export function EmployeeEvaluationHistory({ cycles, nextEvaluationDate }: EmployeeEvaluationHistoryProps) {
  const items = [...buildCompletedEvaluationSummaries(cycles)].reverse();

  if (items.length === 0 && !nextEvaluationDate) return null;

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 text-sm text-corporate-dark"
            >
              {formatEvaluationHistoryLine(item)}
            </li>
          ))}
        </ul>
      )}
      {nextEvaluationDate && (
        <p className="text-xs text-indigo-900 px-1 pt-1">
          Următoarea evaluare: <strong>{formatEvaluationRoDate(nextEvaluationDate)}</strong>
        </p>
      )}
    </div>
  );
}
