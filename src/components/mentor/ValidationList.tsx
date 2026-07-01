import type { DayPlan } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface ValidationListProps {
  days: DayPlan[];
  getDayProgress: (dayId: string) => {
    completedTasks: string[];
    mentorValidated: boolean;
    mentorNotes?: string;
    quizResult?: { score: number; total: number; passed: boolean; attempts: number };
  };
  onValidate: (dayId: string, validated: boolean, notes?: string) => void;
}

export function ValidationList({ days, getDayProgress, onValidate }: ValidationListProps) {
  const validationDays = days.filter((d) => d.requiresMentorValidation);

  if (validationDays.length === 0) {
    return (
      <Card>
        <p className="text-sm text-corporate-muted">Nu există zile care necesită validare.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {validationDays.map((day) => {
        const progress = getDayProgress(day.id);
        const tasksDone = day.tasks.every((t) => progress.completedTasks.includes(t.id));
        const canValidate = tasksDone || progress.mentorValidated;

        return (
          <Card key={day.id} className={progress.mentorValidated ? 'border-emerald-200' : ''}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="info">Ziua {day.dayNumber}</Badge>
                    {progress.mentorValidated ? (
                      <Badge variant="success">Validat</Badge>
                    ) : tasksDone ? (
                      <Badge variant="warning">Așteaptă validare</Badge>
                    ) : (
                      <Badge variant="locked">Task-uri incomplete</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-corporate-dark">{day.title}</h3>
                  <p className="text-sm text-corporate-muted">{day.mentorValidationLabel}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Activități: {progress.completedTasks.length}/{day.tasks.length}
                  </p>
                  {day.id === 'day-10' && progress.quizResult && (
                    <p className="text-xs mt-1">
                      Test teoretic:{' '}
                      <span className={progress.quizResult.passed ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                        {progress.quizResult.score}/{progress.quizResult.total}
                        {progress.quizResult.passed ? ' — Promovat' : ' — Nepromovat'}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <ValidationForm
                dayId={day.id}
                validated={progress.mentorValidated}
                notes={progress.mentorNotes}
                canValidate={canValidate}
                onValidate={onValidate}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ValidationForm({
  dayId,
  validated,
  notes: initialNotes,
  canValidate,
  onValidate,
}: {
  dayId: string;
  validated: boolean;
  notes?: string;
  canValidate: boolean;
  onValidate: (dayId: string, validated: boolean, notes?: string) => void;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const notes = (fd.get('notes') as string) || undefined;
    onValidate(dayId, true, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 pt-4">
      <Textarea
        name="notes"
        label="Note / Feedback mentor"
        placeholder="Observații despre performanța stagiarului..."
        defaultValue={initialNotes}
        disabled={validated}
      />
      <div className="flex gap-2">
        {!validated ? (
          <Button type="submit" variant="secondary" size="sm" disabled={!canValidate}>
            Validează ziua
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => onValidate(dayId, false)}>
            Revocă validarea
          </Button>
        )}
      </div>
    </form>
  );
}
