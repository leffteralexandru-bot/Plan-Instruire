import { Link } from 'react-router-dom';
import type { DayPlan, WeekPlan } from '@/types';
import { ingineriPath } from '@/data/departments';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from './ProgressBar';

interface WeekCardProps {
  week: WeekPlan;
  isDayComplete: (dayId: string) => boolean;
  isDayUnlocked: (dayId: string) => boolean;
  getDayProgress: (dayId: string) => { completedTasks: string[]; mentorValidated: boolean };
}

export function WeekCard({ week, isDayComplete, isDayUnlocked, getDayProgress }: WeekCardProps) {
  const completedCount = week.days.filter((d) => isDayComplete(d.id)).length;
  const percent = Math.round((completedCount / week.days.length) * 100);

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-corporate-accent">
                Săptămâna {week.weekNumber}
              </span>
              {percent === 100 && <Badge variant="success">Completă</Badge>}
            </div>
            <h3 className="text-lg font-semibold text-corporate-dark">{week.title}</h3>
            <p className="text-sm text-corporate-muted mt-1">{week.description}</p>
          </div>
        </div>

        <ProgressBar percent={percent} label={`${completedCount}/${week.days.length} zile`} size="sm" />

        <ul className="divide-y divide-slate-100">
          {week.days.map((day) => (
            <DayListItem
              key={day.id}
              day={day}
              complete={isDayComplete(day.id)}
              unlocked={isDayUnlocked(day.id)}
              progress={getDayProgress(day.id)}
            />
          ))}
        </ul>
      </div>
    </Card>
  );
}

function DayListItem({
  day,
  complete,
  unlocked,
  progress,
}: {
  day: DayPlan;
  complete: boolean;
  unlocked: boolean;
  progress: { completedTasks: string[]; mentorValidated: boolean };
}) {
  const tasksDone = progress.completedTasks.length;
  const tasksTotal = day.tasks.length;

  const content = (
    <div
      className={[
        'flex items-center gap-3 py-3 transition-colors',
        unlocked ? 'hover:bg-slate-50 -mx-2 px-2 rounded-xl' : 'opacity-50 cursor-not-allowed',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
          complete
            ? 'bg-emerald-100 text-emerald-700'
            : unlocked
              ? 'bg-slate-100 text-slate-600'
              : 'bg-slate-50 text-slate-400',
        ].join(' ')}
      >
        {complete ? '✓' : unlocked ? day.dayNumber : '🔒'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-corporate-dark">Ziua {day.dayNumber}</p>
          {day.requiresMentorValidation && (
            <Badge variant={progress.mentorValidated ? 'success' : 'warning'}>
              {progress.mentorValidated ? 'Validat mentor' : 'Necesită validare'}
            </Badge>
          )}
        </div>
        <p className="text-sm text-corporate-muted truncate">{day.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {tasksDone}/{tasksTotal} activități
        </p>
      </div>

      {unlocked && (
        <span className="text-slate-400 text-lg shrink-0" aria-hidden>
          →
        </span>
      )}
    </div>
  );

  if (!unlocked) return <li>{content}</li>;

  return (
    <li>
      <Link to={ingineriPath(`/zi/${day.id}`)} className="block">
        {content}
      </Link>
    </li>
  );
}
