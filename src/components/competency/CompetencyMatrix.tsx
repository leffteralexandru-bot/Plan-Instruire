import { COMPETENCIES, scoreFromFeedback } from '@/data/competencies';
import { useProgress } from '@/hooks/useProgress';
import { Card } from '@/components/ui/Card';

export function CompetencyMatrix() {
  const { progress } = useProgress();
  const scores = scoreFromFeedback(progress?.feedbacks ?? []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COMPETENCIES.map((c) => {
        const score = scores[c.id as keyof typeof scores] ?? 0;
        const pct = score ? (score / 5) * 100 : 0;
        return (
          <Card key={c.id} padding="sm">
            <p className="text-sm font-medium text-corporate-dark">{c.label}</p>
            <p className="text-xs text-corporate-muted mb-2">Săpt. {c.weeks.join(', ')}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-corporate-accent">{score || '—'}</span>
              <span className="text-sm text-corporate-muted mb-1">/ 5</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-corporate-accent" style={{ width: `${pct}%` }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
