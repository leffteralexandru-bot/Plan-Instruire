import type { Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TaskChecklistProps {
  tasks: Task[];
  completedTasks: string[];
  onToggle: (taskId: string) => void;
  readOnly?: boolean;
}

export function TaskChecklist({ tasks, completedTasks, onToggle, readOnly }: TaskChecklistProps) {
  const allDone = tasks.every((t) => completedTasks.includes(t.id));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-corporate-dark">Checklist Activități</h2>
        <Badge variant={allDone ? 'success' : 'default'}>
          {completedTasks.length}/{tasks.length}
        </Badge>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);
          return (
            <li key={task.id}>
              <label
                className={[
                  'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all',
                  done
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-100 bg-white hover:border-slate-200',
                  readOnly ? 'cursor-default' : '',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={readOnly}
                  onChange={() => !readOnly && onToggle(task.id)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-corporate-accent focus:ring-corporate-accent"
                />
                <div>
                  <p className={`text-sm font-medium ${done ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-corporate-dark'}`}>
                    {task.label}
                  </p>
                  {task.description && (
                    <p className="text-xs text-corporate-muted mt-1">{task.description}</p>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
