import type { Material, Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useMaterialUrl } from '@/hooks/useMaterialUrl';

interface TaskChecklistProps {
  tasks: Task[];
  completedTasks: string[];
  onToggle: (taskId: string) => void;
  readOnly?: boolean;
}

const typeLabels: Record<Material['type'], string> = {
  pdf: 'PDF',
  video: 'Video',
  doc: 'Document',
  link: 'Link',
};

function TaskMaterialLinks({ materials }: { materials: Material[] }) {
  if (!materials.length) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {materials.map((mat) => (
        <TaskMaterialLink key={mat.id} mat={mat} />
      ))}
    </ul>
  );
}

function TaskMaterialLink({ mat }: { mat: Material }) {
  const { url, loading } = useMaterialUrl(mat);

  if (loading) {
    return (
      <li className="text-xs text-corporate-muted pl-1">Se încarcă {mat.title}…</li>
    );
  }

  if (!url) {
    return (
      <li className="text-xs text-amber-700 pl-1">{mat.title} — indisponibil</li>
    );
  }

  if (mat.type === 'video') {
    return (
      <li className="rounded-lg border border-slate-100 overflow-hidden bg-white">
        <p className="text-xs font-medium text-corporate-dark px-2 py-1.5 border-b border-slate-100">
          {typeLabels.video}: {mat.title}
        </p>
        <video controls className="w-full max-h-48 bg-black" src={url} preload="metadata">
          Browserul nu suportă redarea video.
        </video>
      </li>
    );
  }

  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-corporate-gold hover:underline"
      >
        <span aria-hidden>{mat.type === 'pdf' ? '📄' : mat.type === 'doc' ? '📝' : '🔗'}</span>
        {mat.title}
        <Badge variant="info" className="text-[9px] py-0">
          {typeLabels[mat.type]}
        </Badge>
      </a>
    </li>
  );
}

export function TaskChecklist({ tasks, completedTasks, onToggle, readOnly }: TaskChecklistProps) {
  const allDone = tasks.every((t) => completedTasks.includes(t.id));

  return (
    <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-corporate-dark">Checklist Activități</h2>
        <Badge variant={allDone ? 'success' : 'default'}>
          {completedTasks.length}/{tasks.length}
        </Badge>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => {
          const done = completedTasks.includes(task.id);
          const taskMaterials = task.materials ?? [];
          return (
            <li key={task.id}>
              <label
                className={[
                  'flex items-start gap-3 rounded-xl border p-4 transition-all',
                  done
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-100 bg-white hover:border-slate-200',
                  readOnly ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={readOnly}
                  onChange={() => !readOnly && onToggle(task.id)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-corporate-accent focus:ring-corporate-accent shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${done ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-corporate-dark'}`}
                  >
                    {task.label}
                  </p>
                  {task.description && (
                    <p className="text-xs text-corporate-muted mt-1">{task.description}</p>
                  )}
                  <TaskMaterialLinks materials={taskMaterials} />
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
