import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';
import { PLATFORM_SETTINGS_ADMIN_NAME } from '@/lib/platformSettingsAdmin';

function inferMaterialType(file: File): Material['type'] {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')) return 'video';
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  return 'doc';
}

function TaskMaterialsEditor({
  materials,
  onChange,
  onUpload,
  onDownload,
  readOnly = false,
}: {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  onUpload: (file: File) => Promise<Material>;
  onDownload: (documentId: string) => Promise<void>;
  readOnly?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const mat = await onUpload(file);
      onChange([...materials, mat]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ml-1 pl-3 border-l-2 border-corporate-gold/30 space-y-2">
      <p className="text-[11px] font-medium text-corporate-muted">Materiale task (video, PDF, fișiere)</p>
      {materials.length > 0 && (
        <ul className="space-y-1.5">
          {materials.map((mat, idx) => (
            <li
              key={mat.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-corporate-border/50 bg-white px-2 py-1.5 text-xs"
            >
              <Badge variant="info">{mat.type}</Badge>
              <input
                className="flex-1 min-w-[100px] rounded border border-corporate-border px-2 py-1 text-xs"
                value={mat.title}
                readOnly={readOnly}
                onChange={(e) =>
                  onChange(materials.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                }
              />
              {mat.documentId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void onDownload(mat.documentId!)}
                >
                  Descarcă
                </Button>
              ) : (
                <span className="text-[10px] text-corporate-muted truncate max-w-[120px]">{mat.url}</span>
              )}
              {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => onChange(materials.filter((_, i) => i !== idx))}
              >
                Șterge
              </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
      <>
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.mp4,.webm,video/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
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
          {uploading ? 'Se încarcă…' : '+ Fișier / video'}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="Titlu link" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
        <Input placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            if (!linkUrl.trim() || !linkTitle.trim()) return;
            onChange([
              ...materials,
              trainingPlanStore.newLinkMaterial({ title: linkTitle.trim(), url: linkUrl.trim() }),
            ]);
            setLinkUrl('');
            setLinkTitle('');
          }}
        >
          + Link
        </Button>
      </div>
      </>
      )}
    </div>
  );
}

function DayEditor({
  day,
  onSaved,
  readOnly = false,
}: {
  day: DayPlan;
  onSaved: (msg: string) => void;
  readOnly?: boolean;
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

  const dayDraft = useMemo(
    () => ({ title, subtitle, tasks, materials }),
    [title, subtitle, tasks, materials],
  );
  const dayBaseline = useMemo(
    () => ({
      title: day.title,
      subtitle: day.subtitle ?? '',
      tasks: [...day.tasks],
      materials: [...day.materials],
    }),
    [day],
  );

  const { status: autoSaveStatus, flush: flushDaySave } = useAutoSave({
    draft: dayDraft,
    baseline: dayBaseline,
    enabled: !readOnly && !!user,
    save: (d) => {
      if (!user) return;
      trainingPlanStore.saveDayOverride(
        day.id,
        'ingineri',
        { title: d.title.trim(), subtitle: d.subtitle.trim() || undefined, tasks: d.tasks, materials: d.materials },
        user,
      );
    },
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await flushDaySave();
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

  const handleFileUpload = async (file: File): Promise<Material> => {
    if (!user) throw new Error('Neautentificat');
    const doc = await uploadDocument({
      file,
      tip: 'material_instruire',
      uploadedBy: user.id,
      uploadedByNume: user.name,
      dayId: day.id,
      departmentId: 'ingineri',
      folder: 'documentatie_baza',
    });
    return trainingPlanStore.newUploadedMaterial({
      title: file.name.replace(/\.[^.]+$/, ''),
      type: inferMaterialType(file),
      documentId: doc.id,
    });
  };

  const uploadTaskMaterial = async (file: File): Promise<Material> => {
    setUploading(true);
    try {
      return await handleFileUpload(file);
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
        {!readOnly && (
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Resetare standard
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving || autoSaveStatus === 'saving'}>
            {saving || autoSaveStatus === 'saving' ? 'Se salvează…' : 'Salvează ziua'}
          </Button>
          <AutoSaveStatusText className="hidden @md:block w-full" />
        </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Titlu zi" value={title} readOnly={readOnly} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Subtitlu" value={subtitle} readOnly={readOnly} onChange={(e) => setSubtitle(e.target.value)} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-corporate-dark">Task-uri zilnice</h4>
          {!readOnly && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setTasks((t) => [...t, trainingPlanStore.newTask()])}
          >
            + Task
          </Button>
          )}
        </div>
        <ul className="space-y-3">
          {tasks.map((task, idx) => (
            <li key={task.id} className="rounded-xl border border-corporate-border/70 p-3 space-y-2 bg-corporate-surface/30">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-corporate-border px-3 py-2 text-sm"
                  value={task.label}
                  readOnly={readOnly}
                  onChange={(e) =>
                    setTasks((t) => t.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Descriere task"
                />
                {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 shrink-0"
                  onClick={() => setTasks((t) => t.filter((_, i) => i !== idx))}
                >
                  Șterge
                </Button>
                )}
              </div>
              <TaskMaterialsEditor
                materials={task.materials ?? []}
                onUpload={uploadTaskMaterial}
                onDownload={downloadDocument}
                readOnly={readOnly}
                onChange={(mats) =>
                  setTasks((t) => t.map((x, i) => (i === idx ? { ...x, materials: mats } : x)))
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold text-corporate-dark">Materiale (video, PDF, documente)</h4>
          {!readOnly && (
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.mp4,.webm,video/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  void handleFileUpload(f).then((mat) => setMaterials((prev) => [...prev, mat]));
                }
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
          )}
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
                readOnly={readOnly}
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
              {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => setMaterials((m) => m.filter((_, i) => i !== idx))}
              >
                Șterge
              </Button>
              )}
            </li>
          ))}
          {materials.length === 0 && (
            <p className="text-sm text-corporate-muted">Niciun material — adăugați video, PDF sau link.</p>
          )}
        </ul>

        {!readOnly && (
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
        )}
      </section>
    </div>
  );
}

export function TrainingPlanEditor({ embedded }: { embedded?: boolean } = {}) {
  const { canEditTrainingPlan } = useAccessControl();
  const readOnly = !canEditTrainingPlan;
  const plan = useTrainingPlan();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const selectedDay = selectedDayId ? trainingPlanStore.getEffectiveDay(selectedDayId) : undefined;
  const overrideCount = trainingPlanStore.getOverrides().length;

  const panelContent = (
    <>
      <div className={embedded ? 'mt-4 mb-4' : 'mb-4'}>
        {!embedded && (
          <h2 className="text-lg font-semibold text-corporate-dark">
            Editor plan instruire — conținut zilnic
          </h2>
        )}
        <p className="text-sm text-corporate-muted mt-1">
          {readOnly ? (
            <>
              Vizualizare plan instruire — deschideți săptămânile și zilele pentru a consulta conținutul.
              Modificările se fac doar din contul {PLATFORM_SETTINGS_ADMIN_NAME}.
            </>
          ) : (
            <>
              Doar <strong>HR</strong> poate modifica conținutul. Pentru fiecare task puteți atașa video, PDF sau linkuri;
              materialele zilei rămân în secțiunea de mai jos.
            </>
          )}
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
        <DayEditor day={selectedDay} onSaved={(msg) => setMessage(msg)} readOnly={readOnly} />
      )}

      {message && <p className="text-sm text-emerald-600 mt-4">{message}</p>}
    </>
  );

  if (embedded) return panelContent;

  return <Card>{panelContent}</Card>;
}
