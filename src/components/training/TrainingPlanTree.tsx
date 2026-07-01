import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WeekPlan } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ingineriPath } from '@/data/departments';

interface TrainingPlanTreeProps {
  plan: WeekPlan[];
  isDayComplete: (dayId: string) => boolean;
  isDayUnlocked: (dayId: string) => boolean;
}

export function TrainingPlanTree({ plan, isDayComplete, isDayUnlocked }: TrainingPlanTreeProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(() => new Set(plan.map((w) => w.id)));

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  return (
    <div className="space-y-3" role="tree" aria-label="Plan instruire modular">
      {plan.map((week) => {
        const done = week.days.filter((d) => isDayComplete(d.id)).length;
        const expanded = expandedWeeks.has(week.id);
        return (
          <Card key={week.id} padding="sm" className="overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 text-left"
              onClick={() => toggleWeek(week.id)}
              aria-expanded={expanded}
            >
              <div>
                <p className="text-xs font-medium text-corporate-gold uppercase tracking-wide">
                  Săptămâna {week.weekNumber}
                </p>
                <h3 className="font-semibold text-corporate-dark">{week.title}</h3>
                <p className="text-sm text-corporate-muted mt-0.5">{week.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={done === week.days.length ? 'success' : 'default'}>
                  {done}/{week.days.length} zile
                </Badge>
                <span className="text-corporate-muted text-lg" aria-hidden>
                  {expanded ? '▾' : '▸'}
                </span>
              </div>
            </button>

            {expanded && (
              <ul className="mt-4 space-y-2 border-t border-corporate-border pt-3" role="group">
                {week.days.map((day) => {
                  const complete = isDayComplete(day.id);
                  const unlocked = isDayUnlocked(day.id);
                  return (
                    <li key={day.id}>
                      {unlocked ? (
                        <Link
                          to={ingineriPath(`/zi/${day.id}`)}
                          className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 hover:bg-corporate-surface transition-colors"
                        >
                          <DayRow dayNumber={day.dayNumber} title={day.title} materials={day.materials.length} complete={complete} />
                        </Link>
                      ) : (
                        <div className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 opacity-60">
                          <DayRow dayNumber={day.dayNumber} title={day.title} materials={day.materials.length} complete={false} locked />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function DayRow({
  dayNumber,
  title,
  materials,
  complete,
  locked,
}: {
  dayNumber: number;
  title: string;
  materials: number;
  complete: boolean;
  locked?: boolean;
}) {
  return (
    <>
      <div>
        <p className="text-sm font-medium text-corporate-dark">
          Ziua {dayNumber}: {title}
        </p>
        <p className="text-xs text-corporate-muted">
          {materials} materiale · instrucțiuni + șabloane
        </p>
      </div>
      {locked ? (
        <Badge variant="default">Blocată</Badge>
      ) : complete ? (
        <Badge variant="success">Finalizată</Badge>
      ) : (
        <Badge variant="info">În curs</Badge>
      )}
    </>
  );
}
