import { Link } from 'react-router-dom';
import type { DayPlan } from '@/types';
import { getWeekForDay } from '@/data/trainingPlan';
import { ingineriPath } from '@/data/departments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from './ProgressBar';

interface ResumeCardProps {
  day: DayPlan;
  completedTasks: number;
  totalTasks: number;
}

export function ResumeCard({ day, completedTasks, totalTasks }: ResumeCardProps) {
  const week = getWeekForDay(day.id);
  const percent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="border-corporate-gold/25 bg-gradient-to-br from-corporate-gold-light/80 to-white">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">Continuă aici</Badge>
            {week && <Badge variant="default">Săptămâna {week.weekNumber}</Badge>}
            <Badge variant="default">Ziua {day.dayNumber}</Badge>
          </div>
          <h2 className="text-lg font-semibold text-corporate-dark">{day.title}</h2>
          {day.subtitle && <p className="text-sm text-corporate-muted">{day.subtitle}</p>}
          <ProgressBar percent={percent} label={`${completedTasks}/${totalTasks} activități`} size="sm" />
        </div>
        <Link to={ingineriPath(`/zi/${day.id}`)} className="shrink-0">
          <Button variant="secondary" size="lg">
            Deschide ziua →
          </Button>
        </Link>
      </div>
    </Card>
  );
}
