import { useCallback, useEffect, useRef, useState } from 'react';
import type { DayPlan, Material, Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { useAuth } from '@/hooks/useAuth';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useAccessControl } from '@/hooks/useAccessControl';
import { trainingPlanStore } from '@/lib/trainingPlanStore';
import { TRAINING_PLAN as STATIC_PLAN } from '@/data/trainingPlan';

function inferMaterialType(file: File): Material['type'] {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')) return 'video';
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  return 'doc';
}

function DayEditor({
  day,
  onSaved,
}: {
  day: DayPlan;
  onSaved: (msg: string) => void;
}) {
  const { user } = useAuth();
  const { uploadDocument, downloadDocument } = useHrPerformance();
  const fileRef = useRef<HTMLInputElement>(null);
  const staticDay = STATIC_PLAN.flatMap((w) => w.days).find((d) => d.id === day.id);
  const hasOverride = !!trainingPlanStore.getOverride(day.id);

  const [title, setTitle] = useState(day.title);
  const [subtitle, setSubtitle] = useState(day.subtitle ?? '');
  const [tasks, setTasks] = useState<Task[]>([...day.tasks]);
  const [materials, setMaterials] = useState<Material[]>([...day.materials]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const syncFromDay = useCallback(() => {
    setTitle(day.title);
    setSubtitle(day.subtitle ?? '');
    setTasks([...day.tasks]);
    setMaterials([...day.materials]);
  }, [day]);

  useEffect(() => {
    syncFromDay();
  }, [syncFromDay]);

  const handleSave = () => {
    if (!user) return;
    setSaving(true);
    try {
      trainingPlanStore.saveDayOverride(
        day.id,
        'ingineri',
        { title: title.trim(), subtitle: subtitle.trim() || undefined, tasks, materials },
        user,
      );
      onSaved(`Ziua ${day.dayNumber} salvată. Modificările apar imediat în planul angajaților.`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!user) return;
    if (!confirm('Reveniți la conținutul implicit al zilei? Modificările HR vor fi șterse.')) return;
    trainingPlanStore.resetDayOverride(day.id, user);
    if (staticDay) {
      setTitle(staticDay.title);
      setSubtitle(staticDay.subtitle ?? '');
      setTasks([...staticDay.tasks]);
      setMaterials([...staticDay.materials]);
    }
    onSaved(`Ziua ${day.dayNumber} resetată la versiunea standard.`);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const doc = await uploadDocument({
        file,
        tip: 'material_instruire',
        uploadedBy: user.id,
        uploadedByNume: user.name,
        dayId: day.id,
        departmentId: 'ingineri',
        folder: 'documentatie_baza',
      });
      const mat = trainingPlanStore.newUploadedMaterial({
        title: file.name.replace(/\.[^.]+$/, ''),
        type: inferMaterialType(file),
        documentId: doc.id,
      });
      setMaterials((prev) => [...prev, mat]);
    } finally {
      setUploading(false);
    }
  };

  const addLink = () => {
    if (!linkUrl.trim() || !linkTitle.trim()) return;
    setMaterials((prev) => [
      ...prev,
      trainingPlanStore.newLinkMaterial({ title: linkTitle.trim(), url: linkUrl.trim() }),
    ]);
    setLinkUrl('');
    setLinkTitle('');
  };

  return (
    <div className="space-y-5 border-t border-corporate-border pt-5 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-corporate-dark">
            Ziua {day.dayNumber} — {day.title}
          </h3>
          {hasOverride && (
            <p className="text-xs text-corporate-gold mt-0.5">Modificat de HR</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Resetare standard
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Se salvează…' : 'Salvează ziua'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Titlu zi" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Subtitlu" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-corporate-dark">Task-uri zilnice</h4>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setTasks((t) => [...t, trainingPlanStore.newTask()])}
          >
            + Task
          </Button>
        </div>
        <ul className="space-y-2">
          {tasks.map((task, idx) => (
            <li key={task.id} className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={task.label}
                onChange={(e) =>
                  setTasks((t) => t.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                }
                placeholder="Descriere task"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 shrink-0"
                onClick={() => setTasks((t) => t.filter((_, i) => i !== idx))}
              >
                Șterge
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold text-corporate-dark">Materiale (video, PDF, documente)</h4>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.mp4,.webm,video/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileUpload(f);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Se încarcă…' : 'Încarcă fișier'}
            </Button>
          </div>
        </div>

        <ul className="space-y-2 mb-4">
          {materials.map((mat, idx) => (
            <li
              key={mat.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-corporate-border/60 px-3 py-2 text-sm"
            >
              <Badge variant="info">{mat.type}</Badge>
              <input
                className="flex-1 min-w-[120px] rounded border border-corporate-border px-2 py-1"
                value={mat.title}
                onChange={(e) =>
                  setMaterials((m) =>
                    m.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                  )
                }
              />
              {mat.documentId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void downloadDocument(mat.documentId!)}
                >
                  Descarcă
                </Button>
              ) : (
                <span className="text-xs text-corporate-muted truncate max-w-[140px]">{mat.url}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => setMaterials((m) => m.filter((_, i) => i !== idx))}
              >
                Șterge
              </Button>
            </li>
          ))}
          {materials.length === 0 && (
            <p className="text-sm text-corporate-muted">Niciun material — adăugați video, PDF sau link.</p>
          )}
        </ul>

        <div className="grid gap-2 sm:grid-cols-3 p-3 rounded-xl bg-corporate-surface">
          <Input
            placeholder="Titlu link"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
          />
          <Input placeholder="URL (https://…)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <Button type="button" variant="secondary" size="sm" onClick={addLink}>
            Adaugă link
          </Button>
        </div>
      </section>
    </div>
  );
}

export function TrainingPlanEditor({ embedded }: { embedded?: boolean } = {}) {
  const { canEditTrainingPlan } = useAccessControl();
  const plan = useTrainingPlan();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const selectedDay = selectedDayId ? trainingPlanStore.getEffectiveDay(selectedDayId) : undefined;
  const overrideCount = trainingPlanStore.getOverrides().length;

  if (!canEditTrainingPlan) {
    return (
      <p className="text-sm text-amber-800 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        Planul de instruire poate fi modificat doar de <strong>Resurse Umane (HR)</strong>.
      </p>
    );
  }

  const panelContent = (
    <>
      <div className={embedded ? 'mt-4 mb-4' : 'mb-4'}>
        {!embedded && (
          <h2 className="text-lg font-semibold text-corporate-dark">
            Editor plan instruire — conținut zilnic
          </h2>
        )}
        <p className="text-sm text-corporate-muted mt-1">
          Doar <strong>HR</strong> poate modifica conținutul și încărca video/PDF pentru fiecare lecție (zi).
          Încărcați materialele potrivite zilei, apoi apăsați <strong>Salvează ziua</strong>.
          {overrideCount > 0 && (
            <span className="text-corporate-gold ml-1">({overrideCount} zile personalizate)</span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        {plan.map((week) => (
          <div key={week.id} className="rounded-xl border border-corporate-border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-corporate-surface hover:bg-corporate-gold-light/20 transition-colors"
              onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
            >
              <span className="font-medium text-corporate-dark">
                Săpt. {week.weekNumber} — {week.title}
              </span>
              <span className="text-corporate-muted text-sm">{week.days.length} zile</span>
            </button>
            {expandedWeek === week.weekNumber && (
              <div className="px-4 py-3 border-t border-corporate-border bg-white">
                <div className="flex flex-wrap gap-2">
                  {week.days.map((day) => {
                    const customized = !!trainingPlanStore.getOverride(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setSelectedDayId(day.id)}
                        className={[
                          'rounded-lg px-3 py-2 text-sm border transition-colors',
                          selectedDayId === day.id
                            ? 'border-corporate-gold bg-corporate-gold-light/40 font-medium'
                            : 'border-corporate-border hover:border-corporate-gold/50',
                        ].join(' ')}
                      >
                        Z{day.dayNumber}
                        {customized && ' ✦'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDay && (
        <DayEditor day={selectedDay} onSaved={(msg) => setMessage(msg)} />
      )}

      {message && <p className="text-sm text-emerald-600 mt-4">{message}</p>}
    </>
  );

  if (embedded) return panelContent;

  return <Card>{panelContent}</Card>;
}
